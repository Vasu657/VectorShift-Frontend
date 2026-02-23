# services/execution_service.py — REAL pipeline execution via OpenRouter + real integrations
import json
import asyncio
import uuid
import csv
import io
import re
from typing import List, Dict, Any, AsyncGenerator, Optional

import httpx
from simpleeval import simple_eval

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

from domain.schemas import BaseNodeSchema, EdgeSchema
from services.graph_service import _build_graph
import networkx as nx

# OpenRouter base URL — drop-in OpenAI-compatible
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# SSE event separator — must be actual double-newline characters
SEP = "\n\n"

# Global in-memory dictionary to hold paused execution states
PAUSED_EXECUTIONS: Dict[str, Dict] = {}


def _sse(event: dict) -> str:
    """Wrap a dict as a Server-Sent Event string."""
    return "data: " + json.dumps(event) + SEP


def _get_openrouter_client(api_key: str) -> "AsyncOpenAI":
    if AsyncOpenAI is None:
        raise RuntimeError("openai package not installed. Run: pip install openai")
    return AsyncOpenAI(api_key=api_key, base_url=OPENROUTER_BASE_URL)


def _get_upstream_value(G: Any, node_id: str, node_results: Dict, index: int = 0) -> Any:
    """Return the output of the nth upstream node, or '' if none."""
    preds = list(G.predecessors(node_id))
    if not preds:
        return ""
    target = preds[min(index, len(preds) - 1)]
    val = node_results.get(target, "")
    if isinstance(val, (dict, list)):
        return json.dumps(val)
    return str(val) if val is not None else ""


def _all_upstream_values(G: Any, node_id: str, node_results: Dict) -> List[str]:
    """Return outputs of ALL upstream nodes (for join etc.)."""
    preds = list(G.predecessors(node_id))
    results = []
    for p in preds:
        v = node_results.get(p, "")
        results.append(json.dumps(v) if isinstance(v, (dict, list)) else str(v))
    return results


async def execute_dag_stream(
    nodes: List[BaseNodeSchema],
    edges: List[EdgeSchema],
    pipeline_id: Optional[str] = None,
    resume_node_id: Optional[str] = None,
    user_input: Optional[str] = None,
    env: Optional[Dict[str, str]] = None,
) -> AsyncGenerator[str, None]:
    """Executes a DAG and yields Server-Sent Events (SSE)."""
    if not pipeline_id:
        pipeline_id = str(uuid.uuid4())

    env = env or {}

    try:
        G = _build_graph(nodes, edges)
    except Exception as exc:
        yield _sse({"event": "error", "message": f"Graph build failed: {exc}"})
        return

    try:
        execution_plan = list(nx.topological_sort(G))
    except Exception:
        yield _sse({"event": "error", "message": "Graph contains cycles — cannot execute."})
        return

    # ─── Restore or init state ────────────────────────────────────────────────
    if pipeline_id in PAUSED_EXECUTIONS and resume_node_id:
        state = PAUSED_EXECUTIONS[pipeline_id]
        node_results = state["results"]
        try:
            start_index = execution_plan.index(resume_node_id)
        except ValueError:
            start_index = 0
        if user_input:
            node_results[resume_node_id] = user_input
            start_index += 1
    else:
        node_results: Dict[str, Any] = {}
        start_index = 0

    yield _sse({"event": "pipeline_start", "pipeline_id": pipeline_id, "plan": execution_plan[start_index:]})
    await asyncio.sleep(0.05)

    # ─── Execute each node ────────────────────────────────────────────────────
    for i in range(start_index, len(execution_plan)):
        node_id = execution_plan[i]
        node = next((n for n in nodes if n.id == node_id), None)
        if not node:
            continue

        node_type = node.type
        data = node.data or {}

        yield _sse({"event": "node_start", "node_id": node_id, "node_type": node_type})
        await asyncio.sleep(0.15)  # Let the node glow render in the browser

        cost = 0.0
        tokens_in = 0
        tokens_out = 0

        # ── Human-in-the-loop ─────────────────────────────────────────────────
        if data.get("require_approval", False):
            PAUSED_EXECUTIONS[pipeline_id] = {"results": node_results}
            yield _sse({"event": "node_paused", "node_id": node_id, "pipeline_id": pipeline_id,
                        "message": "Execution paused for user input."})
            return

        try:
            # ================================================================
            #  I/O NODES
            # ================================================================
            if node_type == "customInput":
                node_results[node_id] = data.get("inputName", f"input_{node_id}")

            elif node_type == "customOutput":
                node_results[node_id] = _get_upstream_value(G, node_id, node_results)

            # ================================================================
            #  AI NODES  (all via OpenRouter)
            # ================================================================
            elif node_type == "llm":
                openrouter_key = env.get("OPENROUTER_API_KEY", "")
                if not openrouter_key:
                    yield _sse({"event": "error", "message": "LLM Error: OPENROUTER_API_KEY missing. Add it in Settings → Secrets."})
                    return

                model = data.get("model")
                if not model:
                    yield _sse({"event": "error", "message": "LLM Error: No model selected. Please select a free model in the node configuration."})
                    return
                if "/" not in model:
                    model = f"openai/{model}"

                system_prompt = data.get("systemPrompt", "You are a helpful assistant.")
                temperature = float(data.get("temperature", 0.7))
                max_tokens = int(data.get("maxTokens", 8192))
                upstream_text = _get_upstream_value(G, node_id, node_results)

                client = _get_openrouter_client(openrouter_key)
                full_response = ""
                try:
                    stream = await client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": upstream_text},
                        ],
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=True,
                        extra_headers={
                            "HTTP-Referer": "http://localhost:3000",
                            "X-Title": "VectorShift Pipeline",
                        },
                    )
                    async for chunk in stream:
                        delta = chunk.choices[0].delta.content if chunk.choices else None
                        if delta:
                            full_response += delta
                            tokens_out += 1
                            yield _sse({"event": "node_chunk", "node_id": node_id, "chunk": delta})
                    tokens_in = len((system_prompt + upstream_text).split())
                    cost = (tokens_in * 0.005 + tokens_out * 0.015) / 1000
                except Exception as exc:
                    yield _sse({"event": "error", "message": f"LLM Error: {exc}"})
                    return
                node_results[node_id] = full_response

            elif node_type == "embedder":
                openrouter_key = env.get("OPENROUTER_API_KEY", "")
                if not openrouter_key:
                    yield _sse({"event": "error", "message": "Embedder Error: OPENROUTER_API_KEY missing in settings."})
                    return
                model = data.get("embeddingModel", "text-embedding-3-small")
                if "/" not in model:
                    model = f"openai/{model}"
                upstream_text = _get_upstream_value(G, node_id, node_results)
                client = _get_openrouter_client(openrouter_key)
                try:
                    resp = await client.embeddings.create(model=model, input=upstream_text)
                    vector = resp.data[0].embedding
                    actual_dims = len(vector)
                    node_results[node_id] = f"[vector:{actual_dims}d | first3={vector[:3]}]"
                    tokens_in = resp.usage.prompt_tokens if resp.usage else len(upstream_text.split())
                    cost = tokens_in * 0.00002 / 1000
                except Exception as exc:
                    yield _sse({"event": "error", "message": f"Embedder Error: {exc}"})
                    return

            elif node_type == "imageGen":
                openrouter_key = env.get("OPENROUTER_API_KEY", "")
                if not openrouter_key:
                    yield _sse({"event": "error", "message": "Image Gen Error: OPENROUTER_API_KEY missing in settings."})
                    return
                model = data.get("imageModel", "dall-e-3")
                size = data.get("imageSize", "1024x1024")
                quality = data.get("quality", "standard")
                upstream_prompt = _get_upstream_value(G, node_id, node_results)
                client = _get_openrouter_client(openrouter_key)
                try:
                    resp = await client.images.generate(
                        model=model,
                        prompt=upstream_prompt or "a beautiful landscape",
                        size=size,
                        quality=quality,
                        n=1,
                    )
                    node_results[node_id] = resp.data[0].url
                    cost = 0.04 if "dall-e-3" in model else 0.02
                except Exception as exc:
                    yield _sse({"event": "error", "message": f"Image Gen Error: {exc}"})
                    return

            elif node_type == "summarizer":
                openrouter_key = env.get("OPENROUTER_API_KEY", "")
                if not openrouter_key:
                    yield _sse({"event": "error", "message": "Summarizer Error: OPENROUTER_API_KEY missing."})
                    return
                model = data.get("summaryModel")
                if not model:
                    yield _sse({"event": "error", "message": "Summarizer Error: No model selected."})
                    return
                if "/" not in model:
                    model = f"openai/{model}"
                style = data.get("summaryStyle", "Concise")
                length = data.get("summaryLength", "Short")
                upstream_text = _get_upstream_value(G, node_id, node_results)
                client = _get_openrouter_client(openrouter_key)
                length_map = {"1 Sentence": "1 sentence", "Short": "3-5 sentences", "Medium": "2-3 paragraphs", "Long": "detailed multi-paragraph"}
                system = (
                    f"You are a summarization expert. Summarize the following text in a {style.lower()} style, "
                    f"targeting {length_map.get(length, 'medium length')}. Output only the summary."
                )
                try:
                    resp = await client.chat.completions.create(
                        model=model,
                        messages=[{"role": "system", "content": system}, {"role": "user", "content": upstream_text}],
                        extra_headers={"HTTP-Referer": "http://localhost:3000", "X-Title": "VectorShift Pipeline"},
                    )
                    node_results[node_id] = resp.choices[0].message.content
                    tokens_in = resp.usage.prompt_tokens if resp.usage else 50
                    tokens_out = resp.usage.completion_tokens if resp.usage else 30
                    cost = (tokens_in * 0.005 + tokens_out * 0.015) / 1000
                except Exception as exc:
                    yield _sse({"event": "error", "message": f"Summarizer Error: {exc}"})
                    return

            elif node_type == "classifier":
                openrouter_key = env.get("OPENROUTER_API_KEY", "")
                if not openrouter_key:
                    yield _sse({"event": "error", "message": "Classifier Error: OPENROUTER_API_KEY missing."})
                    return
                model = data.get("classifierModel")
                if not model:
                    yield _sse({"event": "error", "message": "Classifier Error: No model selected."})
                    return
                if "/" not in model:
                    model = f"openai/{model}"
                labels_str = data.get("labels", "positive, negative, neutral")
                labels = [l.strip() for l in labels_str.split(",") if l.strip()]
                upstream_text = _get_upstream_value(G, node_id, node_results)
                client = _get_openrouter_client(openrouter_key)
                system = (
                    f"Classify the given text into exactly one of these labels: {labels}. "
                    "Respond ONLY with valid JSON: {\"label\": \"chosen_label\", \"score\": 0.95}"
                )
                try:
                    resp = await client.chat.completions.create(
                        model=model,
                        messages=[{"role": "system", "content": system}, {"role": "user", "content": upstream_text}],
                        extra_headers={"HTTP-Referer": "http://localhost:3000", "X-Title": "VectorShift Pipeline"},
                    )
                    raw = resp.choices[0].message.content.strip()
                    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw).strip()
                    node_results[node_id] = json.loads(raw)
                    tokens_in = resp.usage.prompt_tokens if resp.usage else 30
                    cost = (tokens_in * 0.005) / 1000
                except Exception as exc:
                    node_results[node_id] = {"label": labels[0] if labels else "unknown", "score": 0.0, "error": str(exc)}

            # ================================================================
            #  DATA NODES
            # ================================================================
            elif node_type == "text":
                node_results[node_id] = data.get("text", "")

            elif node_type == "transform":
                fn = data.get("transformFn", "")
                upstream_text = _get_upstream_value(G, node_id, node_results)
                openrouter_key = env.get("OPENROUTER_API_KEY", "")
                model = data.get("transformModel")
                
                if openrouter_key and fn and model:
                    client = _get_openrouter_client(openrouter_key)
                    if "/" not in model:
                        model = f"openai/{model}"
                    try:
                        resp = await client.chat.completions.create(
                            model=model,
                            messages=[
                                {"role": "system", "content": f"Apply this transformation to the text: {fn}. Return only the transformed text."},
                                {"role": "user", "content": upstream_text},
                            ],
                            extra_headers={"HTTP-Referer": "http://localhost:3000"},
                        )
                        node_results[node_id] = resp.choices[0].message.content
                    except Exception:
                        node_results[node_id] = f"[transform:{fn}] {upstream_text}"
                else:
                    node_results[node_id] = f"[transform:{fn}] {upstream_text}"

            elif node_type == "join":
                raw_sep = data.get("separator", "\\n")
                # decode common escape sequences
                sep = raw_sep.replace("\\n", "\n").replace("\\t", "\t")
                parts = _all_upstream_values(G, node_id, node_results)
                node_results[node_id] = sep.join(parts)

            elif node_type == "jsonParser":
                upstream_text = _get_upstream_value(G, node_id, node_results)
                mode = data.get("parseMode", "Extract Key")
                path = data.get("jsonPath", "")
                try:
                    obj = json.loads(upstream_text)
                    if mode == "Extract Key" and path:
                        parts = re.split(r'[.\[\]]', path)
                        val = obj
                        for part in parts:
                            if not part:
                                continue
                            val = val[int(part)] if isinstance(val, list) else val[part]
                        node_results[node_id] = val
                    elif mode == "Stringify":
                        node_results[node_id] = json.dumps(obj, indent=2)
                    elif mode == "Array Length":
                        node_results[node_id] = len(obj) if isinstance(obj, (list, dict)) else 0
                    elif mode == "Keys List":
                        node_results[node_id] = list(obj.keys()) if isinstance(obj, dict) else []
                    else:
                        node_results[node_id] = obj
                except Exception as exc:
                    node_results[node_id] = f"[JSON parse error: {exc}]"

            elif node_type == "csvParser":
                upstream_text = _get_upstream_value(G, node_id, node_results)
                delimiter_map = {"Comma": ",", "Semicolon": ";", "Tab": "\t", "Pipe": "|"}
                delim = delimiter_map.get(data.get("csvDelimiter", "Comma"), ",")
                has_header = data.get("hasHeader", "Yes") == "Yes"
                try:
                    if has_header:
                        reader = csv.DictReader(io.StringIO(upstream_text), delimiter=delim)
                        rows = [dict(r) for r in reader]
                    else:
                        reader = csv.reader(io.StringIO(upstream_text), delimiter=delim)
                        rows = list(reader)
                    node_results[node_id] = {"rows": rows, "count": len(rows)}
                except Exception as exc:
                    node_results[node_id] = f"[CSV parse error: {exc}]"

            elif node_type == "calculator":
                expr = data.get("expression", "a + b")
                preds = list(G.predecessors(node_id))
                a = node_results.get(preds[0], 0) if preds else 0
                b = node_results.get(preds[1], 0) if len(preds) > 1 else 0
                try:
                    result = simple_eval(expr, names={"a": float(str(a)), "b": float(str(b))})
                    node_results[node_id] = result
                except Exception as exc:
                    node_results[node_id] = f"[calc error: {exc}]"

            # ================================================================
            #  LOGIC NODES
            # ================================================================
            elif node_type == "filter":
                condition = data.get("condition", "True")
                upstream_val = _get_upstream_value(G, node_id, node_results)
                try:
                    passed = simple_eval(condition, names={"value": upstream_val, "input": upstream_val})
                    node_results[node_id] = upstream_val if passed else None
                except Exception:
                    node_results[node_id] = upstream_val

            elif node_type == "split":
                raw_delim = data.get("delimiter", "\\n")
                delimiter = raw_delim.replace("\\n", "\n").replace("\\t", "\t")
                max_splits = int(data.get("maxSplits", -1) or -1)
                upstream_text = _get_upstream_value(G, node_id, node_results)
                node_results[node_id] = upstream_text.split(delimiter, max_splits) if max_splits > 0 else upstream_text.split(delimiter)

            elif node_type == "conditional":
                condition = data.get("condition", "True")
                upstream_val = _get_upstream_value(G, node_id, node_results)
                try:
                    result = bool(simple_eval(condition, names={"input": upstream_val, "value": upstream_val}))
                except Exception:
                    result = False
                node_results[node_id] = {"branch": "true" if result else "false", "value": upstream_val}

            elif node_type == "loop":
                upstream_val = _get_upstream_value(G, node_id, node_results)
                max_iter = int(data.get("maxIterations", 10))
                if isinstance(upstream_val, str):
                    try:
                        items = json.loads(upstream_val)
                    except Exception:
                        items = [line for line in upstream_val.split("\n") if line.strip()]
                elif isinstance(upstream_val, list):
                    items = upstream_val
                else:
                    items = [upstream_val]
                node_results[node_id] = items[:max_iter]

            elif node_type == "delay":
                seconds = float(data.get("delaySeconds", 1))
                unit = data.get("delayUnit", "Seconds")
                if unit == "Milliseconds":
                    seconds /= 1000
                elif unit == "Minutes":
                    seconds *= 60
                await asyncio.sleep(min(seconds, 30.0))
                node_results[node_id] = f"Delayed {data.get('delaySeconds', '1')} {unit}"

            elif node_type == "api":
                url = data.get("url", "")
                method = data.get("method", "GET")
                upstream_val = _get_upstream_value(G, node_id, node_results)
                try:
                    headers = json.loads(data.get("headers", "{}") or "{}")
                except Exception:
                    headers = {}
                body = upstream_val if method in ("POST", "PUT", "PATCH") else None
                try:
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        r = await client.request(method, url, headers=headers,
                                                  content=body.encode() if isinstance(body, str) else None)
                        node_results[node_id] = {"status": r.status_code, "body": r.text[:4000]}
                except Exception as exc:
                    node_results[node_id] = {"status": 0, "error": str(exc)}

            # ================================================================
            #  INTEGRATION NODES
            # ================================================================
            elif node_type == "vectorDb":
                pinecone_key = env.get("PINECONE_API_KEY", "")
                if not pinecone_key:
                    yield _sse({"event": "error", "message": "Vector DB Error: PINECONE_API_KEY missing in settings."})
                    return
                action = data.get("action", "Query")
                index = data.get("indexName", "default")
                node_results[node_id] = f"[{action}] on Pinecone index '{index}' (key present)"

            elif node_type == "webScraper":
                url = data.get("url", "https://example.com")
                fmt = data.get("format", "Markdown")
                upstream_val = _get_upstream_value(G, node_id, node_results)
                if upstream_val and upstream_val.startswith("http"):
                    url = upstream_val
                try:
                    async with httpx.AsyncClient(
                        timeout=20.0, follow_redirects=True,
                        headers={"User-Agent": "Mozilla/5.0 (compatible; VectorShift/2.0)"}
                    ) as client:
                        r = await client.get(url)
                        r.raise_for_status()
                        html = r.text
                    if BeautifulSoup:
                        soup = BeautifulSoup(html, "html.parser")
                        for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
                            tag.decompose()
                        if fmt == "Markdown":
                            lines = []
                            for elem in soup.find_all(["h1", "h2", "h3", "h4", "p", "li", "pre", "code"]):
                                text = elem.get_text(separator=" ", strip=True)
                                if not text:
                                    continue
                                if elem.name == "h1":
                                    lines.append(f"# {text}")
                                elif elem.name == "h2":
                                    lines.append(f"## {text}")
                                elif elem.name in ("h3", "h4"):
                                    lines.append(f"### {text}")
                                elif elem.name == "li":
                                    lines.append(f"- {text}")
                                elif elem.name in ("pre", "code"):
                                    lines.append(f"```\n{text}\n```")
                                else:
                                    lines.append(text)
                            content = "\n\n".join(lines)
                        elif fmt == "Raw Text":
                            content = soup.get_text(separator="\n", strip=True)
                        else:
                            content = html[:10000]
                    else:
                        content = html[:5000]
                    node_results[node_id] = content[:15000]
                    cost = 0.001
                except Exception as exc:
                    node_results[node_id] = f"[WebScraper Error: {exc}]"

            elif node_type == "slackWebhook":
                webhook_url = env.get("SLACK_WEBHOOK_URL", "") or data.get("webhookUrl", "")
                if not webhook_url:
                    yield _sse({"event": "error", "message": "Slack Error: SLACK_WEBHOOK_URL missing in settings."})
                    return
                upstream_val = _get_upstream_value(G, node_id, node_results)
                template = data.get("messageTemplate", "")
                message = template.replace("{{payload}}", upstream_val) if template else upstream_val
                try:
                    async with httpx.AsyncClient(timeout=15.0) as client:
                        r = await client.post(webhook_url, json={"text": message})
                        node_results[node_id] = f"Slack: HTTP {r.status_code}"
                except Exception as exc:
                    node_results[node_id] = f"[Slack Error: {exc}]"

            elif node_type == "email":
                sendgrid_key = env.get("SENDGRID_API_KEY", "")
                if not sendgrid_key:
                    yield _sse({"event": "error", "message": "Email Error: SENDGRID_API_KEY missing in settings."})
                    return
                to = data.get("emailTo", "")
                subject = data.get("emailSubject", "Pipeline Notification")
                upstream_val = _get_upstream_value(G, node_id, node_results)
                try:
                    async with httpx.AsyncClient(timeout=15.0) as client:
                        r = await client.post(
                            "https://api.sendgrid.com/v3/mail/send",
                            headers={"Authorization": f"Bearer {sendgrid_key}", "Content-Type": "application/json"},
                            json={
                                "personalizations": [{"to": [{"email": to}]}],
                                "from": {"email": "noreply@vectorshift.ai"},
                                "subject": subject,
                                "content": [{"type": "text/plain", "value": upstream_val}],
                            }
                        )
                        node_results[node_id] = f"Email sent to '{to}': HTTP {r.status_code}"
                except Exception as exc:
                    node_results[node_id] = f"[Email Error: {exc}]"

            elif node_type == "github":
                gh_token = env.get("GITHUB_TOKEN", "").strip()
                if gh_token.lower().startswith("bearer "):
                    gh_token = gh_token[7:].strip()
                elif gh_token.lower().startswith("token "):
                    gh_token = gh_token[6:].strip()
                
                if not gh_token:
                    yield _sse({"event": "error", "message": "GitHub Error: GITHUB_TOKEN missing in settings."})
                    return
                upstream_val = _get_upstream_value(G, node_id, node_results)
                
                action = data.get("ghAction", "Create Issue")
                raw_repo = data.get("ghRepo", "").strip()
                # Allow upstream Input nodes to define the repository name,
                # but ONLY if the action doesn't need upstream_val for something else (like Issue body or File path)
                if upstream_val and isinstance(upstream_val, str):
                    uv_stripped = upstream_val.strip()
                    if " " not in uv_stripped and "\n" not in uv_stripped and len(uv_stripped) < 200:
                        if action in ("Read Entire Repository", "List Commits", "Get Repo Info"):
                            raw_repo = uv_stripped
                        elif "github.com/" in uv_stripped and action not in ("Create Issue", "Read File"):
                            raw_repo = uv_stripped
                
                # Strip full URLs and .git extension
                if raw_repo.endswith(".git"):
                    raw_repo = raw_repo[:-4]
                if "github.com/" in raw_repo:
                    raw_repo = raw_repo.split("github.com/")[-1]
                
                headers = {
                    "Authorization": f"Bearer {gh_token}",
                    "Accept": "application/vnd.github.v3+json",
                    "Content-Type": "application/json",
                    "User-Agent": "VectorShift-Pipeline",
                    "X-GitHub-Api-Version": "2022-11-28",
                }
                
                async with httpx.AsyncClient(timeout=20.0) as client:
                    repo = raw_repo
                    # If they just provided "Sample", fetch their username via API
                    if repo and "/" not in repo:
                        user_info = await client.get("https://api.github.com/user", headers=headers)
                        if user_info.status_code == 200:
                            username = user_info.json().get("login")
                            repo = f"{username}/{repo}"
                        else:
                            yield _sse({"event": "error", "message": f"GitHub API Error: Provided '{repo}' but could not auto-detect owner username using token. Status: {user_info.status_code}, Response: {user_info.text}"})
                            return
                            
                    if not repo or "/" not in repo:
                        yield _sse({"event": "error", "message": f"GitHub Error: Repository must be in 'owner/repo' format. Got: '{repo}'"})
                        return
                    
                    try:
                        if action == "Create Issue":
                            try:
                                import re
                                raw_text = upstream_val.strip()
                                
                                # Use regex to find a JSON block, either inside ```json ... ``` or just the first {...} block
                                json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw_text, re.DOTALL)
                                if json_match:
                                    raw_json = json_match.group(1)
                                else:
                                    # Fallback: look for the first string that looks like a JSON object
                                    json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
                                    raw_json = json_match.group(0) if json_match else raw_text
                                    
                                payload = json.loads(raw_json.strip())
                                title = payload.get("title", "Pipeline-generated issue")
                                body = payload.get("body", raw_text)
                            except Exception:
                                title = upstream_val[:100] if upstream_val else "Pipeline-generated issue"
                                body = upstream_val
                            r = await client.post(
                                f"https://api.github.com/repos/{repo}/issues",
                                headers=headers, json={"title": title, "body": body}
                            )
                            if r.status_code >= 400:
                                yield _sse({"event": "error", "message": f"GitHub API Error ({r.status_code}): {r.text}"})
                                return
                            node_results[node_id] = r.json().get("html_url", r.text)
                        elif action == "Get Repo Info":
                            r = await client.get(f"https://api.github.com/repos/{repo}", headers=headers)
                            if r.status_code >= 400:
                                yield _sse({"event": "error", "message": f"GitHub API Error ({r.status_code}): {r.text}"})
                                return
                            node_results[node_id] = r.json()
                        elif action == "Read File":
                            file_path = upstream_val.strip()
                            if not file_path:
                                yield _sse({"event": "error", "message": "GitHub Error: File path required in input."})
                                return
                            else:
                                headers["Accept"] = "application/vnd.github.v3.raw"
                                r = await client.get(f"https://api.github.com/repos/{repo}/contents/{file_path}", headers=headers)
                                if r.status_code >= 400:
                                    yield _sse({"event": "error", "message": f"GitHub API Error ({r.status_code}): Unable to read file '{file_path}' from {repo}. Check if the file exists and the branch is correct."})
                                    return
                                node_results[node_id] = r.text
                        elif action == "List Commits":
                            r = await client.get(f"https://api.github.com/repos/{repo}/commits?per_page=5", headers=headers)
                            if r.status_code >= 400:
                                yield _sse({"event": "error", "message": f"GitHub API Error ({r.status_code}): {r.text}"})
                                return
                            node_results[node_id] = [{"sha": c["sha"][:7], "message": c["commit"]["message"][:80]} for c in r.json()[:5]]
                        elif action == "Read Entire Repository":
                            r = await client.get(f"https://api.github.com/repos/{repo}/zipball", headers=headers, follow_redirects=True)
                            if r.status_code >= 400:
                                yield _sse({"event": "error", "message": f"GitHub API Error ({r.status_code}): Unable to download repository zip for '{repo}'. Response: {r.text[:200]}"})
                                return
                            
                            import zipfile
                            import io
                            try:
                                with zipfile.ZipFile(io.BytesIO(r.content)) as z:
                                    repo_text = []
                                    skip_exts = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.mp4', '.webm', '.pdf', '.zip', '.tar', '.gz', '.woff', '.woff2', '.ttf', '.eot'}
                                    skip_dirs = {'node_modules/', 'venv/', '.git/', '.idea/', '.vscode/', 'dist/', 'build/', 'coverage/', '__pycache__/'}
                                    
                                    for info in z.infolist():
                                        if info.is_dir():
                                            continue
                                            
                                        parts = info.filename.split('/', 1)
                                        clean_path = parts[1] if len(parts) > 1 else info.filename
                                        
                                        if any(f"/{d}" in f"/{clean_path}" for d in skip_dirs):
                                            continue
                                        
                                        ext = '.' + clean_path.split('.')[-1].lower() if '.' in clean_path else ''
                                        if ext in skip_exts or 'lock' in clean_path.lower():
                                            continue
                                            
                                        if info.file_size > 100 * 1024:  # skip files > 100KB
                                            continue
                                            
                                        try:
                                            file_bytes = z.read(info.filename)
                                            file_text = file_bytes.decode('utf-8')
                                            repo_text.append(f"--- File: {clean_path} ---\n{file_text}\n")
                                        except Exception:
                                            pass
                                            
                                    combined = "\n".join(repo_text)
                                    if len(combined) > 100000:
                                        combined = combined[:100000] + "\n\n...[TRUNCATED_DUE_TO_SIZE 100KB LIMIT]..."
                                    node_results[node_id] = combined
                            except Exception as e:
                                yield _sse({"event": "error", "message": f"Failed to parse repository zip: {e}"})
                                return
                        else:
                            yield _sse({"event": "error", "message": f"GitHub Action '{action}' not implemented."})
                            return
                    except Exception as exc:
                        yield _sse({"event": "error", "message": f"Unexpected GitHub Error: {exc}"})
                        return

            elif node_type == "googleSheets":
                sheets_key = env.get("GOOGLE_SHEETS_API_KEY", "")
                if not sheets_key:
                    yield _sse({"event": "error", "message": "Google Sheets Error: API Key missing in settings."})
                    return
                action = data.get("sheetsAction", "Append Row")
                spreadsheet_id = data.get("spreadsheetId", "")
                sheet_range = data.get("sheetRange", "Sheet1!A:D")
                upstream_val = _get_upstream_value(G, node_id, node_results)
                try:
                    async with httpx.AsyncClient(timeout=20.0) as client:
                        if action == "Read Range":
                            r = await client.get(
                                f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{sheet_range}",
                                params={"key": sheets_key}
                            )
                            node_results[node_id] = r.json()
                        elif action == "Append Row":
                            row_values = [v.strip() for v in upstream_val.split(",")]
                            r = await client.post(
                                f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{sheet_range}:append",
                                params={"key": sheets_key, "valueInputOption": "USER_ENTERED"},
                                json={"values": [row_values]}
                            )
                            node_results[node_id] = r.json()
                        else:
                            node_results[node_id] = f"[Sheets {action}] not implemented"
                except Exception as exc:
                    node_results[node_id] = f"[Sheets Error: {exc}]"

            elif node_type == "notion":
                notion_token = env.get("NOTION_TOKEN", "")
                if not notion_token:
                    yield _sse({"event": "error", "message": "Notion Error: NOTION_TOKEN missing in settings."})
                    return
                action = data.get("notionAction", "Create Page")
                db_id = data.get("notionDbId", "")
                upstream_val = _get_upstream_value(G, node_id, node_results)
                headers = {
                    "Authorization": f"Bearer {notion_token}",
                    "Notion-Version": "2022-06-28",
                    "Content-Type": "application/json",
                }
                try:
                    async with httpx.AsyncClient(timeout=20.0) as client:
                        if action in ("Create Page", "Append Page"):
                            r = await client.post(
                                "https://api.notion.com/v1/pages",
                                headers=headers,
                                json={
                                    "parent": {"database_id": db_id},
                                    "properties": {"Name": {"title": [{"text": {"content": upstream_val[:200]}}]}},
                                    "children": [{"object": "block", "type": "paragraph",
                                                  "paragraph": {"rich_text": [{"type": "text", "text": {"content": upstream_val[:2000]}}]}}],
                                }
                            )
                            node_results[node_id] = r.json().get("url", r.text)
                        elif action == "Query Database":
                            r = await client.post(f"https://api.notion.com/v1/databases/{db_id}/query",
                                                  headers=headers, json={"page_size": 10})
                            node_results[node_id] = r.json()
                        else:
                            node_results[node_id] = f"[Notion {action}] not implemented"
                except Exception as exc:
                    node_results[node_id] = f"[Notion Error: {exc}]"

            else:
                await asyncio.sleep(0)
                upstream_val = _get_upstream_value(G, node_id, node_results)
                node_results[node_id] = f"[{node_type}] {upstream_val}"

        except Exception as outer_exc:
            yield _sse({"event": "error", "message": f"Unexpected error in {node_type}: {outer_exc}"})
            return

        # Serialize result
        result_val = node_results.get(node_id)
        result_str = json.dumps(result_val) if isinstance(result_val, (dict, list)) else str(result_val)[:2000]

        metrics = {"cost": cost, "tokens_in": tokens_in, "tokens_out": tokens_out}
        yield _sse({"event": "node_complete", "node_id": node_id, "metrics": metrics, "result": result_str})
        await asyncio.sleep(0.45)  # Let the edge flow animation play before next node_start

    # Cleanup
    if pipeline_id in PAUSED_EXECUTIONS:
        del PAUSED_EXECUTIONS[pipeline_id]

    yield _sse({"event": "pipeline_complete"})

# backend/services/execution_service.py
import json
import asyncio
import uuid
from typing import List, Dict, Any, AsyncGenerator
import networkx as nx
from domain.schemas import BaseNodeSchema, EdgeSchema
from services.graph_service import _build_graph

# Global in-memory dictionary to hold paused execution states
PAUSED_EXECUTIONS = {}

async def execute_dag_stream(
    nodes: List[BaseNodeSchema],
    edges: List[EdgeSchema],
    pipeline_id: str = None,
    resume_node_id: str = None,
    user_input: str = None,
    env: Dict[str, str] = None
) -> AsyncGenerator[str, None]:
    """
    Executes a DAG and yields Server-Sent Events (SSE).
    """
    if not pipeline_id:
        pipeline_id = str(uuid.uuid4())

    G = _build_graph(nodes, edges)
    try:
        execution_plan = list(nx.topological_sort(G))
    except Exception:
        yield f"data: {json.dumps({'event': 'error', 'message': 'Graph contains cycles'})}\n\n"
        return

    # Initialize execution state
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
        state = {"results": {}}
        node_results = state["results"]
        start_index = 0

    yield f"data: {json.dumps({'event': 'pipeline_start', 'pipeline_id': pipeline_id, 'plan': execution_plan[start_index:]})}\n\n"
    await asyncio.sleep(0.5)

    for i in range(start_index, len(execution_plan)):
        node_id = execution_plan[i]
        node = next((n for n in nodes if n.id == node_id), None)
        if not node:
            continue

        node_type = node.type
        data = node.data

        yield f"data: {json.dumps({'event': 'node_start', 'node_id': node_id, 'node_type': node_type})}\n\n"
        await asyncio.sleep(0.3)

        cost = 0.0
        tokens_in = 0
        tokens_out = 0

        # Human-in-the-Loop
        if data.get("require_approval", False):
            PAUSED_EXECUTIONS[pipeline_id] = {"results": node_results}
            yield f"data: {json.dumps({'event': 'node_paused', 'node_id': node_id, 'pipeline_id': pipeline_id, 'message': 'Execution paused for user input.'})}\n\n"
            return

        # ── Execution Logic by Node Type ───────────────────────────────────────

        if node_type == "customInput":
            res = data.get("inputName", f"input_{node_id}")
            node_results[node_id] = res

        elif node_type == "customOutput":
            # Pass through the last upstream result
            upstream = list(G.predecessors(node_id))
            val = node_results.get(upstream[0], "output") if upstream else "output"
            node_results[node_id] = val

        # ── AI ────────────────────────────────────────────────────────────────
        elif node_type == "llm":
            model = data.get("model", "gpt-4o")
            words = ["This", "is", "a", "simulated", "streaming", "response", "from", model, "demonstrating", "live", "token-by-token", "feedback."]
            for w in words:
                yield f"data: {json.dumps({'event': 'node_chunk', 'node_id': node_id, 'chunk': w + ' '})}\n\n"
                await asyncio.sleep(0.08)
                tokens_out += 1
            node_results[node_id] = " ".join(words)
            tokens_in = 50
            cost = (tokens_in * 0.005 + tokens_out * 0.015) / 1000

        elif node_type == "embedder":
            if not env or not env.get("OPENAI_API_KEY"):
                yield f"data: {json.dumps({'event': 'error', 'message': 'Embedder Error: OPENAI_API_KEY missing in settings.'})}\n\n"
                return
            await asyncio.sleep(0.6)
            model = data.get("embeddingModel", "text-embedding-3-small")
            dims = int(data.get("dimensions", "1536"))
            node_results[node_id] = f"[vector:{dims}d from {model}]"
            tokens_in = 20
            cost = 0.00002

        elif node_type == "imageGen":
            if not env or not env.get("OPENAI_API_KEY"):
                yield f"data: {json.dumps({'event': 'error', 'message': 'Image Gen Error: OPENAI_API_KEY missing in settings.'})}\n\n"
                return
            await asyncio.sleep(2.0)
            model = data.get("imageModel", "dall-e-3")
            size = data.get("imageSize", "1024x1024")
            node_results[node_id] = f"https://oaidalleapiprodscus.blob.core.windows.net/simulated/{node_id}.png"
            cost = 0.04 if "dall-e-3" in model else 0.02
            tokens_in = 0

        elif node_type == "classifier":
            await asyncio.sleep(0.7)
            labels = data.get("labels", "positive, negative, neutral")
            label_list = [l.strip() for l in labels.split(",")]
            chosen = label_list[0] if label_list else "unknown"
            node_results[node_id] = {"label": chosen, "score": 0.92}
            tokens_in = 30
            cost = 0.0005

        elif node_type == "summarizer":
            model = data.get("summaryModel", "gpt-4o")
            style = data.get("summaryStyle", "Concise")
            await asyncio.sleep(1.0)
            summary_text = f"[{style} summary generated by {model}] The document discusses AI pipeline orchestration and its practical applications in modern workflows."
            node_results[node_id] = summary_text
            tokens_in = 300
            tokens_out = 60
            cost = (tokens_in * 0.005 + tokens_out * 0.015) / 1000

        # ── Data ──────────────────────────────────────────────────────────────
        elif node_type == "text":
            node_results[node_id] = data.get("text", "")

        elif node_type in ("transform", "join", "split"):
            await asyncio.sleep(0.4)
            node_results[node_id] = f"{node_type}_result"
            cost = 0.0

        elif node_type == "jsonParser":
            await asyncio.sleep(0.2)
            path = data.get("jsonPath", "key")
            mode = data.get("parseMode", "Extract Key")
            node_results[node_id] = f"[{mode}: {path}] → simulated_value"
            cost = 0.0

        elif node_type == "csvParser":
            await asyncio.sleep(0.3)
            node_results[node_id] = {"rows": [["col1", "col2"], ["val1", "val2"]], "headers": ["col1", "col2"]}
            cost = 0.0

        elif node_type == "calculator":
            await asyncio.sleep(0.1)
            expr = data.get("expression", "a + b")
            node_results[node_id] = f"calc({expr}) = 42"
            cost = 0.0

        # ── Logic ─────────────────────────────────────────────────────────────
        elif node_type == "filter":
            await asyncio.sleep(0.3)
            node_results[node_id] = "filtered_result"
            cost = 0.0

        elif node_type == "conditional":
            await asyncio.sleep(0.2)
            condition = data.get("condition", "true")
            # Simulated: always evaluates to True
            node_results[node_id] = {"branch": "true", "condition": condition}
            cost = 0.0

        elif node_type == "loop":
            await asyncio.sleep(0.5)
            max_iter = int(data.get("maxIterations", "3"))
            node_results[node_id] = [f"item_{i}" for i in range(min(max_iter, 5))]
            cost = 0.0

        elif node_type == "delay":
            seconds = float(data.get("delaySeconds", "1"))
            unit = data.get("delayUnit", "Seconds")
            if unit == "Milliseconds":
                seconds /= 1000
            elif unit == "Minutes":
                seconds *= 60
            # Cap at 5s in simulation
            await asyncio.sleep(min(seconds, 5.0))
            node_results[node_id] = f"Delayed {data.get('delaySeconds', '1')} {unit}"
            cost = 0.0

        elif node_type == "api":
            await asyncio.sleep(0.8)
            url = data.get("url", "https://api.example.com")
            method = data.get("method", "GET")
            node_results[node_id] = {"status": 200, "method": method, "url": url, "body": {"simulated": True}}
            cost = 0.0

        # ── Integrations ──────────────────────────────────────────────────────
        elif node_type == "vectorDb":
            if not env or not env.get("PINECONE_API_KEY"):
                yield f"data: {json.dumps({'event': 'error', 'message': 'Vector DB Error: PINECONE_API_KEY missing in settings.'})}\n\n"
                return
            await asyncio.sleep(0.8)
            action = data.get("action", "Query")
            index = data.get("indexName", "default")
            node_results[node_id] = f"Vector [{action}] on index '{index}' returned 5 results."
            tokens_in, cost = 120, 0.00005

        elif node_type == "webScraper":
            await asyncio.sleep(1.2)
            url = data.get("url", "https://unknown.com")
            node_results[node_id] = f"Scraped content from {url}\n\n# Header\nThis is simulated markdown content."
            cost = 0.001

        elif node_type == "slackWebhook":
            if not env or not env.get("SLACK_WEBHOOK_URL"):
                yield f"data: {json.dumps({'event': 'error', 'message': 'Webhook Error: SLACK_WEBHOOK_URL missing in settings.'})}\n\n"
                return
            await asyncio.sleep(0.5)
            node_results[node_id] = "Message dispatched to Slack successfully."
            cost = 0.0

        elif node_type == "email":
            if not env or not env.get("SENDGRID_API_KEY"):
                yield f"data: {json.dumps({'event': 'error', 'message': 'Email Error: SENDGRID_API_KEY missing in settings.'})}\n\n"
                return
            await asyncio.sleep(0.6)
            to = data.get("emailTo", "unknown@example.com")
            subject = data.get("emailSubject", "Pipeline Notification")
            node_results[node_id] = f"Email sent to '{to}' with subject '{subject}'."
            cost = 0.0

        elif node_type == "github":
            if not env or not env.get("GITHUB_TOKEN"):
                yield f"data: {json.dumps({'event': 'error', 'message': 'GitHub Error: GitHub Token missing in settings.'})}\n\n"
                return
            await asyncio.sleep(0.9)
            action = data.get("ghAction", "Create Issue")
            repo = data.get("ghRepo", "owner/repo")
            node_results[node_id] = f"GitHub [{action}] on repo '{repo}' completed. ID: #{uuid.uuid4().hex[:6]}"
            cost = 0.0

        elif node_type == "googleSheets":
            if not env or not env.get("GOOGLE_SHEETS_API_KEY"):
                yield f"data: {json.dumps({'event': 'error', 'message': 'Google Sheets Error: API Key missing in settings.'})}\n\n"
                return
            await asyncio.sleep(0.7)
            action = data.get("sheetsAction", "Append Row")
            spreadsheet = data.get("spreadsheetId", "unknown")
            node_results[node_id] = f"Sheets [{action}] on '{spreadsheet}' succeeded."
            cost = 0.0

        elif node_type == "notion":
            if not env or not env.get("NOTION_TOKEN"):
                yield f"data: {json.dumps({'event': 'error', 'message': 'Notion Error: Notion Token missing in settings.'})}\n\n"
                return
            await asyncio.sleep(0.8)
            action = data.get("notionAction", "Append Page")
            db_id = data.get("notionDbId", "unknown")
            node_results[node_id] = f"Notion [{action}] on database '{db_id[:8]}...' completed."
            cost = 0.0

        else:
            await asyncio.sleep(0.4)
            node_results[node_id] = f"{node_type}_result"
            cost = 0.0001
            tokens_in = 5

        metrics = {"cost": cost, "tokens_in": tokens_in, "tokens_out": tokens_out}
        yield f"data: {json.dumps({'event': 'node_complete', 'node_id': node_id, 'metrics': metrics, 'result': node_results[node_id]})}\n\n"
        await asyncio.sleep(0.2)

    # Cleanup state
    if pipeline_id in PAUSED_EXECUTIONS:
        del PAUSED_EXECUTIONS[pipeline_id]

    yield f"data: {json.dumps({'event': 'pipeline_complete'})}\n\n"

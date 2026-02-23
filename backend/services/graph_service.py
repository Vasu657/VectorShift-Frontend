# services/graph_service.py — Graph analysis, validation, and layout services
import networkx as nx
from typing import List, Tuple, Dict, Any
from domain.schemas import BaseNodeSchema, EdgeSchema

# ─── Node type registry (mirrors frontend NodeRegistry) ───────────────────────

NODE_TYPE_META = {
    # ── I/O ───────────────────────────────────────────────────────────────────
    "customInput": {
        "label": "Input", "category": "I/O", "color": "green",
        "description": "Pipeline entry point — provides text or data into the graph.",
        "fields": [
            {"name": "inputName", "type": "text",   "label": "Variable Name", "required": True, "default": "input"},
            {"name": "inputType", "type": "select",  "label": "Type", "options": ["Text", "File", "Number", "Boolean"], "default": "Text"},
        ],
        "max_inputs": 0, "max_outputs": 1,
    },
    "customOutput": {
        "label": "Output", "category": "I/O", "color": "rose",
        "description": "Pipeline exit point — receives and exposes final results.",
        "fields": [
            {"name": "outputName", "type": "text",   "label": "Variable Name", "required": True, "default": "output"},
            {"name": "outputType", "type": "select",  "label": "Type", "options": ["Text", "File", "Number", "Boolean"], "default": "Text"},
        ],
        "max_inputs": 1, "max_outputs": 0,
    },

    # ── AI ────────────────────────────────────────────────────────────────────
    "llm": {
        "label": "LLM", "category": "AI", "color": "purple",
        "description": "Large Language Model inference node.",
        "fields": [
            {"name": "model", "type": "modelSelect", "label": "Model", "required": True, "default": ""},
        ],
        "max_inputs": 2, "max_outputs": 1,
    },
    "embedder": {
        "label": "Embedder", "category": "AI", "color": "violet",
        "description": "Converts text into dense vector embeddings.",
        "fields": [
            {"name": "embeddingModel", "type": "select", "label": "Embedding Model",
             "options": ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"], "default": "text-embedding-3-small"},
            {"name": "dimensions", "type": "select", "label": "Dimensions",
             "options": ["256", "512", "1024", "1536", "3072"], "default": "1536"},
        ],
        "max_inputs": 1, "max_outputs": 1,
    },
    "imageGen": {
        "label": "Image Gen", "category": "AI", "color": "pink",
        "description": "Generates images from a text prompt via DALL-E or Stable Diffusion.",
        "fields": [
            {"name": "imageModel", "type": "select", "label": "Model",
             "options": ["dall-e-3", "dall-e-2", "stable-diffusion-xl"], "default": "dall-e-3"},
            {"name": "imageSize", "type": "select", "label": "Size",
             "options": ["256x256", "512x512", "1024x1024", "1792x1024"], "default": "1024x1024"},
        ],
        "max_inputs": 1, "max_outputs": 1,
    },
    "classifier": {
        "label": "Classifier", "category": "AI", "color": "teal",
        "description": "Zero-shot text classification into custom labels.",
        "fields": [
            {"name": "classifierModel", "type": "modelSelect", "label": "Model", "default": ""},
            {"name": "labels", "type": "text", "label": "Labels (comma-separated)", "required": True, "default": "positive, negative, neutral"},
        ],
        "max_inputs": 1, "max_outputs": 2,
    },
    "summarizer": {
        "label": "Summarizer", "category": "AI", "color": "sky",
        "description": "Condenses long documents into concise summaries.",
        "fields": [
            {"name": "summaryModel", "type": "modelSelect", "label": "Model", "default": ""},
            {"name": "summaryStyle",  "type": "select", "label": "Style",
             "options": ["Concise", "Bullet Points", "Detailed", "ELI5"], "default": "Concise"},
            {"name": "summaryLength", "type": "select", "label": "Target Length",
             "options": ["1 Sentence", "Short", "Medium", "Long"], "default": "Short"},
        ],
        "max_inputs": 1, "max_outputs": 1,
    },

    # ── Data ──────────────────────────────────────────────────────────────────
    "text": {
        "label": "Text", "category": "Data", "color": "amber",
        "description": "Text template with {{variable}} interpolation.",
        "fields": [
            {"name": "text", "type": "textarea", "label": "Text Template", "required": True, "default": "{{input}}"},
        ],
        "max_inputs": -1, "max_outputs": 1,
    },
    "transform": {
        "label": "Transform", "category": "Data", "color": "amber",
        "description": "Applies a transformation function to its input data.",
        "fields": [
            {"name": "transformModel", "type": "modelSelect", "label": "Model", "default": ""},
            {"name": "transformFn", "type": "textarea", "label": "Transformation", "required": True, "default": ""},
        ],
        "max_inputs": 1, "max_outputs": 1,
    },
    "join": {
        "label": "Join", "category": "Data", "color": "amber",
        "description": "Merges two or more inputs into a single combined output.",
        "fields": [
            {"name": "separator", "type": "text", "label": "Separator", "default": "\\n"},
        ],
        "max_inputs": -1, "max_outputs": 1,
    },
    "jsonParser": {
        "label": "JSON Parser", "category": "Data", "color": "amber",
        "description": "Parses a JSON string and extracts a value via key path.",
        "fields": [
            {"name": "parseMode", "type": "select", "label": "Mode",
             "options": ["Extract Key", "Stringify", "Array Length", "Keys List"], "default": "Extract Key"},
            {"name": "jsonPath", "type": "text", "label": "Key Path", "default": ""},
        ],
        "max_inputs": 1, "max_outputs": 2,
    },
    "csvParser": {
        "label": "CSV Parser", "category": "Data", "color": "green",
        "description": "Parses a CSV string into rows and headers.",
        "fields": [
            {"name": "csvDelimiter", "type": "select", "label": "Delimiter",
             "options": ["Comma", "Semicolon", "Tab", "Pipe"], "default": "Comma"},
            {"name": "hasHeader", "type": "select", "label": "Has Header", "options": ["Yes", "No"], "default": "Yes"},
        ],
        "max_inputs": 1, "max_outputs": 2,
    },
    "calculator": {
        "label": "Calculator", "category": "Data", "color": "cyan",
        "description": "Evaluates a math expression from two inputs.",
        "fields": [
            {"name": "expression", "type": "text", "label": "Expression", "required": True, "default": "a + b"},
        ],
        "max_inputs": 2, "max_outputs": 1,
    },

    # ── Logic ─────────────────────────────────────────────────────────────────
    "filter": {
        "label": "Filter", "category": "Logic", "color": "cyan",
        "description": "Filters data — passes data only when the condition is met.",
        "fields": [
            {"name": "condition", "type": "text", "label": "Condition", "required": True, "default": ""},
        ],
        "max_inputs": 1, "max_outputs": 1,
    },
    "split": {
        "label": "Split", "category": "Logic", "color": "cyan",
        "description": "Splits a single input into multiple output streams.",
        "fields": [
            {"name": "delimiter", "type": "text", "label": "Delimiter", "default": "\\n"},
        ],
        "max_inputs": 1, "max_outputs": -1,
    },
    "api": {
        "label": "API Call", "category": "Logic", "color": "rose",
        "description": "Makes HTTP requests to external REST APIs.",
        "fields": [
            {"name": "method", "type": "select", "label": "Method",
             "options": ["GET", "POST", "PUT", "DELETE", "PATCH"], "default": "GET"},
            {"name": "url", "type": "text", "label": "URL", "required": True, "default": ""},
        ],
        "max_inputs": 1, "max_outputs": 1,
    },
    "conditional": {
        "label": "Conditional", "category": "Logic", "color": "orange",
        "description": "Branches execution into true or false paths.",
        "fields": [
            {"name": "condition", "type": "text", "label": "Condition", "required": True, "default": ""},
        ],
        "max_inputs": 1, "max_outputs": 2,
    },
    "loop": {
        "label": "Loop", "category": "Logic", "color": "indigo",
        "description": "Iterates over a list, emitting each item.",
        "fields": [
            {"name": "loopMode", "type": "select", "label": "Mode",
             "options": ["For Each", "While Condition", "Fixed Count"], "default": "For Each"},
            {"name": "maxIterations", "type": "text", "label": "Max Iterations", "default": "10"},
        ],
        "max_inputs": 1, "max_outputs": 2,
    },
    "delay": {
        "label": "Delay", "category": "Logic", "color": "slate",
        "description": "Pauses execution for a set duration.",
        "fields": [
            {"name": "delaySeconds", "type": "text", "label": "Duration", "default": "1"},
            {"name": "delayUnit", "type": "select", "label": "Unit",
             "options": ["Milliseconds", "Seconds", "Minutes"], "default": "Seconds"},
        ],
        "max_inputs": 1, "max_outputs": 1,
    },

    # ── Integrations ──────────────────────────────────────────────────────────
    "vectorDb": {
        "label": "Vector DB", "category": "Integrations", "color": "green",
        "description": "Query, upsert, or delete vectors from a Pinecone index.",
        "fields": [
            {"name": "action",    "type": "select", "label": "Action",
             "options": ["Query", "Upsert", "Delete"], "default": "Query"},
            {"name": "indexName", "type": "text",   "label": "Index Name", "required": True, "default": ""},
        ],
        "max_inputs": 1, "max_outputs": 1,
    },
    "webScraper": {
        "label": "Web Scraper", "category": "Integrations", "color": "cyan",
        "description": "Extracts content from any public webpage.",
        "fields": [
            {"name": "url",    "type": "text",   "label": "Target URL", "required": True, "default": ""},
            {"name": "format", "type": "select", "label": "Format",
             "options": ["Markdown", "Raw Text", "HTML"], "default": "Markdown"},
        ],
        "max_inputs": 1, "max_outputs": 1,
    },
    "slackWebhook": {
        "label": "Slack / Discord", "category": "Integrations", "color": "amber",
        "description": "Sends a message to Slack or Discord via webhook.",
        "fields": [
            {"name": "webhookUrl", "type": "text", "label": "Webhook URL", "required": True, "default": ""},
        ],
        "max_inputs": 1, "max_outputs": 1,
    },
    "email": {
        "label": "Email", "category": "Integrations", "color": "rose",
        "description": "Sends transactional email via SendGrid, SMTP, or Mailgun.",
        "fields": [
            {"name": "emailProvider", "type": "select", "label": "Provider",
             "options": ["SendGrid", "SMTP", "Mailgun", "Resend"], "default": "SendGrid"},
            {"name": "emailTo",       "type": "text",   "label": "To",      "required": True,  "default": ""},
            {"name": "emailSubject",  "type": "text",   "label": "Subject", "default": "Notification"},
        ],
        "max_inputs": 1, "max_outputs": 1,
    },
    "github": {
        "label": "GitHub", "category": "Integrations", "color": "slate",
        "description": "Interact with GitHub — create issues, read files, etc.",
        "fields": [
            {"name": "ghAction", "type": "select", "label": "Action",
             "options": ["Create Issue", "Create PR", "Read File", "List Commits", "Get Repo Info"],
             "default": "Create Issue"},
            {"name": "ghRepo", "type": "text", "label": "Repository (owner/repo)", "required": True, "default": ""},
        ],
        "max_inputs": 1, "max_outputs": 1,
    },
    "googleSheets": {
        "label": "Google Sheets", "category": "Integrations", "color": "green",
        "description": "Read from or write to a Google Sheet.",
        "fields": [
            {"name": "sheetsAction",  "type": "select", "label": "Action",
             "options": ["Append Row", "Read Range", "Update Cell", "Create Sheet"], "default": "Append Row"},
            {"name": "spreadsheetId","type": "text",   "label": "Spreadsheet ID", "required": True, "default": ""},
            {"name": "sheetRange",   "type": "text",   "label": "Range",           "default": "Sheet1!A:D"},
        ],
        "max_inputs": 1, "max_outputs": 1,
    },
    "notion": {
        "label": "Notion", "category": "Integrations", "color": "stone",
        "description": "Create or query pages in a Notion database.",
        "fields": [
            {"name": "notionAction", "type": "select", "label": "Action",
             "options": ["Append Page", "Create Page", "Query Database", "Update Page", "Get Page"],
             "default": "Create Page"},
            {"name": "notionDbId", "type": "text", "label": "Database / Page ID", "required": True, "default": ""},
        ],
        "max_inputs": 1, "max_outputs": 1,
    },
}


# ─── Build NetworkX graph ─────────────────────────────────────────────────────

def _build_graph(nodes: List[BaseNodeSchema], edges: List[EdgeSchema]) -> nx.DiGraph:
    G = nx.DiGraph()
    for node in nodes:
        G.add_node(node.id, type=node.type, data=node.data)
    for edge in edges:
        if edge.source in G and edge.target in G:
            G.add_edge(edge.source, edge.target,
                       sourceHandle=edge.sourceHandle,
                       targetHandle=edge.targetHandle)
    return G


# ─── Main analysis function ───────────────────────────────────────────────────

def calculate_pipeline_metrics(
    nodes: List[BaseNodeSchema],
    edges: List[EdgeSchema],
) -> dict:
    G = _build_graph(nodes, edges)
    is_dag = nx.is_directed_acyclic_graph(G)

    # Type counts
    type_counts: Dict[str, int] = {}
    for n in nodes:
        type_counts[n.type] = type_counts.get(n.type, 0) + 1

    # Source / sink / isolated
    source_ids = [n for n in G.nodes if G.in_degree(n) == 0 and G.out_degree(n) > 0]
    sink_ids   = [n for n in G.nodes if G.out_degree(n) == 0 and G.in_degree(n) > 0]
    isolated   = [n for n in G.nodes if G.degree(n) == 0]

    # Connected components (undirected view)
    components = nx.number_weakly_connected_components(G) if G.number_of_nodes() > 0 else 0

    # Longest path (only meaningful for DAGs) and Execution Plan
    longest = -1
    execution_plan = []
    if is_dag and G.number_of_nodes() > 0:
        try:
            longest = len(nx.dag_longest_path(G)) - 1
            execution_plan = list(nx.topological_sort(G))
        except Exception:
            longest = -1
            execution_plan = []

    # Node type booleans
    node_types = {n.type for n in nodes}
    has_input  = "customInput" in node_types
    has_output = "customOutput" in node_types

    # Warnings
    warnings: List[str] = []
    if not has_input:
        warnings.append("No Input node found — pipeline has no entry point.")
    if not has_output:
        warnings.append("No Output node found — pipeline has no exit point.")
    if not is_dag:
        warnings.append("Pipeline contains cycles — it is NOT a valid DAG.")
    if isolated:
        warnings.append(f"{len(isolated)} node(s) have no connections: {', '.join(isolated)}")
    if components > 1:
        warnings.append(f"Pipeline has {components} disconnected sub-graphs.")

    return {
        "num_nodes": len(nodes),
        "num_edges": len(edges),
        "is_dag": is_dag,
        "node_type_counts": type_counts,
        "source_nodes": source_ids,
        "sink_nodes": sink_ids,
        "isolated_nodes": isolated,
        "connected_components": components,
        "longest_path": longest,
        "has_input_node": has_input,
        "has_output_node": has_output,
        "warnings": warnings,
        "execution_plan": execution_plan,
    }


# ─── Validation function ──────────────────────────────────────────────────────

def validate_pipeline(
    nodes: List[BaseNodeSchema],
    edges: List[EdgeSchema],
) -> dict:
    errors = []
    warnings_list = []

    G = _build_graph(nodes, edges)

    for node in nodes:
        meta = NODE_TYPE_META.get(node.type)
        if not meta:
            errors.append({
                "node_id": node.id,
                "node_type": node.type,
                "field": "type",
                "message": f"Unknown node type '{node.type}'.",
            })
            continue

        # Check required fields
        for field in meta.get("fields", []):
            if field.get("required"):
                val = node.data.get(field["name"])
                if val is None or (isinstance(val, str) and not val.strip()):
                    errors.append({
                        "node_id": node.id,
                        "node_type": node.type,
                        "field": field["name"],
                        "message": f"Required field '{field['label']}' is empty.",
                    })

        # Check input degree against max_inputs
        # IMPORTANT: account for user-added extra input handles (data.extraInputs)
        extra_inputs  = node.data.get("extraInputs",  []) if isinstance(node.data, dict) else []
        extra_outputs = node.data.get("extraOutputs", []) if isinstance(node.data, dict) else []

        # Validate extra handle name format
        import re
        for h_name in extra_inputs + extra_outputs:
            if not isinstance(h_name, str) or not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', h_name):
                warnings_list.append(
                    f"Node '{node.id}': extra handle '{h_name}' has an invalid name "
                    f"(use letters, numbers, underscores only)."
                )

        # Effective max_inputs = static limit + number of extra input handles added
        max_in = meta.get("max_inputs", -1)
        effective_max_in = -1 if max_in < 0 else max_in + len(extra_inputs)
        in_deg = G.in_degree(node.id)
        if effective_max_in >= 0 and in_deg > effective_max_in:
            warnings_list.append(
                f"Node '{node.id}' ({node.type}) has {in_deg} connections but "
                f"supports at most {effective_max_in} "
                f"({max_in} built-in + {len(extra_inputs)} custom)."
            )

        # Similarly track extra outputs for informational purposes
        max_out = meta.get("max_outputs", -1)
        out_deg = G.out_degree(node.id)
        effective_max_out = -1 if max_out < 0 else max_out + len(extra_outputs)
        if effective_max_out >= 0 and out_deg > effective_max_out:
            warnings_list.append(
                f"Node '{node.id}' ({node.type}) has {out_deg} outgoing connections "
                f"but supports at most {effective_max_out}."
            )

        # Orphan check (no edges, not an isolated input/output node)
        if G.degree(node.id) == 0 and len(nodes) > 1:
            warnings_list.append(f"Node '{node.id}' ({node.type}) is disconnected.")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings_list,
    }



# ─── Node-types registry ──────────────────────────────────────────────────────

def get_node_types() -> list:
    result = []
    for type_key, meta in NODE_TYPE_META.items():
        result.append({
            "type": type_key,
            "label": meta["label"],
            "category": meta["category"],
            "color": meta["color"],
            "description": meta["description"],
            "fields": [
                {
                    "name": f["name"],
                    "type": f["type"],
                    "label": f["label"],
                    "required": f.get("required", False),
                    "options": f.get("options"),
                    "default": f.get("default"),
                }
                for f in meta.get("fields", [])
            ],
            "max_inputs": meta["max_inputs"],
            "max_outputs": meta["max_outputs"],
        })
    return result


# ─── Server-side Dagre-style layout ──────────────────────────────────────────

def compute_auto_layout(
    nodes: List[BaseNodeSchema],
    edges: List[EdgeSchema],
    direction: str = "LR",
) -> list:
    """
    Compute positions using a topological-sort-based layering algorithm.
    Returns a list of {id, position: {x, y}} dicts.
    """
    if not nodes:
        return []

    G = _build_graph(nodes, edges)

    NODE_W = 300  # assumed node width + horizontal gap
    NODE_H = 180  # assumed node height + vertical gap

    # Assign layers via longest path from sources
    layer: Dict[str, int] = {}
    try:
        for node_id in nx.topological_sort(G):
            preds = list(G.predecessors(node_id))
            layer[node_id] = (max(layer[p] for p in preds) + 1) if preds else 0
    except nx.NetworkXUnfeasible:
        # Has cycles — fall back to simple row layout
        for i, node in enumerate(nodes):
            layer[node.id] = i

    # Group by layer
    layers: Dict[int, List[str]] = {}
    for node_id, l in layer.items():
        layers.setdefault(l, []).append(node_id)

    positioned = []
    for l_idx, node_ids in sorted(layers.items()):
        for row_idx, node_id in enumerate(node_ids):
            if direction == "TB":
                x = row_idx * NODE_W + 60
                y = l_idx * NODE_H + 60
            else:  # LR (default)
                x = l_idx * NODE_W + 60
                y = row_idx * NODE_H + 60
            positioned.append({"id": node_id, "position": {"x": x, "y": y}})

    return positioned

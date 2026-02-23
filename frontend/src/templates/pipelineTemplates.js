// templates/pipelineTemplates.js — Comprehensive templates for every node type
export const PIPELINE_TEMPLATES = [

    // ─── AI ───────────────────────────────────────────────────────────────────

    {
        id: 'rag-chatbot',
        name: 'RAG Knowledge Base',
        emoji: '🧠',
        description: 'A retrieval-augmented generation pipeline that scrapes a URL, embeds the content, stores vectors in Pinecone, then answers user questions via GPT-4o.',
        category: 'AI',
        color: 'purple',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 300 }, data: { inputName: 'user_question', inputType: 'Text' } },
            { id: 'n2', type: 'webScraper', position: { x: 40, y: 80 }, data: { url: 'https://docs.example.com', format: 'Markdown' } },
            { id: 'n3', type: 'embedder', position: { x: 300, y: 80 }, data: { embeddingModel: 'text-embedding-3-small', dimensions: '1536' } },
            { id: 'n4', type: 'vectorDb', position: { x: 560, y: 80 }, data: { action: 'Upsert', indexName: 'docs-index' } },
            { id: 'n5', type: 'vectorDb', position: { x: 560, y: 300 }, data: { action: 'Query', indexName: 'docs-index' } },
            { id: 'n6', type: 'llm', position: { x: 820, y: 190 }, data: { model: '', systemPrompt: 'Answer using the provided context only.' } },
            { id: 'n7', type: 'customOutput', position: { x: 1060, y: 190 }, data: { outputName: 'answer', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n5' },  // user question → VectorDB Query
            { id: 'e2', source: 'n1', target: 'n6' },  // user question → LLM prompt
            { id: 'e3', source: 'n2', target: 'n3' },  // WebScraper → Embedder
            { id: 'e4', source: 'n3', target: 'n4' },  // Embedder → VectorDB Upsert
            { id: 'e5', source: 'n4', target: 'n5' },  // Upsert done → Query (ordering)
            { id: 'e6', source: 'n5', target: 'n6' },  // retrieved context → LLM
            { id: 'e7', source: 'n6', target: 'n7' },  // LLM → Output
        ],
    },

    {
        id: 'llm-chain',
        name: 'LLM Chain',
        emoji: '⛓️',
        description: 'Two LLMs chained together — the first drafts a response, the second critiques and improves it before final output.',
        category: 'AI',
        color: 'purple',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 200 }, data: { inputName: 'topic', inputType: 'Text' } },
            { id: 'n2', type: 'llm', position: { x: 260, y: 200 }, data: { model: '', systemPrompt: 'Write a first draft about the given topic.' } },
            { id: 'n3', type: 'llm', position: { x: 520, y: 200 }, data: { model: '', systemPrompt: 'Critique and improve the following draft.' } },
            { id: 'n4', type: 'customOutput', position: { x: 760, y: 200 }, data: { outputName: 'final_draft', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
        ],
    },

    {
        id: 'image-gen-pipeline',
        name: 'Image Generator',
        emoji: '🎨',
        description: 'Takes a topic from input, summarizes it into a concise prompt via LLM, then generates an image with DALL-E 3.',
        category: 'AI',
        color: 'pink',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 180 }, data: { inputName: 'concept', inputType: 'Text' } },
            { id: 'n2', type: 'llm', position: { x: 260, y: 180 }, data: { model: '', systemPrompt: 'Convert this concept into a detailed, vivid image generation prompt.' } },
            { id: 'n3', type: 'imageGen', position: { x: 520, y: 180 }, data: { imageModel: 'dall-e-3', imageSize: '1024x1024', quality: 'hd' } },
            { id: 'n4', type: 'customOutput', position: { x: 760, y: 180 }, data: { outputName: 'image_url', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
        ],
    },

    {
        id: 'sentiment-classifier',
        name: 'Sentiment Classifier',
        emoji: '😊',
        description: 'Classifies incoming text as positive, negative, or neutral using zero-shot classification, then routes it via conditional branching.',
        category: 'AI',
        color: 'cyan',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 180 }, data: { inputName: 'review_text', inputType: 'Text' } },
            { id: 'n2', type: 'classifier', position: { x: 260, y: 180 }, data: { labels: 'positive, negative, neutral' } },
            { id: 'n3', type: 'conditional', position: { x: 500, y: 180 }, data: { condition: 'input.label === "positive"' } },
            { id: 'n4', type: 'customOutput', position: { x: 740, y: 80 }, data: { outputName: 'positive_route', outputType: 'Text' } },
            { id: 'n5', type: 'customOutput', position: { x: 740, y: 300 }, data: { outputName: 'other_route', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },  // true branch → positive output
            { id: 'e4', source: 'n3', target: 'n5' },  // false branch → other output
        ],
    },

    {
        id: 'auto-summarizer',
        name: 'Document Summarizer',
        emoji: '📋',
        // FIX: webScraper now has a hardcoded url default; Input feeds the dynamic URL override
        description: 'Takes a URL as input, scrapes the page content, then runs it through a dedicated summarizer node to produce bullet-point output.',
        category: 'AI',
        color: 'sky',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 180 }, data: { inputName: 'url', inputType: 'Text' } },
            { id: 'n2', type: 'webScraper', position: { x: 260, y: 180 }, data: { url: 'https://example.com', format: 'Raw Text' } },
            { id: 'n3', type: 'summarizer', position: { x: 500, y: 180 }, data: { summaryModel: '', summaryStyle: 'Bullet Points', summaryLength: 'Medium' } },
            { id: 'n4', type: 'customOutput', position: { x: 740, y: 180 }, data: { outputName: 'summary', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
        ],
    },

    {
        id: 'embedding-pipeline',
        name: 'Text Embedding',
        emoji: '🔢',
        description: 'Converts a piece of text into a dense vector embedding using OpenAI embeddings, then stores the result in a Pinecone vector database.',
        category: 'AI',
        color: 'violet',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 180 }, data: { inputName: 'text_chunk', inputType: 'Text' } },
            { id: 'n2', type: 'embedder', position: { x: 280, y: 180 }, data: { embeddingModel: 'text-embedding-3-small', dimensions: '1536' } },
            { id: 'n3', type: 'vectorDb', position: { x: 520, y: 180 }, data: { action: 'Upsert', indexName: 'my-embeddings' } },
            { id: 'n4', type: 'customOutput', position: { x: 760, y: 180 }, data: { outputName: 'vector_id', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
        ],
    },

    // ─── Integrations ─────────────────────────────────────────────────────────

    {
        id: 'slack-alert',
        name: 'Slack Notifier',
        emoji: '📣',
        description: 'Processes input, generates a formatted summary with an LLM, then sends the message directly to a Slack or Discord channel.',
        category: 'Integrations',
        color: 'amber',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 180 }, data: { inputName: 'event_data', inputType: 'Text' } },
            { id: 'n2', type: 'llm', position: { x: 260, y: 180 }, data: { model: '', systemPrompt: 'Format this data as a short, readable Slack message.' } },
            { id: 'n3', type: 'slackWebhook', position: { x: 500, y: 180 }, data: { webhookUrl: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL' } },
            { id: 'n4', type: 'customOutput', position: { x: 740, y: 180 }, data: { outputName: 'send_status', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
        ],
    },

    {
        id: 'email-digest',
        name: 'Email Digest',
        emoji: '📧',
        description: 'Reads two data inputs, joins them together, generates an email body via LLM, and dispatches it via SendGrid.',
        category: 'Integrations',
        color: 'rose',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 80 }, data: { inputName: 'item_1', inputType: 'Text' } },
            { id: 'n2', type: 'customInput', position: { x: 40, y: 280 }, data: { inputName: 'item_2', inputType: 'Text' } },
            { id: 'n3', type: 'join', position: { x: 260, y: 180 }, data: { separator: '\n\n' } },
            { id: 'n4', type: 'llm', position: { x: 480, y: 180 }, data: { model: '', systemPrompt: 'Compose a professional email digest from these items.' } },
            { id: 'n5', type: 'email', position: { x: 720, y: 180 }, data: { emailProvider: 'SendGrid', emailTo: 'recipient@example.com', emailSubject: 'Daily Digest' } },
            { id: 'n6', type: 'customOutput', position: { x: 940, y: 180 }, data: { outputName: 'email_status', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n3' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
            { id: 'e4', source: 'n4', target: 'n5' },
            { id: 'e5', source: 'n5', target: 'n6' },
        ],
    },

    {
        id: 'github-issue-bot',
        name: 'GitHub Code Reviewer',
        emoji: '🐙',
        description: 'Fetches an entire codebase from a repository, analyzes the architecture and code for bugs via LLM, and automatically creates a GitHub issue with the findings.',
        category: 'Integrations',
        color: 'indigo',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 180 }, data: { inputName: 'repository_name', inputType: 'Text' } },
            { id: 'n2', type: 'github', position: { x: 260, y: 180 }, data: { ghAction: 'Read Entire Repository', ghRepo: 'Sample' } },
            { id: 'n3', type: 'llm', position: { x: 480, y: 180 }, data: { model: '', maxTokens: 8192, systemPrompt: 'You are an expert Reviewer. Review the provided codebase dump for bugs, architectural improvements, security vulnerabilities, or performance improvements.\n\nYou must respond STRICTLY with a valid JSON block enclosed in ```json ... ``` containing exactly two keys: "title" and "body".\nThe "title" should be a short 5-6 word summary of the main problem found.\nThe "body" should be a detailed markdown explanation of the issues and how to fix them.' } },
            { id: 'n4', type: 'github', position: { x: 740, y: 180 }, data: { ghAction: 'Create Issue', ghRepo: 'Sample' } },
            { id: 'n5', type: 'customOutput', position: { x: 960, y: 180 }, data: { outputName: 'issue_url', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
            { id: 'e4', source: 'n4', target: 'n5' },
        ],
    },

    {
        id: 'notion-logger',
        name: 'Notion Logger',
        emoji: '📓',
        description: 'Processes structured data and automatically creates a new page entry in a Notion database, ideal for logging pipeline outputs.',
        category: 'Integrations',
        color: 'indigo',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 180 }, data: { inputName: 'log_data', inputType: 'Text' } },
            { id: 'n2', type: 'llm', position: { x: 260, y: 180 }, data: { model: '', systemPrompt: 'Format this data as a structured Notion page in markdown.' } },
            { id: 'n3', type: 'notion', position: { x: 500, y: 180 }, data: { notionAction: 'Create Page', notionDbId: 'your-database-id' } },
            { id: 'n4', type: 'customOutput', position: { x: 740, y: 180 }, data: { outputName: 'page_url', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
        ],
    },

    {
        id: 'sheets-etl',
        name: 'Google Sheets ETL',
        emoji: '📊',
        // FIX: Added customInput as pipeline entry point (was missing — caused "No Input node" warning)
        description: 'Reads a range from a Google Sheet, enriches each row via LLM, and writes the results back to a second sheet.',
        category: 'Integrations',
        color: 'green',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 180 }, data: { inputName: 'spreadsheet_id', inputType: 'Text' } },
            { id: 'n2', type: 'googleSheets', position: { x: 260, y: 180 }, data: { sheetsAction: 'Read Range', spreadsheetId: 'your-spreadsheet-id', sheetRange: 'Sheet1!A:C' } },
            { id: 'n3', type: 'llm', position: { x: 520, y: 180 }, data: { model: '', systemPrompt: 'Categorize and enrich each row in this CSV data.' } },
            { id: 'n4', type: 'googleSheets', position: { x: 760, y: 180 }, data: { sheetsAction: 'Append Row', spreadsheetId: 'your-spreadsheet-id', sheetRange: 'Sheet2!A1' } },
            { id: 'n5', type: 'customOutput', position: { x: 980, y: 180 }, data: { outputName: 'rows_written', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
            { id: 'e4', source: 'n4', target: 'n5' },
        ],
    },

    // ─── Data & Logic ─────────────────────────────────────────────────────────

    {
        id: 'json-api-pipeline',
        name: 'API + JSON Parser',
        emoji: '🔌',
        description: 'Calls an external REST API endpoint, parses the JSON response to extract a specific field, then outputs the clean value.',
        category: 'Data',
        color: 'amber',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 180 }, data: { inputName: 'query', inputType: 'Text' } },
            { id: 'n2', type: 'api', position: { x: 240, y: 180 }, data: { method: 'GET', url: 'https://api.example.com/search' } },
            { id: 'n3', type: 'jsonParser', position: { x: 480, y: 180 }, data: { parseMode: 'Extract Key', jsonPath: 'results[0].title' } },
            { id: 'n4', type: 'customOutput', position: { x: 720, y: 180 }, data: { outputName: 'title', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
        ],
    },

    {
        id: 'csv-enrichment',
        name: 'CSV Enrichment',
        emoji: '📑',
        // FIX: googleSheets node now has a proper spreadsheetId (was using 'output-sheet-id' placeholder)
        description: 'Parses a CSV file, loops through each row, enriches each record with an LLM call, and exports results to Google Sheets.',
        category: 'Data',
        color: 'green',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 180 }, data: { inputName: 'csv_data', inputType: 'Text' } },
            { id: 'n2', type: 'csvParser', position: { x: 240, y: 180 }, data: { csvDelimiter: 'Comma', hasHeader: 'Yes' } },
            { id: 'n3', type: 'loop', position: { x: 460, y: 180 }, data: { loopMode: 'For Each', maxIterations: '100' } },
            { id: 'n4', type: 'llm', position: { x: 680, y: 180 }, data: { model: '', systemPrompt: 'Enrich this row with additional context.' } },
            { id: 'n5', type: 'googleSheets', position: { x: 900, y: 180 }, data: { sheetsAction: 'Append Row', spreadsheetId: 'your-output-spreadsheet-id', sheetRange: 'Sheet1!A1' } },
            { id: 'n6', type: 'customOutput', position: { x: 1100, y: 180 }, data: { outputName: 'enriched_rows', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
            { id: 'e4', source: 'n4', target: 'n5' },
            { id: 'e5', source: 'n5', target: 'n6' },
        ],
    },

    {
        id: 'smart-filter',
        name: 'Smart Filter & Route',
        emoji: '🔀',
        description: 'Uses a conditional branch to route long documents to a summarizer and short ones to an LLM, then merges to a single output.',
        category: 'Logic',
        color: 'cyan',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 200 }, data: { inputName: 'document', inputType: 'Text' } },
            { id: 'n2', type: 'conditional', position: { x: 260, y: 200 }, data: { condition: 'input.length > 500' } },
            { id: 'n3', type: 'summarizer', position: { x: 500, y: 80 }, data: { summaryStyle: 'Concise', summaryLength: 'Short' } },
            { id: 'n4', type: 'llm', position: { x: 500, y: 320 }, data: { model: '', systemPrompt: 'Respond concisely.' } },
            { id: 'n5', type: 'customOutput', position: { x: 740, y: 200 }, data: { outputName: 'output', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n2', target: 'n4' },
            { id: 'e4', source: 'n3', target: 'n5' },
            { id: 'e5', source: 'n4', target: 'n5' },
        ],
    },

    {
        id: 'batch-loop',
        name: 'Batch Loop Processor',
        emoji: '🔄',
        // FIX: Removed non-existent sourceHandle 'item_out' — use plain edges
        description: 'Loops over a list of items, translates each one using an LLM, then joins the results before sending to output.',
        category: 'Logic',
        color: 'indigo',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 180 }, data: { inputName: 'items_list', inputType: 'Text' } },
            { id: 'n2', type: 'loop', position: { x: 240, y: 180 }, data: { loopMode: 'For Each', maxIterations: '10' } },
            { id: 'n3', type: 'llm', position: { x: 460, y: 180 }, data: { model: '', systemPrompt: 'Translate the following item to French.' } },
            { id: 'n4', type: 'join', position: { x: 680, y: 180 }, data: { separator: '\n' } },
            { id: 'n5', type: 'customOutput', position: { x: 880, y: 180 }, data: { outputName: 'translated_items', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
            { id: 'e4', source: 'n4', target: 'n5' },
        ],
    },

    {
        id: 'rate-limited-api',
        name: 'Rate-Limited API Calls',
        emoji: '⏱️',
        description: 'Adds a delay between API calls to respect rate limits — ideal when calling paid APIs or slow external services.',
        category: 'Logic',
        color: 'slate',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 180 }, data: { inputName: 'query', inputType: 'Text' } },
            { id: 'n2', type: 'api', position: { x: 240, y: 180 }, data: { method: 'GET', url: 'https://api.example.com/v1/data' } },
            { id: 'n3', type: 'delay', position: { x: 460, y: 180 }, data: { delaySeconds: '2', delayUnit: 'Seconds' } },
            { id: 'n4', type: 'api', position: { x: 680, y: 180 }, data: { method: 'POST', url: 'https://api.example.com/v1/process' } },
            { id: 'n5', type: 'customOutput', position: { x: 900, y: 180 }, data: { outputName: 'result', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
            { id: 'e4', source: 'n4', target: 'n5' },
        ],
    },

    {
        id: 'math-calculator',
        name: 'Math & Data Pipeline',
        emoji: '🧮',
        description: 'Takes two numeric inputs, runs a calculation, then outputs the final computed value.',
        category: 'Data',
        color: 'cyan',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 80 }, data: { inputName: 'value_a', inputType: 'Number' } },
            { id: 'n2', type: 'customInput', position: { x: 40, y: 280 }, data: { inputName: 'value_b', inputType: 'Number' } },
            { id: 'n3', type: 'calculator', position: { x: 260, y: 180 }, data: { expression: 'a * b + 100' } },
            { id: 'n4', type: 'customOutput', position: { x: 500, y: 180 }, data: { outputName: 'result', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n3' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
        ],
    },

    // ─── General / Starter ─────────────────────────────────────────────────────

    {
        id: 'hello-world',
        name: 'Hello World',
        emoji: '👋',
        description: 'The simplest possible pipeline — input → LLM → output. Perfect for testing your configuration.',
        category: 'Starter',
        color: 'green',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 80, y: 180 }, data: { inputName: 'message', inputType: 'Text' } },
            { id: 'n2', type: 'llm', position: { x: 320, y: 180 }, data: { model: '', systemPrompt: 'You are a friendly assistant.' } },
            { id: 'n3', type: 'customOutput', position: { x: 560, y: 180 }, data: { outputName: 'response', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
        ],
    },

    {
        id: 'text-transform',
        name: 'Text Transformer',
        emoji: '✏️',
        // FIX: Removed non-existent sourceHandle/targetHandle — use plain edges
        description: 'Accepts raw text, splits it by newline, transforms each chunk, and joins the output back into a single formatted result.',
        category: 'Starter',
        color: 'indigo',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 180 }, data: { inputName: 'raw_text', inputType: 'Text' } },
            { id: 'n2', type: 'split', position: { x: 240, y: 180 }, data: { delimiter: '\n' } },
            { id: 'n3', type: 'transform', position: { x: 460, y: 180 }, data: { transformFn: 'Trim whitespace and capitalize each line.' } },
            { id: 'n4', type: 'join', position: { x: 680, y: 180 }, data: { separator: '\n' } },
            { id: 'n5', type: 'customOutput', position: { x: 880, y: 180 }, data: { outputName: 'clean_text', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
            { id: 'e4', source: 'n4', target: 'n5' },
        ],
    },

    {
        id: 'web-research',
        name: 'Web Research Agent',
        emoji: '🔎',
        // FIX: webScraper now has a url field; email now has emailTo
        description: 'Scrapes content from a webpage, generates a bullet-point summary via LLM, then sends it via both Slack and email.',
        category: 'Starter',
        color: 'rose',
        nodes: [
            { id: 'n1', type: 'customInput', position: { x: 40, y: 200 }, data: { inputName: 'research_url', inputType: 'Text' } },
            { id: 'n2', type: 'webScraper', position: { x: 240, y: 200 }, data: { url: 'https://example.com', format: 'Markdown' } },
            { id: 'n3', type: 'summarizer', position: { x: 460, y: 200 }, data: { summaryModel: '', summaryStyle: 'Bullet Points', summaryLength: 'Medium' } },
            { id: 'n4', type: 'slackWebhook', position: { x: 680, y: 100 }, data: { webhookUrl: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL' } },
            { id: 'n5', type: 'email', position: { x: 680, y: 300 }, data: { emailProvider: 'SendGrid', emailTo: 'recipient@example.com', emailSubject: 'Research Summary' } },
            { id: 'n6', type: 'customOutput', position: { x: 900, y: 200 }, data: { outputName: 'summary', outputType: 'Text' } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4' },
            { id: 'e4', source: 'n3', target: 'n5' },
            { id: 'e5', source: 'n3', target: 'n6' },
        ],
    },
];

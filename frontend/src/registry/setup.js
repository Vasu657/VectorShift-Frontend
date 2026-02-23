// registry/setup.js — Full node registration with field schemas, categories, and color tokens
import { NodeRegistry } from './NodeRegistry';
import {
    Database, FileText, Cpu, Type, Layers, Filter, SplitSquareHorizontal, Workflow,
    Webhook, DatabaseZap, Globe2, MessageSquare,
    Boxes, ImagePlus, Tags, AlignLeft,
    GitFork, RefreshCw, Timer,
    Braces, Table2, Calculator,
    Mail, Github, Sheet, BookOpen
} from 'lucide-react';

import { InputNode } from '../nodes/inputNode';
import { LLMNode } from '../nodes/llmNode';
import { OutputNode } from '../nodes/outputNode';
import { TextNode } from '../nodes/textNode';
import { TransformNode, FilterNode, JoinNode, SplitNode, APINode } from '../nodes/exampleNodes';
import { VectorDBNode, WebScraperNode, WebhookNode, EmailNode, GitHubNode, GoogleSheetsNode, NotionNode } from '../nodes/integrationNodes';
import { EmbedderNode, ImageGenNode, ClassifierNode, SummarizerNode } from '../nodes/aiNodes';
import { ConditionalNode, LoopNode, DelayNode } from '../nodes/logicNodes';
import { JSONParserNode, CSVParserNode, CalculatorNode } from '../nodes/dataNodes';

export const setupRegistry = () => {

    // ─── I/O ──────────────────────────────────────────────────────────────────
    NodeRegistry.register('customInput', InputNode, {
        label: 'Input',
        description: 'Pipeline entry point — accepts text, file, or structured data.',
        icon: Database,
        category: 'I/O',
        color: 'green',
        fields: [
            { key: 'inputName', label: 'Variable Name', type: 'text', placeholder: 'e.g. user_query' },
            { key: 'inputType', label: 'Data Type', type: 'select', options: ['Text', 'File', 'Image', 'Number', 'Boolean'] },
        ],
    });

    NodeRegistry.register('customOutput', OutputNode, {
        label: 'Output',
        description: 'Pipeline exit point — emits the final result.',
        icon: Workflow,
        category: 'I/O',
        color: 'rose',
        fields: [
            { key: 'outputName', label: 'Variable Name', type: 'text', placeholder: 'e.g. final_answer' },
            { key: 'outputType', label: 'Data Type', type: 'select', options: ['Text', 'Image', 'File', 'JSON'] },
        ],
    });

    // ─── AI ───────────────────────────────────────────────────────────────────
    NodeRegistry.register('llm', LLMNode, {
        label: 'LLM',
        description: 'Call a large language model with a prompt and system instructions.',
        icon: Cpu,
        category: 'AI',
        color: 'purple',
        fields: [
            { key: 'model', label: 'Model', type: 'modelSelect' },
            { key: 'temperature', label: 'Temperature', type: 'number', placeholder: '0.7', min: 0, max: 2, step: 0.1 },
            { key: 'maxTokens', label: 'Max Tokens', type: 'number', placeholder: '1024', min: 1, max: 128000 },
            { key: 'systemPrompt', label: 'System Prompt', type: 'textarea', placeholder: 'You are a helpful assistant...' },
        ],
    });

    NodeRegistry.register('embedder', EmbedderNode, {
        label: 'Embedder',
        description: 'Convert text into a numerical vector embedding for semantic search.',
        icon: Boxes,
        category: 'AI',
        color: 'violet',
        fields: [
            { key: 'embeddingModel', label: 'Embedding Model', type: 'select', options: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002', 'all-MiniLM-L6-v2'] },
            { key: 'dimensions', label: 'Output Dimensions', type: 'select', options: ['256', '512', '1024', '1536', '3072'] },
        ],
    });

    NodeRegistry.register('imageGen', ImageGenNode, {
        label: 'Image Gen',
        description: 'Generate an image from a text prompt using DALL-E or Stable Diffusion.',
        icon: ImagePlus,
        category: 'AI',
        color: 'pink',
        fields: [
            { key: 'imageModel', label: 'Model', type: 'select', options: ['dall-e-3', 'dall-e-2', 'stable-diffusion-xl'] },
            { key: 'imageSize', label: 'Image Size', type: 'select', options: ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'] },
            { key: 'quality', label: 'Quality', type: 'select', options: ['standard', 'hd'] },
        ],
    });

    NodeRegistry.register('classifier', ClassifierNode, {
        label: 'Classifier',
        description: 'Zero-shot or few-shot classification of text into custom labels.',
        icon: Tags,
        category: 'AI',
        color: 'teal',
        fields: [
            { key: 'classifierModel', label: 'Model', type: 'modelSelect' },
            { key: 'labels', label: 'Labels (comma-separated)', type: 'text', placeholder: 'positive, negative, neutral' },
        ],
    });

    NodeRegistry.register('summarizer', SummarizerNode, {
        label: 'Summarizer',
        description: 'Condense long documents into concise summaries using an LLM.',
        icon: AlignLeft,
        category: 'AI',
        color: 'sky',
        fields: [
            { key: 'summaryModel', label: 'Model', type: 'modelSelect' },
            { key: 'summaryStyle', label: 'Style', type: 'select', options: ['Concise', 'Bullet Points', 'Detailed', 'ELI5'] },
            { key: 'summaryLength', label: 'Target Length', type: 'select', options: ['1 Sentence', 'Short', 'Medium', 'Long'] },
        ],
    });

    // ─── Data ─────────────────────────────────────────────────────────────────
    NodeRegistry.register('text', TextNode, {
        label: 'Text',
        description: 'Static text block with optional variable interpolation via {{variable}}.',
        icon: Type,
        category: 'Data',
        color: 'indigo',
        fields: [
            { key: 'text', label: 'Text Content', type: 'textarea', placeholder: 'Enter text with {{variables}}' },
        ],
    });

    NodeRegistry.register('transform', TransformNode, {
        label: 'Transform',
        description: 'Apply a custom data transformation described in plain text.',
        icon: Layers,
        category: 'Data',
        color: 'amber',
        fields: [
            { key: 'transformModel', label: 'Model', type: 'modelSelect' },
            { key: 'transformFn', label: 'Transform Logic', type: 'textarea', placeholder: 'Describe the transformation...' },
        ],
    });

    NodeRegistry.register('join', JoinNode, {
        label: 'Join',
        description: 'Merge two inputs into one using a separator character.',
        icon: FileText,
        category: 'Data',
        color: 'amber',
        fields: [
            { key: 'separator', label: 'Separator', type: 'text', placeholder: 'e.g. \\n or , or " "' },
        ],
    });

    NodeRegistry.register('jsonParser', JSONParserNode, {
        label: 'JSON Parser',
        description: 'Parse a JSON string and extract a value via dot-notation key path.',
        icon: Braces,
        category: 'Data',
        color: 'amber',
        fields: [
            { key: 'parseMode', label: 'Mode', type: 'select', options: ['Extract Key', 'Stringify', 'Array Length', 'Keys List'] },
            { key: 'jsonPath', label: 'Key Path', type: 'text', placeholder: 'e.g. data.results[0].name' },
        ],
    });

    NodeRegistry.register('csvParser', CSVParserNode, {
        label: 'CSV Parser',
        description: 'Parse a CSV string into rows and extract headers.',
        icon: Table2,
        category: 'Data',
        color: 'green',
        fields: [
            { key: 'csvDelimiter', label: 'Delimiter', type: 'select', options: ['Comma', 'Semicolon', 'Tab', 'Pipe'] },
            { key: 'hasHeader', label: 'Has Header Row', type: 'select', options: ['Yes', 'No'] },
        ],
    });

    NodeRegistry.register('calculator', CalculatorNode, {
        label: 'Calculator',
        description: 'Evaluate a math expression from two inputs (a and b).',
        icon: Calculator,
        category: 'Data',
        color: 'cyan',
        fields: [
            { key: 'expression', label: 'Expression', type: 'text', placeholder: 'e.g. a + b * 2' },
        ],
    });

    // ─── Logic ────────────────────────────────────────────────────────────────
    NodeRegistry.register('filter', FilterNode, {
        label: 'Filter',
        description: 'Pass data downstream only if a condition is met.',
        icon: Filter,
        category: 'Logic',
        color: 'cyan',
        fields: [
            { key: 'condition', label: 'Filter Condition', type: 'text', placeholder: 'e.g. value > 0' },
        ],
    });

    NodeRegistry.register('split', SplitNode, {
        label: 'Split',
        description: 'Divide a string into multiple outputs by a delimiter.',
        icon: SplitSquareHorizontal,
        category: 'Logic',
        color: 'cyan',
        fields: [
            { key: 'delimiter', label: 'Delimiter', type: 'text', placeholder: 'e.g. \\n or ,' },
            { key: 'maxSplits', label: 'Max Splits', type: 'number', placeholder: '2', min: 1 },
        ],
    });

    NodeRegistry.register('api', APINode, {
        label: 'API Call',
        description: 'Make an HTTP request to any REST API endpoint.',
        icon: Webhook,
        category: 'Logic',
        color: 'rose',
        fields: [
            { key: 'method', label: 'HTTP Method', type: 'select', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
            { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/data' },
            { key: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Authorization": "Bearer ..."}' },
        ],
    });

    NodeRegistry.register('conditional', ConditionalNode, {
        label: 'Conditional',
        description: 'Branch execution into true or false paths based on a JS expression.',
        icon: GitFork,
        category: 'Logic',
        color: 'orange',
        fields: [
            { key: 'condition', label: 'Condition (JS expression)', type: 'text', placeholder: 'value.length > 100' },
        ],
    });

    NodeRegistry.register('loop', LoopNode, {
        label: 'Loop',
        description: 'Iterate over a list and emit each item for processing.',
        icon: RefreshCw,
        category: 'Logic',
        color: 'indigo',
        fields: [
            { key: 'loopMode', label: 'Mode', type: 'select', options: ['For Each', 'While Condition', 'Fixed Count'] },
            { key: 'maxIterations', label: 'Max Iterations', type: 'number', placeholder: '10', min: 1 },
        ],
    });

    NodeRegistry.register('delay', DelayNode, {
        label: 'Delay',
        description: 'Pause execution for a set duration before continuing.',
        icon: Timer,
        category: 'Logic',
        color: 'slate',
        fields: [
            { key: 'delaySeconds', label: 'Duration', type: 'number', placeholder: '2', min: 0 },
            { key: 'delayUnit', label: 'Unit', type: 'select', options: ['Milliseconds', 'Seconds', 'Minutes'] },
        ],
    });

    // ─── Integrations ─────────────────────────────────────────────────────────
    NodeRegistry.register('vectorDb', VectorDBNode, {
        label: 'Vector DB',
        description: 'Query, upsert, or delete vectors from a Pinecone index.',
        icon: DatabaseZap,
        category: 'Integrations',
        color: 'green',
        fields: [
            { key: 'action', label: 'Database Action', type: 'select', options: ['Query', 'Upsert', 'Delete'] },
            { key: 'indexName', label: 'Index / Collection Name', type: 'text', placeholder: 'my-rag-index' },
            { key: 'topK', label: 'Top K Results', type: 'number', placeholder: '5', min: 1, max: 100 },
        ],
    });

    NodeRegistry.register('webScraper', WebScraperNode, {
        label: 'Web Scraper',
        description: 'Extract content from any public webpage and convert to text or markdown.',
        icon: Globe2,
        category: 'Integrations',
        color: 'cyan',
        fields: [
            { key: 'url', label: 'Target URL', type: 'text', placeholder: 'https://news.ycombinator.com' },
            { key: 'format', label: 'Extraction Format', type: 'select', options: ['Markdown', 'Raw Text', 'HTML'] },
            { key: 'waitForJs', label: 'Wait for JS Rendering', type: 'select', options: ['False', 'True'] },
        ],
    });

    NodeRegistry.register('slackWebhook', WebhookNode, {
        label: 'Slack / Discord',
        description: 'Send a message to a Slack or Discord channel via an incoming webhook.',
        icon: MessageSquare,
        category: 'Integrations',
        color: 'amber',
        fields: [
            { key: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/...' },
            { key: 'messageTemplate', label: 'Message Template', type: 'textarea', placeholder: 'New lead generated: {{payload.name}}' },
        ],
    });

    NodeRegistry.register('email', EmailNode, {
        label: 'Email',
        description: 'Send transactional email via SendGrid, SMTP, Mailgun, or Resend.',
        icon: Mail,
        category: 'Integrations',
        color: 'rose',
        fields: [
            { key: 'emailProvider', label: 'Provider', type: 'select', options: ['SendGrid', 'SMTP', 'Mailgun', 'Resend'] },
            { key: 'emailTo', label: 'To', type: 'text', placeholder: 'user@example.com' },
            { key: 'emailSubject', label: 'Subject', type: 'text', placeholder: 'Pipeline notification' },
        ],
    });

    NodeRegistry.register('github', GitHubNode, {
        label: 'GitHub',
        description: 'Interact with GitHub — create issues, read files, and more.',
        icon: Github,
        category: 'Integrations',
        color: 'slate',
        fields: [
            { key: 'ghAction', label: 'Action', type: 'select', options: ['Create Issue', 'Create PR', 'Read File', 'List Commits', 'Get Repo Info'] },
            { key: 'ghRepo', label: 'Repository (owner/repo)', type: 'text', placeholder: 'owner/repo-name' },
        ],
    });

    NodeRegistry.register('googleSheets', GoogleSheetsNode, {
        label: 'Google Sheets',
        description: 'Read from or write to a Google Sheet using the Sheets API.',
        icon: Sheet,
        category: 'Integrations',
        color: 'green',
        fields: [
            { key: 'sheetsAction', label: 'Action', type: 'select', options: ['Append Row', 'Read Range', 'Update Cell', 'Create Sheet'] },
            { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms' },
            { key: 'sheetRange', label: 'Range (A1 notation)', type: 'text', placeholder: 'Sheet1!A:D' },
        ],
    });

    NodeRegistry.register('notion', NotionNode, {
        label: 'Notion',
        description: 'Create or append pages in a Notion database workspace.',
        icon: BookOpen,
        category: 'Integrations',
        color: 'stone',
        fields: [
            { key: 'notionAction', label: 'Action', type: 'select', options: ['Append Page', 'Create Page', 'Query Database', 'Update Page', 'Get Page'] },
            { key: 'notionDbId', label: 'Database / Page ID', type: 'text', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
        ],
    });
};

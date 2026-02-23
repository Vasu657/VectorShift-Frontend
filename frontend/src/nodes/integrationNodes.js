// nodes/integrationNodes.js — External integration node types
import { useCallback } from 'react';
import { Position } from 'reactflow';
import { BaseNode, NodeInput, NodeSelect } from './BaseNode';
import { useStore } from '../store';
import {
    DatabaseZap, Globe2, MessageSquare,
    Mail, Github, Sheet, BookOpen
} from 'lucide-react';

// ── Vector DB ─────────────────────────────────────────────────────────────────
export const VectorDBNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleActionChange = useCallback((e) => updateNodeData(id, { action: e.target.value }), [id, updateNodeData]);
    const handleIndexChange = useCallback((e) => updateNodeData(id, { indexName: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="Vector DB" icon={DatabaseZap} color="green" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'vector_input' },
                { type: 'source', position: Position.Right, id: 'results' },
            ]}
        >
            <NodeSelect label="Action" value={data?.action ?? 'Query'} onChange={handleActionChange} options={['Query', 'Upsert', 'Delete']} />
            <NodeInput label="Index Name" value={data?.indexName} onChange={handleIndexChange} placeholder="e.g. my-rag-index" />
        </BaseNode>
    );
};

// ── Web Scraper ───────────────────────────────────────────────────────────────
export const WebScraperNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleUrlChange = useCallback((e) => updateNodeData(id, { url: e.target.value }), [id, updateNodeData]);
    const handleFormatChange = useCallback((e) => updateNodeData(id, { format: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="Web Scraper" icon={Globe2} color="cyan" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'trigger' },
                { type: 'source', position: Position.Right, id: 'content' },
            ]}
        >
            <NodeInput label="Target URL" value={data?.url} onChange={handleUrlChange} placeholder="https://..." />
            <NodeSelect label="Output Format" value={data?.format ?? 'Markdown'} onChange={handleFormatChange} options={['Markdown', 'Raw Text', 'HTML']} />
        </BaseNode>
    );
};

// ── Webhook (Slack/Discord) ───────────────────────────────────────────────────
export const WebhookNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleUrlChange = useCallback((e) => updateNodeData(id, { webhookUrl: e.target.value }), [id, updateNodeData]);
    const handleTemplateChange = useCallback((e) => updateNodeData(id, { messageTemplate: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="Slack / Discord" icon={MessageSquare} color="amber" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'payload' },
                { type: 'source', position: Position.Right, id: 'status' },
            ]}
        >
            <NodeInput label="Webhook URL" value={data?.webhookUrl} onChange={handleUrlChange} placeholder="Slack/Discord URL..." />
            <NodeInput label="Message Template" value={data?.messageTemplate} onChange={handleTemplateChange} placeholder="{{payload}}" />
        </BaseNode>
    );
};

// ── Email (SMTP / SendGrid) ───────────────────────────────────────────────────
export const EmailNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleToChange = useCallback((e) => updateNodeData(id, { emailTo: e.target.value }), [id, updateNodeData]);
    const handleSubjChange = useCallback((e) => updateNodeData(id, { emailSubject: e.target.value }), [id, updateNodeData]);
    const handleProviderChange = useCallback((e) => updateNodeData(id, { emailProvider: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="Email" icon={Mail} color="rose" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'body_in' },
                { type: 'source', position: Position.Right, id: 'sent_status' },
            ]}
        >
            <NodeSelect label="Provider" value={data?.emailProvider ?? 'SendGrid'} onChange={handleProviderChange} options={['SendGrid', 'SMTP', 'Mailgun', 'Resend']} />
            <NodeInput label="To" value={data?.emailTo} onChange={handleToChange} placeholder="user@example.com" />
            <NodeInput label="Subject" value={data?.emailSubject} onChange={handleSubjChange} placeholder="Pipeline notification" />
        </BaseNode>
    );
};

// ── GitHub ────────────────────────────────────────────────────────────────────
export const GitHubNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleActionChange = useCallback((e) => updateNodeData(id, { ghAction: e.target.value }), [id, updateNodeData]);
    const handleRepoChange = useCallback((e) => updateNodeData(id, { ghRepo: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="GitHub" icon={Github} color="slate" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'input' },
                { type: 'source', position: Position.Right, id: 'result' },
            ]}
        >
            <NodeSelect label="Action" value={data?.ghAction ?? 'Create Issue'} onChange={handleActionChange} options={['Create Issue', 'Create PR', 'Read File', 'List Commits', 'Get Repo Info', 'Read Entire Repository']} />
            <NodeInput label="Repository (owner/repo)" value={data?.ghRepo} onChange={handleRepoChange} placeholder="owner/repo-name" />
        </BaseNode>
    );
};

// ── Google Sheets ─────────────────────────────────────────────────────────────
export const GoogleSheetsNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleActionChange = useCallback((e) => updateNodeData(id, { sheetsAction: e.target.value }), [id, updateNodeData]);
    const handleSheetIdChange = useCallback((e) => updateNodeData(id, { spreadsheetId: e.target.value }), [id, updateNodeData]);
    const handleRangeChange = useCallback((e) => updateNodeData(id, { sheetRange: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="Google Sheets" icon={Sheet} color="green" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'data_in' },
                { type: 'source', position: Position.Right, id: 'data_out' },
            ]}
        >
            <NodeSelect label="Action" value={data?.sheetsAction ?? 'Append Row'} onChange={handleActionChange} options={['Append Row', 'Read Range', 'Update Cell', 'Create Sheet']} />
            <NodeInput label="Spreadsheet ID" value={data?.spreadsheetId} onChange={handleSheetIdChange} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" />
            <NodeInput label="Range (A1 notation)" value={data?.sheetRange} onChange={handleRangeChange} placeholder="Sheet1!A:D" />
        </BaseNode>
    );
};

// ── Notion ────────────────────────────────────────────────────────────────────
export const NotionNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleActionChange = useCallback((e) => updateNodeData(id, { notionAction: e.target.value }), [id, updateNodeData]);
    const handleDbIdChange = useCallback((e) => updateNodeData(id, { notionDbId: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="Notion" icon={BookOpen} color="stone" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'content_in' },
                { type: 'source', position: Position.Right, id: 'page_out' },
            ]}
        >
            <NodeSelect label="Action" value={data?.notionAction ?? 'Append Page'} onChange={handleActionChange} options={['Append Page', 'Create Page', 'Query Database', 'Update Page', 'Get Page']} />
            <NodeInput label="Database / Page ID" value={data?.notionDbId} onChange={handleDbIdChange} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
        </BaseNode>
    );
};

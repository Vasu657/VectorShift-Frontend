// submit.js — Run Pipeline button — displays rich backend analysis, validation, and real SSE execution
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from './store';
import { useSettingsStore } from './store/useSettingsStore';
import { shallow } from 'zustand/shallow';
import { parsePipeline, validatePipeline } from './api/client';
import {
    Play, Activity, Server, LayoutTemplate, Link2, Route,
    X, CheckCircle2, XCircle, AlertTriangle, Info,
    Cpu, GitBranch, TerminalSquare, Loader2, TrendingUp, ShieldCheck, ShieldX,
    ChevronDown, ChevronUp, PauseCircle, Send, PlayCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const selector = (state) => ({
    pipelineName: state.pipelineName,
    setExecutionState: state.setExecutionState,
    setTerminalState: state.setTerminalState,
    isSidebarOpen: state.isSidebarOpen,
});

// ─── Result panel sub-components ─────────────────────────────────────────────

const StatRow = ({ icon: Icon, label, value, valueClass = '' }) => (
    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={`font-semibold text-slate-800 dark:text-slate-100 ${valueClass}`}>{value}</span>
    </div>
);

const Badge = ({ color, children }) => {
    const colors = {
        green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
        red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
        amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
        slate: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color] ?? colors.slate}`}>
            {children}
        </span>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const SubmitButton = () => {
    const { pipelineName, setExecutionState, setTerminalState, isSidebarOpen } = useStore(selector, shallow);
    const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl);

    const [isLoading, setIsLoading] = useState(false);
    const [pipelineResult, setPipelineResult] = useState(null);
    const [activeTab, setActiveTab] = useState('analysis');

    // Execution state
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionLogs, setExecutionLogs] = useState([]);

    // HITL Pause State
    const [isPaused, setIsPaused] = useState(false);
    const [pausedNodeId, setPausedNodeId] = useState(null);
    const [pipelineId, setPipelineId] = useState(null);
    const [userInput, setUserInput] = useState('');

    const [executionMetrics, setExecutionMetrics] = useState({ cost: 0, tokens: 0 });

    const logsEndRef = useRef(null);
    const abortControllerRef = useRef(null);

    const [isExpanded, setIsExpanded] = useState(true);

    // Sync local terminal state to global store (so the canvas plugins can dodge the terminal)
    useEffect(() => {
        setTerminalState(!!pipelineResult, isExpanded);
    }, [pipelineResult, isExpanded, setTerminalState]);

    // Auto-scroll logs
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [executionLogs]);

    // Clean up abort controller on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        }
    }, [])

    const startStreamingExecution = async (resumeNodeId = null, resumeInput = null) => {
        const { nodes, edges } = useStore.getState();

        setIsExecuting(true);
        setIsPaused(false);
        setPausedNodeId(null);
        setUserInput('');

        if (!resumeNodeId) setExecutionMetrics({ cost: 0, tokens: 0 });

        abortControllerRef.current = new AbortController();

        try {
            // Build env map from settings store — these are checked by the backend per node type
            const settings = useSettingsStore.getState();
            const env = {
                OPENROUTER_API_KEY: settings.openrouterApiKey || '',
                PINECONE_API_KEY: settings.pineconeApiKey || '',
                SLACK_WEBHOOK_URL: settings.slackWebhookUrl || '',
                SENDGRID_API_KEY: settings.sendgridApiKey || '',
                GITHUB_TOKEN: settings.githubToken || '',
                NOTION_TOKEN: settings.notionToken || '',
                GOOGLE_SHEETS_API_KEY: settings.googleSheetsApiKey || '',
            };

            const response = await fetch(`${apiBaseUrl}/api/v1/pipelines/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nodes,
                    edges,
                    pipeline_id: pipelineId,
                    resume_node_id: resumeNodeId,
                    user_input: resumeInput,
                    env,
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            // To animate edges natively, we fetch from store and update just the ones related
            const animateEdgeSource = (sourceNodeId) => {
                useStore.setState(s => ({
                    edges: s.edges.map(e => e.source === sourceNodeId ? { ...e, animated: true, style: { strokeWidth: 2, stroke: '#6366f1' } } : e)
                }));
            };
            const stopEdgeAnimationTarget = (targetNodeId) => {
                useStore.setState(s => ({
                    edges: s.edges.map(e => e.target === targetNodeId ? { ...e, animated: false, style: {} } : e)
                }));
            }

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n\n');
                buffer = lines.pop(); // keep last incomplete chunk

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));

                            if (data.event === 'error') {
                                setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'error', message: `ERROR: ${data.message}` }]);
                                break;
                            }

                            if (data.event === 'pipeline_start') {
                                if (!pipelineId) setPipelineId(data.pipeline_id);
                                if (!resumeNodeId) {
                                    setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'info', message: `Pipeline started (ID: ${data.pipeline_id})` }]);
                                } else {
                                    setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'info', message: `Pipeline resumed from node: ${resumeNodeId}` }]);
                                }
                            }

                            if (data.event === 'node_start') {
                                setExecutionState(true, [data.node_id]);
                                stopEdgeAnimationTarget(data.node_id);
                                setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'info', message: `Starting node ${data.node_id} (${data.node_type})...` }]);
                            }

                            if (data.event === 'node_chunk') {
                                // Stream LLM tokens live into the last log entry
                                setExecutionLogs(prev => {
                                    const last = prev[prev.length - 1];
                                    if (last && last.nodeId === data.node_id && last.type === 'stream') {
                                        return [...prev.slice(0, -1), { ...last, message: last.message + data.chunk }];
                                    }
                                    return [...prev, { time: new Date().toLocaleTimeString(), type: 'stream', nodeId: data.node_id, message: data.chunk }];
                                });
                            }

                            if (data.event === 'node_complete') {
                                setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'success', message: `Completed node ${data.node_id}.` }]);
                                animateEdgeSource(data.node_id);
                                if (data.result) {
                                    setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'info', message: `↳ ${data.result}` }]);
                                }
                                if (data.metrics) {
                                    setExecutionMetrics(prev => ({
                                        cost: prev.cost + (data.metrics.cost || 0),
                                        tokens: prev.tokens + ((data.metrics.tokens_in || 0) + (data.metrics.tokens_out || 0))
                                    }));
                                }
                            }

                            if (data.event === 'node_paused') {
                                setIsPaused(true);
                                setPausedNodeId(data.node_id);
                                setPipelineId(data.pipeline_id);
                                setExecutionState(true, [data.node_id]); // keep it glowing but color amber
                                setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'warn', message: `PAUSED at ${data.node_id}: ${data.message}` }]);
                                break; // exit stream
                            }

                            if (data.event === 'pipeline_complete') {
                                const totalTokens = executionMetrics.tokens + ((data.metrics?.tokens_in || 0) + (data.metrics?.tokens_out || 0));
                                setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'success', message: '✓ All pipeline stages completed successfully!' }]);
                                setExecutionState(false, []);
                                useStore.setState(s => ({ edges: s.edges.map(e => ({ ...e, animated: false, style: {} })) }));
                                setIsExecuting(false);
                                // Fire the real completion toast — this is what the user should see at the END
                                toast.success(
                                    `Pipeline complete! ${executionMetrics.tokens > 0 ? `${executionMetrics.tokens.toLocaleString()} tokens · $${executionMetrics.cost.toFixed(4)}` : ''}`,
                                    { id: 'pipeline-done', duration: 5000, icon: '🎉' }
                                );
                            }
                        } catch (e) {
                            console.error('Failed to parse SSE JSON:', e);
                        }
                    }
                }

                if (isPaused) break;
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'error', message: `Connection failed: ${err.message}` }]);
                setIsExecuting(false);
                setExecutionState(false, []);
            }
        }
    };

    const handleSubmit = async () => {
        const { nodes, edges, pipelineName } = useStore.getState();
        if (nodes.length === 0) {
            toast.error('Add at least one node before running.', { id: 'empty-canvas' });
            return;
        }
        setIsLoading(true);

        // Reset execution state and flush old stale data before a new API request
        setPipelineResult(null);
        setExecutionLogs([]);
        setIsExecuting(false);
        setIsPaused(false);
        setPipelineId(null);
        setExecutionState(false, []);

        try {
            // Run both in parallel
            const [analysisData, validationData] = await toast.promise(
                Promise.all([
                    parsePipeline(nodes, edges, pipelineName),
                    validatePipeline(nodes, edges, pipelineName),
                ]),
                {
                    loading: 'Analysing pipeline…',
                    success: (results) =>
                        `Graph OK — ${results[0].num_nodes} nodes · starting execution…`,
                    error: 'Analysis failed — check backend connection.',
                }
            );

            setPipelineResult({ analysis: analysisData, validation: validationData });

            // If valid DAG and passes validation, automatically switch to execution tab and start
            if (analysisData.is_dag && validationData.valid) {
                setActiveTab('execution');
                setExecutionLogs([{
                    time: new Date().toLocaleTimeString(),
                    type: 'info',
                    message: 'Initializing execution environment...'
                }]);
                await startStreamingExecution();
            } else {
                setActiveTab('validation');
            }

        } catch {
            // Error already shown by toast.promise
            // Stale state is already cleared above
        } finally {
            setIsLoading(false);
        }
    };

    const stopExecution = () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        setIsExecuting(false);
        setIsPaused(false);
        setExecutionState(false, []);
        useStore.setState(s => ({ edges: s.edges.map(e => ({ ...e, animated: false, style: {} })) }));
        setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'error', message: `Pipeline cancelled by user.` }]);
    }

    const resumeExecution = () => {
        if (!userInput.trim()) {
            toast.error('Provide input before resuming.');
            return;
        }
        startStreamingExecution(pausedNodeId, userInput);
    }

    return (
        <>
            <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || (isExecuting && !isPaused)}
                aria-label="Run pipeline analysis"
                className="flex items-center gap-2 flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg font-semibold shadow-sm hover:shadow transition-all disabled:bg-slate-400 disabled:cursor-not-allowed text-sm"
            >
                {isLoading
                    ? <Activity className="w-4 h-4 animate-spin" />
                    : <Play className="w-4 h-4" fill="currentColor" />}
                {isLoading ? 'Analysing…' : isExecuting ? (isPaused ? 'Resume' : 'Executing...') : 'Run Pipeline'}
            </button>

            {pipelineResult && createPortal(
                <div
                    className={`fixed bottom-0 right-0 z-[50] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-[0_-8px_30px_rgb(0,0,0,0.1)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.3)] transition-all duration-300 ease-in-out ${isExpanded ? 'h-[40vh] min-h-[300px]' : 'h-[42px]'
                        } flex flex-col font-mono`}
                    style={{ position: 'fixed', bottom: 0, left: isSidebarOpen ? '256px' : '48px', right: 0 }}
                    role="dialog"
                    aria-label="Pipeline execution terminal"
                >
                    {/* Terminal Title Bar */}
                    <div
                        className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0 cursor-pointer select-none group"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="flex items-center gap-2">
                            <TerminalSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                            <span className="text-slate-800 dark:text-slate-300 font-bold text-xs tracking-wider">
                                TERMINAL OUTPUT
                            </span>
                            <span className="ml-2 text-[10px] text-slate-500">
                                {pipelineName.toLowerCase().replace(/\s+/g, '-')}-run.sh
                            </span>
                        </div>

                        {/* Live Metrics Snippet in Title bar */}
                        {(isExecuting || executionMetrics.tokens > 0) && (
                            <div className="flex items-center gap-3 ml-auto mr-4 text-[10px] font-bold">
                                <span className="text-amber-600 dark:text-amber-500 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                                    🪙 {executionMetrics.tokens.toLocaleString()} tokens
                                </span>
                                <span className="text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                                    ${executionMetrics.cost.toFixed(4)}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            {isExecuting && !isPaused && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); stopExecution(); }}
                                    className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded flex items-center gap-1 hover:bg-red-200"
                                >
                                    <XCircle className="w-3 h-3" /> STOP
                                </button>
                            )}
                            <button
                                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                                aria-label="Toggle expansion"
                            >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </button>
                            <button
                                className="p-1 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    stopExecution();
                                    setPipelineResult(null);
                                }}
                                aria-label="Close terminal"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content Area (only visible when expanded) */}
                    {isExpanded && (
                        <div className="flex flex-1 min-h-0 bg-white dark:bg-slate-900 relative">
                            {/* CLI-Style Side Tabs */}
                            <div className="w-48 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col pt-2 shrink-0">
                                {['analysis', 'validation', 'execution'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex items-center justify-between px-4 py-2.5 text-xs text-left transition-colors
                                            ${activeTab === tab
                                                ? 'bg-indigo-100/50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-l-2 border-indigo-500'
                                                : 'text-slate-600 dark:text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-300 border-l-2 border-transparent'}`}
                                    >
                                        <span className="capitalize">{tab}</span>
                                        {tab === 'validation' && !pipelineResult.validation.valid && (
                                            <span className="flex items-center justify-center w-4 h-4 rounded bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-500 text-[9px] font-bold">
                                                {(pipelineResult.validation.errors || []).length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Main Scrollable View */}
                            <div className="flex-1 p-5 overflow-y-auto">
                                {/* ── Analysis tab ── */}
                                {activeTab === 'analysis' && (() => {
                                    const d = pipelineResult.analysis;
                                    const warnings = d.warnings || [];
                                    return (
                                        <div className="max-w-2xl text-slate-700 dark:text-slate-300 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <StatRow icon={LayoutTemplate} label="Nodes parsed" value={d.num_nodes} />
                                                <StatRow icon={Link2} label="Edges parsed" value={d.num_edges} />
                                                <StatRow icon={TrendingUp} label="Critical depth" value={d.longest_path >= 0 ? `${d.longest_path} hops` : 'N/A (cycle)'} />
                                                <StatRow icon={GitBranch} label="Components" value={d.connected_components} />
                                            </div>

                                            <div className="h-px bg-slate-200 dark:bg-slate-800 my-4" />

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm border-slate-200 dark:border-slate-800">Directed Acyclic Graph Verify:</span>
                                                    <Badge color={d.is_dag ? 'green' : 'red'}>
                                                        {d.is_dag ? 'PASS' : 'FAIL CYCLES'}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">I/O Endpoint Verify:</span>
                                                    <div className="flex gap-2">
                                                        <Badge color={d.has_input_node ? 'green' : 'amber'}>
                                                            INPUT {d.has_input_node ? 'OK' : 'WARN'}
                                                        </Badge>
                                                        <Badge color={d.has_output_node ? 'green' : 'amber'}>
                                                            OUTPUT {d.has_output_node ? 'OK' : 'WARN'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {Object.keys(d.node_type_counts || {}).length > 0 && (
                                                <div className="pt-4">
                                                    <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest">Type Distribution</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(d.node_type_counts || {}).map(([type, count]) => (
                                                            <span key={type} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded border border-slate-300 dark:border-slate-700">
                                                                <span className="text-indigo-600 dark:text-indigo-400 mr-1">{type}</span>:{count}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {warnings.length > 0 && (
                                                <div className="pt-4 space-y-2">
                                                    <p className="text-[10px] text-amber-600 dark:text-amber-500/70 mb-1 uppercase tracking-widest">Compiler Warnings</p>
                                                    {warnings.map((w, i) => (
                                                        <div key={i} className="text-xs text-amber-700 dark:text-amber-400/90 pl-3 border-l-2 border-amber-500/50">
                                                            {w}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* ── Validation tab ── */}
                                {activeTab === 'validation' && (() => {
                                    const v = pipelineResult.validation;
                                    const errors = v.errors || [];
                                    const warnings = v.warnings || [];
                                    return (
                                        <div className="max-w-2xl space-y-4">
                                            <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                                                {v.valid
                                                    ? <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                                                    : <ShieldX className="w-5 h-5 text-red-600 dark:text-red-500" />}
                                                <span className={`text-sm ${v.valid ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                                                    {v.valid ? '[SUCCESS] Schema validation passed.' : `[ERROR] Exited with ${errors.length} unhandled exceptions`}
                                                </span>
                                            </div>

                                            {errors.map((err, i) => (
                                                <div key={i} className="font-mono text-xs p-3 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded">
                                                    <div className="text-red-600 dark:text-red-400 font-bold mb-1">
                                                        ERR_INVALID_FIELD @ {err.node_id} ({err.field})
                                                    </div>
                                                    <div className="text-slate-600 dark:text-slate-400 pl-4 border-l border-red-300 dark:border-red-500/30">
                                                        {err.message}
                                                    </div>
                                                </div>
                                            ))}

                                            {warnings.map((w, i) => (
                                                <div key={i} className="font-mono text-xs p-3 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded text-amber-700 dark:text-amber-400/90">
                                                    WARN: {w}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {/* ── Execution tab ── */}
                                {activeTab === 'execution' && (() => {
                                    return (
                                        <div className="h-full flex flex-col">
                                            {pipelineResult.analysis.is_dag && pipelineResult.validation.valid ? (
                                                <>
                                                    <div className="flex-1 font-mono text-[13px] text-slate-700 dark:text-slate-300 space-y-1.5" style={{ minHeight: '180px' }}>
                                                        <div className="text-slate-500 mb-4">$ pipeline-runner --stream ./graph.json</div>
                                                        {executionLogs.map((log, i) => (
                                                            <div key={i} className="flex gap-4">
                                                                <span className="text-slate-400 dark:text-slate-600 select-none flex-shrink-0">[{log.time}]</span>
                                                                <span className={`break-words ${log.type === 'success' ? 'text-emerald-600 dark:text-emerald-400 font-bold' :
                                                                    log.type === 'error' ? 'text-red-600 dark:text-red-400' :
                                                                        log.type === 'warn' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 px-1 rounded' :
                                                                            log.type === 'info' ? 'text-indigo-600 dark:text-indigo-300' :
                                                                                log.type === 'stream' ? 'text-purple-600 dark:text-purple-300 whitespace-pre-wrap' :
                                                                                    'text-slate-700 dark:text-slate-300'
                                                                    }`}>
                                                                    {log.message}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {isExecuting && !isPaused && (
                                                            <div className="flex gap-4 animate-pulse mt-2">
                                                                <span className="text-slate-400 dark:text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                                                                <span className="text-slate-500">_</span>
                                                            </div>
                                                        )}
                                                        {isPaused && (
                                                            <div className="mt-4 p-4 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 rounded-xl relative overflow-hidden animate-slide-in-right">
                                                                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                                                                <div className="flex items-start gap-4">
                                                                    <PauseCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                                                    <div className="flex-1 w-full">
                                                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Human-in-the-Loop Required</h4>
                                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Provide necessary input to node <code>{pausedNodeId}</code> to resume execution.</p>
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="text"
                                                                                value={userInput}
                                                                                onChange={(e) => setUserInput(e.target.value)}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') resumeExecution();
                                                                                }}
                                                                                placeholder="Enter input text..."
                                                                                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                                                                            />
                                                                            <button
                                                                                onClick={resumeExecution}
                                                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded flex items-center gap-2 transition-colors active:scale-95 text-sm"
                                                                            >
                                                                                <Send className="w-4 h-4" /> Resume
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div ref={logsEndRef} />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="h-full flex flex-col items-center pt-10 gap-4 text-slate-500">
                                                    <AlertTriangle className="w-10 h-10 text-slate-400 dark:text-slate-700" />
                                                    <div className="text-sm">FATAL: Cannot initialize execution environment.</div>
                                                    <div className="text-xs text-slate-400 dark:text-slate-600">Resolve schema validation and DAG cyclic errors before running.</div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>
                , document.body)}
        </>
    );
};

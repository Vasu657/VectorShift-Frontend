// submit.js — Run Pipeline button — displays rich backend analysis, validation, and simulated execution
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { parsePipeline, validatePipeline } from './api/client';
import {
    Play, Activity, Server, LayoutTemplate, Link2, Route,
    X, CheckCircle2, XCircle, AlertTriangle, Info,
    Cpu, GitBranch, TerminalSquare, Loader2, TrendingUp, ShieldCheck, ShieldX,
    ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const TIMEOUTS = {
    API_NODE: 1500,
    DEFAULT_NODE: 800,
    FINISH_DELAY: 600,
    TAB_SWITCH: 1500,
    START_DELAY: 400
};

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
    const [isLoading, setIsLoading] = useState(false);
    const [pipelineResult, setPipelineResult] = useState(null);
    const [activeTab, setActiveTab] = useState('analysis');

    // Execution state
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionLogs, setExecutionLogs] = useState([]);
    const [executionStep, setExecutionStep] = useState(0);
    const logsEndRef = useRef(null);

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

    // Simulated execution engine
    useEffect(() => {
        if (!isExecuting || !pipelineResult?.analysis?.execution_plan) return;

        const plan = pipelineResult.analysis.execution_plan;

        let finishTimer;
        let switchTimer;

        if (executionStep >= plan.length) {
            finishTimer = setTimeout(() => {
                setExecutionLogs(prev => [
                    ...prev,
                    {
                        time: new Date().toLocaleTimeString(),
                        type: 'success',
                        message: 'Pipeline execution finished successfully.'
                    },
                    {
                        time: new Date().toLocaleTimeString(),
                        type: 'info',
                        message: '✓ All pipeline stages completed!'
                    }
                ]);
                setExecutionState(false, []); // clear all node glowing

                // Clear edge animations
                useStore.setState(s => ({
                    edges: s.edges.map(e => ({ ...e, animated: false, style: {} }))
                }));

                // Auto-switch back to Analysis tab after a brief delay
                switchTimer = setTimeout(() => {
                    setActiveTab('analysis');
                    // NOW we turn off execution, after the UI is done transitioning out
                    setIsExecuting(false);
                }, TIMEOUTS.TAB_SWITCH);

            }, TIMEOUTS.FINISH_DELAY);
            return () => {
                clearTimeout(finishTimer);
                if (switchTimer) clearTimeout(switchTimer);
            };
        }

        const nodeId = plan[executionStep];
        const stateNodes = useStore.getState().nodes;
        const node = stateNodes.find(n => n.id === nodeId);
        const nodeType = node ? node.type : 'Unknown';
        const nodeLabel = nodeType.charAt(0).toUpperCase() + nodeType.slice(1);

        let completeTimer;

        // Step 1: Log that we started the node and set it as active in the store
        const startTimer = setTimeout(() => {
            setExecutionState(true, [nodeId]);
            setExecutionLogs(prev => [...prev, {
                time: new Date().toLocaleTimeString(),
                type: 'info',
                message: `Starting ${nodeLabel} node (${nodeId})...`
            }]);

            // Step 2: "Process" the node (wait longer for LLM/API nodes)
            const processTime = (nodeType === 'llm' || nodeType === 'api') ? TIMEOUTS.API_NODE : TIMEOUTS.DEFAULT_NODE;

            completeTimer = setTimeout(() => {
                setExecutionLogs(prev => [...prev, {
                    time: new Date().toLocaleTimeString(),
                    type: 'success',
                    message: `Completed ${nodeLabel} node.`
                }]);

                // Show data flowing ONTO the next node(s)
                useStore.setState(s => ({
                    edges: s.edges.map(e => {
                        // Stop animating edges coming IN to this node (data consumed)
                        if (e.target === nodeId) return { ...e, animated: false, style: {} };
                        // Start animating OUTGOING edges (data produced)
                        if (e.source === nodeId) return { ...e, animated: true, style: { strokeWidth: 2, stroke: '#6366f1' } };
                        return e;
                    })
                }));

                setExecutionStep(s => s + 1); // move to next node
            }, processTime);

        }, TIMEOUTS.START_DELAY);

        return () => {
            clearTimeout(startTimer);
            if (completeTimer) clearTimeout(completeTimer);
        };
        // Note: Intentionally excluding nodes and edges from dependencies to prevent re-trigger loop bugs; fetching from store statically.
    }, [isExecuting, executionStep, pipelineResult, setExecutionState]);

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
        setExecutionStep(0);
        setIsExecuting(false);
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
                        `Pipeline analysed: ${results[0].num_nodes} nodes, ${results[0].num_edges} edges`,
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
                setIsExecuting(true);
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

    return (
        <>
            <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || isExecuting}
                aria-label="Run pipeline analysis"
                className="flex items-center gap-2 flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg font-semibold shadow-sm hover:shadow transition-all disabled:bg-slate-400 disabled:cursor-not-allowed text-sm"
            >
                {isLoading
                    ? <Activity className="w-4 h-4 animate-spin" />
                    : <Play className="w-4 h-4" fill="currentColor" />}
                {isLoading ? 'Analysing…' : isExecuting ? 'Executing...' : 'Run Pipeline'}
            </button>

            {pipelineResult && createPortal(
                <div
                    className={`fixed bottom-0 right-0 z-[99999] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-[0_-8px_30px_rgb(0,0,0,0.1)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.3)] transition-all duration-300 ease-in-out ${isExpanded ? 'h-[40vh] min-h-[300px]' : 'h-[42px]'
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
                        <div className="flex items-center gap-3">
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
                                    setPipelineResult(null);
                                    setIsExecuting(false);
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
                                    const planLength = (pipelineResult.analysis.execution_plan || []).length;
                                    return (
                                        <div className="h-full flex flex-col">
                                            {pipelineResult.analysis.is_dag && pipelineResult.validation.valid ? (
                                                <>
                                                    {isExecuting && (
                                                        <div className="w-full bg-slate-200 dark:bg-slate-950 h-1 mb-4 rounded overflow-hidden">
                                                            <div
                                                                className="bg-emerald-500 h-1 transition-all duration-300 relative"
                                                                style={{ width: `${planLength > 0 ? (Math.min(executionStep, planLength) / planLength) * 100 : 100}%` }}
                                                            >
                                                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex-1 font-mono text-[13px] text-slate-700 dark:text-slate-300 space-y-1.5" style={{ minHeight: '180px' }}>
                                                        <div className="text-slate-500 mb-4">$ pipeline-runner --execute ./graph.json</div>
                                                        {executionLogs.map((log, i) => (
                                                            <div key={i} className="flex gap-4">
                                                                <span className="text-slate-400 dark:text-slate-600 select-none">[{log.time}]</span>
                                                                <span className={`break-all ${log.type === 'success' ? 'text-emerald-600 dark:text-emerald-400 font-bold' :
                                                                    log.type === 'error' ? 'text-red-600 dark:text-red-400' :
                                                                        log.type === 'info' ? 'text-indigo-600 dark:text-indigo-300' :
                                                                            'text-slate-700 dark:text-slate-300'
                                                                    }`}>
                                                                    {log.message}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {isExecuting && (
                                                            <div className="flex gap-4 animate-pulse mt-2">
                                                                <span className="text-slate-400 dark:text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                                                                <span className="text-slate-500">_</span>
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

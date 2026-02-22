import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Activity, Coins, Database, GitBranch, Plus, Settings, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

const MetricCard = ({ title, value, icon: Icon, colorClass, variants }) => (
    <motion.div variants={variants} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur p-6 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex flex-col justify-between h-40 group relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-1 cursor-default">
        {/* Decorative corner blur */}
        <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-3xl opacity-20 ${colorClass.split(' ')[0]}`} />

        <div className="flex items-start justify-between">
            <div className={`p-3 rounded-2xl ${colorClass} group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{title}</p>
        </div>
        <div>
            <h3 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">{value}</h3>
        </div>
    </motion.div>
);

export const Dashboard = () => {
    const navigate = useNavigate();

    // In a real app, these would come from an API
    const metrics = {
        totalPipelines: 12,
        totalRuns: 342,
        tokensUsed: '1.2M',
        estimatedCost: '$2.45',
    };

    const recentPipelines = [
        { id: '1', name: 'Customer Support Bot', status: 'Success', time: '10m ago', nodes: 8 },
        { id: '2', name: 'Daily News Scraper', status: 'Failed', time: '1h ago', nodes: 4 },
        { id: '3', name: 'RAG Knowledge Base', status: 'Success', time: '3h ago', nodes: 12 },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-8 overflow-y-auto w-full relative">

            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            <motion.div
                className="max-w-6xl mx-auto space-y-8 relative z-10"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >

                {/* Header Section */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur p-6 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <LayoutDashboard className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                Dashboard
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">Overview of your AI pipeline orchestration.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/settings')}
                            className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
                            aria-label="Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => navigate('/editor')}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> New Pipeline
                        </button>
                    </div>
                </motion.div>

                {/* Metrics Grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard variants={itemVariants} title="Total Pipelines" value={metrics.totalPipelines} icon={GitBranch} colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" />
                    <MetricCard variants={itemVariants} title="Total Executions" value={metrics.totalRuns} icon={Activity} colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" />
                    <MetricCard variants={itemVariants} title="Tokens Processed" value={metrics.tokensUsed} icon={Database} colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400" />
                    <MetricCard variants={itemVariants} title="Est. Compute Cost" value={metrics.estimatedCost} icon={Coins} colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" />
                </motion.div>

                {/* Recent pipelines table */}
                <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700/50 flex flex-row items-center justify-between">
                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Recent Executions</h2>
                    </div>
                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                            <thead className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-3 font-semibold pb-4">Pipeline Name</th>
                                    <th className="px-6 py-3 font-semibold pb-4">Status</th>
                                    <th className="px-6 py-3 font-semibold pb-4">Nodes</th>
                                    <th className="px-6 py-3 font-semibold pb-4">Time</th>
                                    <th className="px-6 py-3 font-semibold pb-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="">
                                {recentPipelines.map((pipe) => (
                                    <motion.tr variants={itemVariants} key={pipe.id} className="group bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors rounded-2xl shadow-sm">
                                        <td className="px-6 py-4 font-bold rounded-l-2xl border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 border-r-0">{pipe.name}</td>
                                        <td className="px-6 py-4 border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 border-x-0">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${pipe.status === 'Success'
                                                ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                : 'bg-red-100/80 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                                }`}>
                                                {pipe.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 border-x-0">{pipe.nodes} <span className="text-slate-400 dark:text-slate-500 font-normal">nodes</span></td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 border-x-0">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-slate-400" /> {pipe.time}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right rounded-r-2xl border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 border-l-0">
                                            <button
                                                onClick={() => navigate('/editor')}
                                                className="opacity-0 group-hover:opacity-100 transition-all p-2.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
                                                aria-label="Open Pipeline"
                                            >
                                                <Play className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
};

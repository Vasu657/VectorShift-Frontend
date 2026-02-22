import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Play, LayoutDashboard, Settings as SettingsIcon, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const Welcome = () => {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-8 relative overflow-hidden">

            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl" />

            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMTUwLCAxNTAsIDE1MCwgMC4xNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)] opacity-50 dark:opacity-20 pointer-events-none" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-4xl mx-auto text-center z-10 w-full"
            >

                {/* Logo Badge */}
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm mb-8">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                        <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 pr-2">VectorShift Core v0.1</span>
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6">
                    Orchestrate <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">AI Pipelines</span><br />with ease.
                </motion.h1>

                <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto font-medium">
                    Welcome to the next-generation visual builder for LLM workflows. Drag, drop, connect, and deploy powerful AI solutions in minutes.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate('/editor')}
                        className="group flex items-center justify-between gap-4 w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
                    >
                        <span className="flex items-center gap-2 text-lg">
                            <Play className="w-5 h-5 fill-current" />
                            Open Builder
                        </span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center gap-3 w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
                    >
                        <LayoutDashboard className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        Go to Dashboard
                    </button>
                </motion.div>

                {/* Features Grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
                    {[
                        { icon: GitBranch, title: 'Visual Graph Editor', desc: 'Build complex DAGs effortlessly', colorCls: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
                        { icon: Zap, title: 'Real-time Execution', desc: 'Stream results instantly from the backend', colorCls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
                        { icon: SettingsIcon, title: 'Extensible Nodes', desc: 'Easily add integrations and custom logic', colorCls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
                    ].map((feature, i) => (
                        <div key={i} className="flex flex-col items-center p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur border border-slate-200/50 dark:border-slate-700/50 rounded-3xl">
                            <div className={`p-3 rounded-2xl flex items-center justify-center ${feature.colorCls} mb-4`}>
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{feature.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{feature.desc}</p>
                        </div>
                    ))}
                </motion.div>

            </motion.div>

            {/* Footer settings link */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-8 right-8 z-20"
            >
                <button
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-full text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                    <SettingsIcon className="w-4 h-4" /> Global Settings
                </button>
            </motion.div>
        </div>
    );
};

export default Welcome;

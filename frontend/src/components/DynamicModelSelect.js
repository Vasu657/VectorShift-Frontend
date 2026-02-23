import { memo } from 'react';
import { useOpenRouterModels } from '../hooks/useOpenRouterModels';

export const DynamicModelSelect = ({ label = "Model", value, onChange, className }) => {
    const { models, loading, error } = useOpenRouterModels();

    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {label}
                </span>
            )}
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className={className || "w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"}
            >
                <option value="" disabled>Select model...</option>
                {loading && models.length === 0 && <option value="" disabled>Fetching models...</option>}
                {error && <option value="" disabled>Error loading models</option>}
                {models.map((m) => (
                    <option key={m.id} value={m.id}>
                        {m.name}
                    </option>
                ))}
                {value && !models.some(m => m.id === value) && (
                    <option value={value}>{value}</option>
                )}
            </select>
        </div>
    );
};

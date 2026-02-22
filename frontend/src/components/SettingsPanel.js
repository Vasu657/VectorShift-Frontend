// components/SettingsPanel.js — Full settings drawer with 4 categories
import { useState } from 'react';
import {
    X, Settings, Palette, LayoutTemplate, Cpu, Workflow,
    RotateCcw, Check, ChevronDown, ChevronRight,
    Moon, Sun, Monitor, Zap, Grid3x3, Link2, Globe, Clock,
    Save, Trash2, ArrowRight, ArrowDown
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTheme } from '../hooks/useTheme';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title, description }) => (
    <div className="flex items-start gap-3 pb-4 border-b border-slate-100 dark:border-slate-700 mb-5">
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mt-0.5">
            <Icon className="w-4 h-4" />
        </div>
        <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        </div>
    </div>
);

const ToggleSwitch = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between gap-4 py-2.5">
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
            {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>}
        </div>
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                ${checked ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}
        >
            <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${checked ? 'translate-x-4' : 'translate-x-0'}`}
            />
        </button>
    </div>
);

const SelectRow = ({ label, description, value, options, onChange }) => (
    <div className="flex items-center justify-between gap-4 py-2.5">
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
            {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>}
        </div>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 font-medium appearance-none cursor-pointer min-w-[110px]"
        >
            {options.map((opt) => (
                <option key={opt.value ?? opt} value={opt.value ?? opt}>
                    {opt.label ?? opt}
                </option>
            ))}
        </select>
    </div>
);

const SliderRow = ({ label, description, value, min, max, step = 1, unit = '', onChange }) => (
    <div className="flex flex-col gap-2 py-2.5">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
                {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>}
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                {value}{unit}
            </span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
            <span>{min}{unit}</span>
            <span>{max}{unit}</span>
        </div>
    </div>
);

const TextInputRow = ({ label, description, value, placeholder, onChange, type = 'text' }) => (
    <div className="flex flex-col gap-1.5 py-2.5">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>}
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400 font-mono"
        />
    </div>
);

const ACCENT_COLORS = [
    { key: 'indigo', label: 'Indigo', cls: 'bg-indigo-500' },
    { key: 'violet', label: 'Violet', cls: 'bg-violet-500' },
    { key: 'sky', label: 'Sky', cls: 'bg-sky-500' },
    { key: 'emerald', label: 'Emerald', cls: 'bg-emerald-500' },
    { key: 'rose', label: 'Rose', cls: 'bg-rose-500' },
    { key: 'amber', label: 'Amber', cls: 'bg-amber-500' },
];

const AccentColorPicker = ({ value, onChange }) => (
    <div className="flex flex-col gap-2 py-2.5">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Accent Color</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Controls highlight and interactive element colors</p>
        <div className="flex gap-2 mt-1 flex-wrap">
            {ACCENT_COLORS.map((c) => (
                <button
                    key={c.key}
                    title={c.label}
                    onClick={() => onChange(c.key)}
                    aria-label={`Set accent color to ${c.label}`}
                    className={`w-7 h-7 rounded-full ${c.cls} flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400`}
                >
                    {value === c.key && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </button>
            ))}
        </div>
    </div>
);

const CollapsibleSection = ({ icon: Icon, title, defaultOpen = true, children }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div>
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center gap-2 py-3 text-left group"
            >
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors flex-1">
                    {title}
                </span>
                {open ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
            </button>
            {open && (
                <div className="pl-1 mb-2 divide-y divide-slate-50 dark:divide-slate-700/50">
                    {children}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const SettingsPanel = ({ isOpen, onClose }) => {
    const settings = useSettingsStore((s) => s);
    const setSetting = useSettingsStore((s) => s.setSetting);
    const resetSettings = useSettingsStore((s) => s.resetSettings);
    const { toggle: toggleTheme } = useTheme();

    const handleThemeChange = (value) => {
        setSetting('theme', value);
        // Sync with the live theme hook
        const root = document.documentElement;
        if (value === 'dark') root.classList.add('dark');
        else if (value === 'light') root.classList.remove('dark');
        else {
            // system
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
            else root.classList.remove('dark');
        }
        localStorage.setItem('vectorflow-theme', value === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : value
        );
    };

    const handleReset = () => {
        if (window.confirm('Reset all settings to defaults?')) {
            resetSettings();
            handleThemeChange('light');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[90] bg-black/20 dark:bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer */}
            <aside
                className="fixed top-0 right-0 h-full w-[380px] bg-white dark:bg-slate-800 shadow-2xl z-[95] flex flex-col border-l border-slate-200 dark:border-slate-700 animate-slide-in-right"
                role="dialog"
                aria-label="Settings panel"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                            <Settings className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Settings</h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Customize your workspace</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                        aria-label="Close settings"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1">

                    {/* ── Appearance ── */}
                    <CollapsibleSection icon={Palette} title="Appearance" defaultOpen={true}>
                        {/* Theme */}
                        <div className="py-2.5">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Theme</p>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'light', label: 'Light', icon: Sun },
                                    { value: 'dark', label: 'Dark', icon: Moon },
                                    { value: 'system', label: 'System', icon: Monitor },
                                ].map(({ value, label, icon: Icon }) => (
                                    <button
                                        key={value}
                                        onClick={() => handleThemeChange(value)}
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-semibold
                                            ${settings.theme === value
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'}`}
                                        aria-pressed={settings.theme === value}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <AccentColorPicker
                            value={settings.accentColor}
                            onChange={(v) => setSetting('accentColor', v)}
                        />
                    </CollapsibleSection>

                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

                    {/* ── Canvas ── */}
                    <CollapsibleSection icon={Grid3x3} title="Canvas" defaultOpen={true}>
                        <SliderRow
                            label="Grid Size"
                            description="Spacing between grid dots in pixels"
                            value={settings.gridSize}
                            min={10}
                            max={40}
                            step={5}
                            unit="px"
                            onChange={(v) => setSetting('gridSize', v)}
                        />
                        <ToggleSwitch
                            label="Snap to Grid"
                            description="Nodes snap to the nearest grid point when dropped"
                            checked={settings.snapToGrid}
                            onChange={(v) => setSetting('snapToGrid', v)}
                        />
                        <ToggleSwitch
                            label="Show Grid"
                            description="Display the dot-grid background on the canvas"
                            checked={settings.showGrid}
                            onChange={(v) => setSetting('showGrid', v)}
                        />
                        <ToggleSwitch
                            label="Show Minimap"
                            description="Display the minimap in the bottom-right corner"
                            checked={settings.showMinimap}
                            onChange={(v) => setSetting('showMinimap', v)}
                        />
                        <SelectRow
                            label="Connection Style"
                            description="Shape of the lines connecting nodes"
                            value={settings.connectionLineType}
                            options={[
                                { value: 'smoothstep', label: 'Smooth Step' },
                                { value: 'bezier', label: 'Bezier Curve' },
                                { value: 'straight', label: 'Straight' },
                                { value: 'step', label: 'Step' },
                            ]}
                            onChange={(v) => setSetting('connectionLineType', v)}
                        />
                        <SliderRow
                            label="Min Zoom"
                            value={settings.minZoom}
                            min={0.1}
                            max={0.8}
                            step={0.1}
                            onChange={(v) => setSetting('minZoom', v)}
                        />
                        <SliderRow
                            label="Max Zoom"
                            value={settings.maxZoom}
                            min={1.5}
                            max={5}
                            step={0.5}
                            onChange={(v) => setSetting('maxZoom', v)}
                        />
                    </CollapsibleSection>

                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

                    {/* ── Pipeline ── */}
                    <CollapsibleSection icon={Workflow} title="Pipeline" defaultOpen={true}>
                        <ToggleSwitch
                            label="Animate Edges"
                            description="Show animated dashes on edge connections"
                            checked={settings.animateEdges}
                            onChange={(v) => setSetting('animateEdges', v)}
                        />
                        <ToggleSwitch
                            label="Show Edge Labels"
                            description="Display handle names on connections"
                            checked={settings.showEdgeLabels}
                            onChange={(v) => setSetting('showEdgeLabels', v)}
                        />
                        <SelectRow
                            label="Auto-Layout Direction"
                            description="Direction used when Ctrl+L is pressed"
                            value={settings.autoLayoutDirection}
                            options={[
                                { value: 'LR', label: '→ Left to Right' },
                                { value: 'TB', label: '↓ Top to Bottom' },
                            ]}
                            onChange={(v) => setSetting('autoLayoutDirection', v)}
                        />
                    </CollapsibleSection>

                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

                    {/* ── API ── */}
                    <CollapsibleSection icon={Globe} title="API & Backend" defaultOpen={false}>
                        <TextInputRow
                            label="Backend URL"
                            description="Base URL for the FastAPI backend server"
                            value={settings.apiBaseUrl}
                            placeholder="http://localhost:8000"
                            onChange={(v) => setSetting('apiBaseUrl', v)}
                        />
                        <SliderRow
                            label="Request Timeout"
                            description="Maximum seconds to wait for an API response"
                            value={settings.apiTimeout}
                            min={5}
                            max={120}
                            step={5}
                            unit="s"
                            onChange={(v) => setSetting('apiTimeout', v)}
                        />

                        {/* Connection test */}
                        <div className="py-2.5">
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await fetch(`${settings.apiBaseUrl}/`);
                                        if (res.ok) alert('✅ Backend is reachable!');
                                        else alert(`⚠️ Backend responded with ${res.status}`);
                                    } catch {
                                        alert('❌ Cannot reach backend. Check the URL and make sure it is running.');
                                    }
                                }}
                                className="w-full py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                            >
                                Test Connection →
                            </button>
                        </div>
                    </CollapsibleSection>

                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

                    {/* ── Editor ── */}
                    <CollapsibleSection icon={Save} title="Editor" defaultOpen={false}>
                        <ToggleSwitch
                            label="Autosave to Browser"
                            description="Automatically persist the canvas to localStorage on every change"
                            checked={settings.autosaveEnabled}
                            onChange={(v) => setSetting('autosaveEnabled', v)}
                        />
                        <ToggleSwitch
                            label="Confirm Before Clear"
                            description="Show a confirmation dialog before clearing the canvas"
                            checked={settings.confirmOnClear}
                            onChange={(v) => setSetting('confirmOnClear', v)}
                        />
                    </CollapsibleSection>
                </div>

                {/* Footer */}
                <div className="shrink-0 px-5 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center gap-3">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        aria-label="Reset all settings to defaults"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset to Defaults
                    </button>
                    <div className="ml-auto">
                        <p className="text-[10px] text-slate-300 dark:text-slate-600">
                            Settings are saved automatically
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};

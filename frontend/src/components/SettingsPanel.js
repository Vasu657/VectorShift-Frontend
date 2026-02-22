// components/SettingsPanel.js — Full settings drawer with 4 categories
import {
    Settings, Palette, Grid3x3, Workflow,
    RotateCcw, Check,
    Moon, Sun, Monitor, Globe,
    Save, Key, ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const TextInputRow = ({ label, description, value, placeholder, onChange, type = 'text' }) => {
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';
    return (
        <div className="flex flex-col gap-1.5 py-2.5">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
            {description && <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>}
            <div className="relative">
                <input
                    type={isPassword && !show ? 'password' : 'text'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 pr-9 text-sm bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400 font-mono"
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow((s) => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        aria-label={show ? 'Hide value' : 'Show value'}
                        title={show ? 'Hide' : 'Show'}
                    >
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    );
};

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


// ─── Main Component ────────────────────────────────────────────────────────────

export const SettingsPanel = () => {
    const navigate = useNavigate();
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-8 overflow-y-auto w-full">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-700 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        </button>
                        <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                            <Settings className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">Settings</h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Configure your global workspace and connections</p>
                        </div>
                    </div>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 bg-white dark:bg-slate-800 shadow-sm"
                        aria-label="Reset all settings to defaults"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset to Defaults
                    </button>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

                    {/* ── Appearance Card ── */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                <Palette className="w-4 h-4" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Appearance</h2>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="py-2.5">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Theme</p>
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
                        </div>
                    </div>

                    {/* ── Canvas Card ── */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4 row-span-2">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                <Grid3x3 className="w-4 h-4" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Canvas</h2>
                        </div>
                        <div className="flex-1 space-y-2 divide-y divide-slate-50 dark:divide-slate-700/50">
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
                                description="Nodes snap to the nearest grid point"
                                checked={settings.snapToGrid}
                                onChange={(v) => setSetting('snapToGrid', v)}
                            />
                            <ToggleSwitch
                                label="Show Grid"
                                checked={settings.showGrid}
                                onChange={(v) => setSetting('showGrid', v)}
                            />
                            <ToggleSwitch
                                label="Show Minimap"
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
                        </div>
                    </div>

                    {/* ── Pipeline Card ── */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                <Workflow className="w-4 h-4" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Pipeline</h2>
                        </div>
                        <div className="flex-1 space-y-2 divide-y divide-slate-50 dark:divide-slate-700/50">
                            <ToggleSwitch
                                label="Animate Edges"
                                description="Show animated dashes on connections"
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
                                description="Direction used when applying layout"
                                value={settings.autoLayoutDirection}
                                options={[
                                    { value: 'LR', label: '→ Left to Right' },
                                    { value: 'TB', label: '↓ Top to Bottom' },
                                ]}
                                onChange={(v) => setSetting('autoLayoutDirection', v)}
                            />
                        </div>
                    </div>

                    {/* ── Editor Card ── */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                                <Save className="w-4 h-4" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Editor</h2>
                        </div>
                        <div className="flex-1 space-y-2 divide-y divide-slate-50 dark:divide-slate-700/50">
                            <ToggleSwitch
                                label="Autosave to Browser"
                                description="Automatically persist canvas to localStorage"
                                checked={settings.autosaveEnabled}
                                onChange={(v) => setSetting('autosaveEnabled', v)}
                            />
                            <ToggleSwitch
                                label="Confirm Before Clear"
                                description="Show dialog before clearing the canvas"
                                checked={settings.confirmOnClear}
                                onChange={(v) => setSetting('confirmOnClear', v)}
                            />
                        </div>
                    </div>

                    {/* ── API Card ── */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                                <Globe className="w-4 h-4" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">API & Backend</h2>
                        </div>
                        <div className="flex-1 space-y-2 divide-y divide-slate-50 dark:divide-slate-700/50">
                            <TextInputRow
                                label="Backend URL"
                                description="Base URL for the FastAPI backend"
                                value={settings.apiBaseUrl}
                                placeholder="http://localhost:8000"
                                onChange={(v) => setSetting('apiBaseUrl', v)}
                            />
                            <SliderRow
                                label="Request Timeout"
                                description="Maximum seconds to wait"
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
                                    className="w-full py-2.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                >
                                    Test Connection →
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Secrets Card ── */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                <Key className="w-4 h-4" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Secrets & API Keys</h2>
                        </div>
                        <div className="flex-1 space-y-2 divide-y divide-slate-50 dark:divide-slate-700/50">
                            <TextInputRow
                                label="OpenAI API Key"
                                description="For LLM, Embedder &amp; Image Gen nodes."
                                value={settings.openaiApiKey}
                                placeholder="sk-..."
                                type="password"
                                onChange={(v) => setSetting('openaiApiKey', v)}
                            />
                            <TextInputRow
                                label="Pinecone API Key"
                                description="For the Vector DB node."
                                value={settings.pineconeApiKey}
                                placeholder="pcsk_..."
                                type="password"
                                onChange={(v) => setSetting('pineconeApiKey', v)}
                            />
                            <TextInputRow
                                label="Slack / Discord Webhook"
                                description="For the Slack/Discord node."
                                value={settings.slackWebhookUrl}
                                placeholder="https://hooks.slack.com/..."
                                type="password"
                                onChange={(v) => setSetting('slackWebhookUrl', v)}
                            />
                            <TextInputRow
                                label="SendGrid API Key"
                                description="For the Email node."
                                value={settings.sendgridApiKey}
                                placeholder="SG...."
                                type="password"
                                onChange={(v) => setSetting('sendgridApiKey', v)}
                            />
                            <TextInputRow
                                label="GitHub Access Token"
                                description="For the GitHub node."
                                value={settings.githubToken}
                                placeholder="ghp_..."
                                type="password"
                                onChange={(v) => setSetting('githubToken', v)}
                            />
                            <TextInputRow
                                label="Notion Integration Token"
                                description="For the Notion node."
                                value={settings.notionToken}
                                placeholder="secret_..."
                                type="password"
                                onChange={(v) => setSetting('notionToken', v)}
                            />
                            <TextInputRow
                                label="Google Sheets API Key"
                                description="For the Google Sheets node."
                                value={settings.googleSheetsApiKey}
                                placeholder="AIza..."
                                type="password"
                                onChange={(v) => setSetting('googleSheetsApiKey', v)}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;

// store/useSettingsStore.js — Persisted settings store (separate from pipeline undo history)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const DEFAULT_SETTINGS = {
    // — Appearance —
    theme: 'light',                    // 'light' | 'dark' | 'system'
    accentColor: 'indigo',             // 'indigo' | 'violet' | 'sky' | 'emerald' | 'rose' | 'amber'

    // — Canvas —
    gridSize: 20,                      // 10 | 15 | 20 | 30
    snapToGrid: true,
    showMinimap: true,
    showGrid: true,
    connectionLineType: 'smoothstep',  // 'smoothstep' | 'bezier' | 'straight' | 'step'
    minZoom: 0.3,
    maxZoom: 2.5,

    // — Pipeline —
    animateEdges: true,
    showEdgeLabels: true,
    autoLayoutDirection: 'LR',         // 'LR' | 'TB'

    // — API & Secrets —
    apiBaseUrl: 'http://localhost:8000',
    apiTimeout: 15,                    // seconds
    openaiApiKey: 'sk-test-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    pineconeApiKey: 'pcsk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    slackWebhookUrl: 'https://hooks.slack.com/services/TEST/DUMMY/xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    sendgridApiKey: 'SG.test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    githubToken: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    notionToken: 'secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    googleSheetsApiKey: 'AIzaTestxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

    // — Editor —
    autosaveEnabled: true,
    confirmOnClear: true,
};

export const useSettingsStore = create(
    persist(
        (set) => ({
            ...DEFAULT_SETTINGS,

            // Update a single setting by key
            setSetting: (key, value) => set({ [key]: value }),

            // Reset all settings to defaults
            resetSettings: () => set(DEFAULT_SETTINGS),
        }),
        {
            name: 'vectorflow-settings',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

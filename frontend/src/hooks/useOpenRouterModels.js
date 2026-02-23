// hooks/useOpenRouterModels.js
// Fetches free models from OpenRouter via our backend proxy.
// Caches for the session so we only hit the API once per page load.
import { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

// Module-level cache so every LLM node shares the same result
let _cachedModels = null;
let _cacheKey = '';

export const useOpenRouterModels = () => {
    const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl);
    const openrouterApiKey = useSettingsStore((s) => s.openrouterApiKey);

    const [models, setModels] = useState(_cachedModels || []);
    const [loading, setLoading] = useState(!_cachedModels);
    const [error, setError] = useState(null);
    const abortRef = useRef(null);

    useEffect(() => {
        const cacheKey = `${apiBaseUrl}:${openrouterApiKey}`;
        if (_cachedModels && _cacheKey === cacheKey) {
            setModels(_cachedModels);
            setLoading(false);
            return;
        }

        abortRef.current = new AbortController();
        setLoading(true);
        setError(null);

        const url = `${apiBaseUrl}/api/v1/pipelines/models${openrouterApiKey ? `?api_key=${encodeURIComponent(openrouterApiKey)}` : ''}`;

        fetch(url, { signal: abortRef.current.signal })
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => {
                const list = data.models || [];
                _cachedModels = list;
                _cacheKey = cacheKey;
                setModels(list);
                setLoading(false);
            })
            .catch((err) => {
                if (err.name === 'AbortError') return;
                setError(err.message);
                setLoading(false);
            });

        return () => abortRef.current?.abort();
    }, [apiBaseUrl, openrouterApiKey]);

    return { models, loading, error };
};

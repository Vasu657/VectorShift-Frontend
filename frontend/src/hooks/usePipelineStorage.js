// hooks/usePipelineStorage.js — Save/Load pipelines via the backend REST API
import { useState, useCallback } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import toast from 'react-hot-toast';

const getBaseUrl = () => useSettingsStore.getState().apiBaseUrl || 'http://localhost:8000';

export const usePipelineStorage = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [savedPipelines, setSavedPipelines] = useState([]);

    /** Save the current canvas state to the backend */
    const savePipeline = useCallback(async (pipelineId, name, nodes, edges) => {
        setIsSaving(true);
        try {
            const res = await fetch(`${getBaseUrl()}/api/v1/pipelines/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: pipelineId, name, nodes, edges }),
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const data = await res.json();
            toast.success(`Pipeline "${name}" saved ✓`);
            return data;
        } catch (err) {
            toast.error(`Save failed: ${err.message}`);
            return null;
        } finally {
            setIsSaving(false);
        }
    }, []);

    /** Fetch the list of saved pipelines */
    const fetchSavedPipelines = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${getBaseUrl()}/api/v1/pipelines/saved`);
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const data = await res.json();
            setSavedPipelines(data.pipelines || []);
            return data.pipelines || [];
        } catch (err) {
            toast.error(`Load list failed: ${err.message}`);
            setSavedPipelines([]);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    /** Load a single pipeline by ID */
    const loadPipeline = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${getBaseUrl()}/api/v1/pipelines/saved/${id}`);
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const data = await res.json();
            toast.success(`Pipeline "${data.name}" loaded ✓`);
            return data;   // { id, name, created_at, updated_at, data: {nodes, edges} }
        } catch (err) {
            toast.error(`Load failed: ${err.message}`);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /** Delete a pipeline by ID */
    const deletePipelineById = useCallback(async (id, name) => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/v1/pipelines/saved/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            setSavedPipelines(prev => prev.filter(p => p.id !== id));
            toast.success(`"${name}" deleted`);
            return true;
        } catch (err) {
            toast.error(`Delete failed: ${err.message}`);
            return false;
        }
    }, []);

    return {
        isSaving,
        isLoading,
        savedPipelines,
        savePipeline,
        fetchSavedPipelines,
        loadPipeline,
        deletePipelineById,
    };
};

import { create, useStore as useZustandStore } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { createCanvasSlice } from './slices/canvasSlice';
import { createExecutionSlice } from './slices/executionSlice';
import { createUISlice } from './slices/uiSlice';

// Keys tracked by undo/redo (exclude transient UI/Execution state)
const temporalPartialize = (state) => ({
    nodes: state.nodes,
    edges: state.edges,
});

// Keys persisted to localStorage
const persistPartialize = (state) => ({
    nodes: state.nodes,
    edges: state.edges,
    nodeIDs: state.nodeIDs,
    pipelineName: state.pipelineName,
});

export const useStore = create(
    temporal(
        persist(
            (...a) => ({
                ...createCanvasSlice(...a),
                ...createExecutionSlice(...a),
                ...createUISlice(...a),
            }),
            {
                name: 'vectorflow-pipeline',
                storage: createJSONStorage(() => localStorage),
                partialize: persistPartialize,
            }
        ),
        { partialize: temporalPartialize, limit: 50 }
    )
);

/**
 * Direct vanilla store reference for imperative undo/redo calls in event callbacks.
 */
export const temporalStore = useStore.temporal;

/**
 * React hook to subscribe to the temporal (undo/redo) store reactively.
 */
export const useTemporalStore = (selector) => useZustandStore(useStore.temporal, selector);

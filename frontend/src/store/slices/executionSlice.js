export const createExecutionSlice = (set, get) => ({
    isRunning: false,
    executingNodeIds: [],

    setExecutionState: (isRunning, nodeIds = []) => set({ isRunning, executingNodeIds: nodeIds }),
});

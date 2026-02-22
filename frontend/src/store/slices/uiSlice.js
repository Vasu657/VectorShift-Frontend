export const createUISlice = (set, get) => ({
    isTerminalOpen: false,
    isTerminalExpanded: true,
    isSidebarOpen: true,

    setTerminalState: (isOpen, isExpanded) => set({ isTerminalOpen: isOpen, isTerminalExpanded: isExpanded }),
    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
});

// registry/NodeRegistry.js — Enhanced plugin registry with field schemas, categories, and color tokens
export const NodeRegistry = {
    _nodes: {},
    _toolbars: [],

    /**
     * Register a node type.
     * @param {string} type - Unique node type key (must match ReactFlow nodeTypes key)
     * @param {React.ComponentType} component - The node React component
     * @param {Object} metadata
     * @param {string} metadata.label - Display label in toolbar
     * @param {React.ComponentType} [metadata.icon] - Lucide icon component
     * @param {string} [metadata.category] - Category group (e.g. 'I/O', 'AI', 'Data', 'Logic')
     * @param {string} [metadata.color] - Accent color token: 'indigo'|'purple'|'green'|'amber'|'rose'|'cyan'
     * @param {Array<FieldSchema>} [metadata.fields] - Field schemas for ConfigurationSidebar
     *
     * FieldSchema: { key, label, type: 'text'|'select'|'textarea'|'number'|'toggle', options?: string[] }
     */
    register(type, component, metadata) {
        // Guard: avoid duplicates if setupRegistry() is called multiple times
        if (this._nodes[type]) return;
        this._nodes[type] = component;
        if (metadata) {
            this._toolbars.push({ type, color: 'indigo', category: 'General', fields: [], ...metadata });
        }
    },

    getComponentMap() {
        return { ...this._nodes };
    },

    getToolbarItems() {
        return [...this._toolbars];
    },

    getMetadata(type) {
        return this._toolbars.find((t) => t.type === type) || null;
    },
};

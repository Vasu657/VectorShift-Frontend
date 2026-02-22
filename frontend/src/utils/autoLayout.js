// utils/autoLayout.js — Dagre-based automatic graph layout
import dagre from 'dagre';

const NODE_WIDTH = 300;
const NODE_HEIGHT = 180;

/**
 * Given ReactFlow nodes and edges, return new nodes with Dagre-computed positions.
 * @param {Array} nodes
 * @param {Array} edges
 * @param {'LR'|'TB'} direction - Layout direction. LR = left-to-right, TB = top-to-bottom.
 * @returns {Array} nodes with updated position values
 */
export const applyAutoLayout = (nodes, edges, direction = 'LR') => {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
        rankdir: direction,
        ranksep: 80,
        nodesep: 50,
        edgesep: 20,
        marginx: 40,
        marginy: 40,
    });

    nodes.forEach((node) => {
        g.setNode(node.id, {
            width: node.width || NODE_WIDTH,
            height: node.height || NODE_HEIGHT,
        });
    });

    edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    return nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - (node.width || NODE_WIDTH) / 2,
                y: nodeWithPosition.y - (node.height || NODE_HEIGHT) / 2,
            },
        };
    });
};

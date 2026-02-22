// api/client.js — Centralized Axios API client
import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// Global error interceptor — toast for network errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            toast.error('Cannot reach the backend. Make sure it is running on port 8000.', {
                id: 'network-error',
                duration: 5000,
            });
        }
        return Promise.reject(error);
    }
);

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Parse a pipeline — returns full graph analytics.
 * @returns {Promise<ParseResponse>}
 */
export const parsePipeline = (nodes, edges, name = 'Untitled Pipeline') =>
    apiClient.post('/api/v1/pipelines/parse', { nodes, edges, name }).then((r) => r.data);

/**
 * Deep-validate a pipeline — returns field-level errors and warnings.
 * @returns {Promise<ValidateResponse>}
 */
export const validatePipeline = (nodes, edges, name = 'Untitled Pipeline') =>
    apiClient.post('/api/v1/pipelines/validate', { nodes, edges, name }).then((r) => r.data);

/**
 * Fetch the server-side node-type registry.
 * @returns {Promise<NodeTypesResponse>}
 */
export const fetchNodeTypes = () =>
    apiClient.get('/api/v1/pipelines/node-types').then((r) => r.data);

/**
 * Compute a server-side auto-layout.
 * @param {'LR'|'TB'} direction
 * @returns {Promise<AutoLayoutResponse>}
 */
export const computeLayout = (nodes, edges, direction = 'LR') =>
    apiClient.post(`/api/v1/pipelines/auto-layout?direction=${direction}`, { nodes, edges }).then((r) => r.data);

/**
 * Health check ping.
 * @returns {Promise<{Ping: string, status: string, version: string}>}
 */
export const ping = () => apiClient.get('/').then((r) => r.data);

/**
 * Detailed health check.
 * @returns {Promise<{status: string, services: object}>}
 */
export const healthCheck = () => apiClient.get('/health').then((r) => r.data);

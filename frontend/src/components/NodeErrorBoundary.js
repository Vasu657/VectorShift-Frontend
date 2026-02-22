// components/NodeErrorBoundary.js — Error boundary wrapping each node
import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export class NodeErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[NodeErrorBoundary] Node render error:', error, info.componentStack);
    }

    reset = () => this.setState({ hasError: false, error: null });

    render() {
        if (this.state.hasError) {
            return (
                <div className="relative bg-red-50 dark:bg-red-900/30 rounded-xl shadow-sm border border-red-200 dark:border-red-700 w-[280px] p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span className="font-bold text-sm">Node Error</span>
                    </div>
                    <p className="text-xs text-red-500 dark:text-red-400 break-words">
                        {this.state.error?.message || 'An unexpected error occurred in this node.'}
                    </p>
                    <button
                        onClick={this.reset}
                        className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline text-left"
                    >
                        Try again →
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

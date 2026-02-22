// hooks/useKeyboardShortcuts.js — Global keyboard shortcut handler
import { useEffect, useCallback } from 'react';
import { useStore, temporalStore } from '../store';
import toast from 'react-hot-toast';

/**
 * Register global keyboard shortcuts.
 * @param {Object} options
 * @param {Function} options.onOpenCommandPalette - Called when Ctrl+K is pressed
 * @param {Function} options.onFitView - Called when Ctrl+Shift+F is pressed
 * @param {Function} options.onAutoLayout - Called when Ctrl+L is pressed
 * @param {Function} options.onExport - Called when Ctrl+E is pressed
 * @param {Function} options.onOpenHelp - Called when '?' is pressed
 */
export const useKeyboardShortcuts = ({
    onOpenCommandPalette,
    onFitView,
    onAutoLayout,
    onExport,
    onOpenHelp,
} = {}) => {
    const undo = useCallback(() => temporalStore.getState().undo(), []);
    const redo = useCallback(() => temporalStore.getState().redo(), []);

    const deleteSelected = useStore((s) => s.deleteSelectedNodes);

    const handleKeyDown = useCallback(
        (e) => {
            // Skip if user is typing in an input / textarea / select / contenteditable
            const tag = e.target.tagName;
            const isEditing =
                tag === 'INPUT' ||
                tag === 'TEXTAREA' ||
                tag === 'SELECT' ||
                e.target.isContentEditable;

            const ctrl = e.ctrlKey || e.metaKey;

            // Ctrl+Z — Undo
            if (ctrl && !e.shiftKey && e.key === 'z') {
                e.preventDefault();
                undo();
                toast('↩ Undo', { icon: '↩', duration: 1000, id: 'undo-toast' });
                return;
            }

            // Ctrl+Y or Ctrl+Shift+Z — Redo
            if ((ctrl && e.key === 'y') || (ctrl && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                redo();
                toast('↪ Redo', { icon: '↪', duration: 1000, id: 'redo-toast' });
                return;
            }

            // Ctrl+K — Command Palette
            if (ctrl && e.key === 'k') {
                e.preventDefault();
                onOpenCommandPalette?.();
                return;
            }

            // Ctrl+L — Auto Layout
            if (ctrl && e.key === 'l') {
                e.preventDefault();
                onAutoLayout?.();
                return;
            }

            // Ctrl+Shift+F — Fit View
            if (ctrl && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                onFitView?.();
                return;
            }

            // Ctrl+E — Export
            if (ctrl && e.key === 'e') {
                e.preventDefault();
                onExport?.();
                return;
            }

            // ? — Open help (only when not editing)
            if (!isEditing && e.key === '?') {
                e.preventDefault();
                onOpenHelp?.();
                return;
            }

            // Delete / Backspace — Delete selected nodes (only when not editing)
            if (!isEditing && (e.key === 'Delete' || e.key === 'Backspace')) {
                e.preventDefault();
                deleteSelected();
                return;
            }
        },
        [undo, redo, deleteSelected, onOpenCommandPalette, onFitView, onAutoLayout, onExport, onOpenHelp]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
};

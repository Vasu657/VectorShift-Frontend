// hooks/useTheme.js — Dark mode toggle with localStorage persistence
import { useState, useEffect, useCallback } from 'react';

export const useTheme = () => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('vectorflow-theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('vectorflow-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggle = useCallback(() => setIsDark((d) => !d), []);

    return { isDark, toggle };
};

import { useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

const applyTheme = (appearance: Appearance) => {
    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());

    document.documentElement.classList.toggle('dark', isDark);
};

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Light unless the user picks otherwise: the public site, the member portal and
// the login pages are designed for a light background only.
const DEFAULT_APPEARANCE: Appearance = 'light';

const savedAppearance = () => (localStorage.getItem('appearance') as Appearance | null) || DEFAULT_APPEARANCE;

const handleSystemThemeChange = () => {
    applyTheme(savedAppearance());
};

export function initializeTheme() {
    applyTheme(savedAppearance());

    // Add the event listener for system theme changes...
    mediaQuery.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);

    const updateAppearance = (mode: Appearance) => {
        setAppearance(mode);
        localStorage.setItem('appearance', mode);
        applyTheme(mode);
    };

    useEffect(() => {
        updateAppearance(savedAppearance());

        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }, []);

    return { appearance, updateAppearance };
}

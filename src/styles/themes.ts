import type { Theme } from '../utils/themeManager';

export type ThemeName = 'serika_dark' | 'serika' | 'custom';

export const themes: Record<string, Theme> = {
    serika_dark: {
        name: 'serika_dark',
        bgColor: '#323437',
        mainColor: '#e2b714',
        subColor: '#646669',
        textColor: '#d1d0c5',
        subAltColor: '#2c2e31',
        caretColor: '#e2b714',
        errorColor: '#ca4754',
        errorExtraColor: '#7e2a33',
        colorfulErrorColor: '#ca4754',
        colorfulErrorExtraColor: '#7e2a33'
    },
    serika: {
        name: 'serika',
        bgColor: '#e1e1e3',
        mainColor: '#e2b714',
        subColor: '#aaaeb3',
        textColor: '#323437',
        subAltColor: '#d1d1d3', // Estimated light mode sub-alt
        caretColor: '#e2b714',
    }
};

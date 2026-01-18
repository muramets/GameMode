// Theme Manager
export type Theme = {
    name: string;
    bgColor: string;
    mainColor: string;
    subColor: string;
    textColor: string;
    // Optional overrides
    subAltColor?: string;
    caretColor?: string;
    errorColor?: string;
    errorExtraColor?: string;
    colorfulErrorColor?: string;
    colorfulErrorExtraColor?: string;
    correctColor?: string;
};

function hexToRgb(hex: string): string | null {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_m, r, g, b) => {
        return r + r + g + g + b + b;
    });
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
        : null;
}

// function adjustColor(hex: string, amount: number): string {
//     return '#' + hex.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
// }

// // Simple darken function for sub-alt generation if missing
// function darken(hex: string, percent: number): string {
//     // For now, a simple shim. In real app, might want a library like tinycolor2
//     // But since we want "industry standard" without heavy deps, let's try a native helper or just accept we might need better calc later.
//     // Actually, MonkeyType themes usually have subAlt. We will calculate it if missing.
//     // A quick hack for darkening is subtracting from RGB.

//     // Better strategy: Use the helper to convert to HSL if needed, but for now let's just use the given default logic:
//     // If not provided, we will assume it's just a bit darker than BG. 
//     return hex;
// }

export const applyTheme = (theme: Theme) => {
    const root = document.documentElement;

    const setVar = (name: string, value: string) => {
        root.style.setProperty(`--${name}`, value);
        const rgb = hexToRgb(value);
        if (rgb) {
            root.style.setProperty(`--${name}-rgb`, rgb);
        }
    };

    // 1. Set Base Colors
    setVar('bg-color', theme.bgColor);
    setVar('main-color', theme.mainColor);
    setVar('sub-color', theme.subColor);
    setVar('text-color', theme.textColor);

    // 2. Set Derived/Optional Colors
    setVar('caret-color', theme.caretColor || theme.mainColor);
    setVar('sub-alt-color', theme.subAltColor || theme.bgColor); // Ideally darken(theme.bgColor, 10)

    // Default error colors if not provided
    setVar('error-color', theme.errorColor || '#ca4754');
    setVar('error-extra-color', theme.errorExtraColor || '#7e2a33');
    setVar('colorful-error-color', theme.colorfulErrorColor || '#ca4754');
    setVar('colorful-error-extra-color', theme.colorfulErrorExtraColor || '#7e2a33');
    setVar('correct-color', theme.correctColor || '#98c379');
};

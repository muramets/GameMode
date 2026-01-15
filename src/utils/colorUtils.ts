/**
 * Utility for interpolating colors based on a score (0-10).
 * Implements a specific ladder with smooth transitions.
 */

interface ColorRGB {
    r: number;
    g: number;
    b: number;
}

const COLOR_STEPS: { score: number; hex: string }[] = [
    { score: 0, hex: '#6b1b1b' },    // Improved Deep Maroon
    { score: 1.5, hex: '#942525' },  // Improved Maroon
    { score: 3, hex: '#CA4754' },    // Red (Serika Error)
    { score: 5, hex: '#E2B714' },    // Yellow (Serika Main)
    { score: 7, hex: '#98C379' },    // Green (Serika Success)
    { score: 9, hex: '#00E0FF' },    // Cyan
    { score: 10, hex: '#D1D0C5' },   // Platinum/Off-white
];

function hexToRgb(hex: string): ColorRGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function rgbToHex(rgb: ColorRGB): string {
    const toHex = (c: number) => Math.round(c).toString(16).padStart(2, '0');
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function interpolate(c1: ColorRGB, c2: ColorRGB, factor: number): ColorRGB {
    return {
        r: c1.r + (c2.r - c1.r) * factor,
        g: c1.g + (c2.g - c1.g) * factor,
        b: c1.b + (c2.b - c1.b) * factor
    };
}

/**
 * Returns a hex color string interpolated based on the score (0-10).
 */
export function getScoreColor(score: number): string {
    // Clamp score
    const s = Math.min(Math.max(score, 0), 10);

    // Find the two steps to interpolate between
    let lower = COLOR_STEPS[0];
    let upper = COLOR_STEPS[COLOR_STEPS.length - 1];

    for (let i = 0; i < COLOR_STEPS.length - 1; i++) {
        if (s >= COLOR_STEPS[i].score && s <= COLOR_STEPS[i + 1].score) {
            lower = COLOR_STEPS[i];
            upper = COLOR_STEPS[i + 1];
            break;
        }
    }

    const range = upper.score - lower.score;
    const factor = range === 0 ? 0 : (s - lower.score) / range;

    const rgbLower = hexToRgb(lower.hex);
    const rgbUpper = hexToRgb(upper.hex);

    const interpolatedRgb = interpolate(rgbLower, rgbUpper, factor);
    return rgbToHex(interpolatedRgb);
}

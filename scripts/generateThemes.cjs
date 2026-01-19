const fs = require('fs');
const path = require('path');

const MONKEYTYPE_THEMES_DIR = '/Users/muramets/Documents/#projects/#coding/#refs/monkeytype/frontend/static/themes';
const OUTPUT_FILE = '/Users/muramets/Documents/MonkeyLearn/src/styles/allThemes.ts';

// Helper to convert kebab-case to camelCase
const toCamelCase = (str) => {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
};

// Variable mapping from CSS var name to Theme property name
const VAR_MAP = {
    '--bg-color': 'bgColor',
    '--main-color': 'mainColor',
    '--sub-color': 'subColor',
    '--text-color': 'textColor',
    '--sub-alt-color': 'subAltColor',
    '--caret-color': 'caretColor',
    '--error-color': 'errorColor',
    '--error-extra-color': 'errorExtraColor',
    '--colorful-error-color': 'colorfulErrorColor',
    '--colorful-error-extra-color': 'colorfulErrorExtraColor',
    '--correct-color': 'correctColor' // Added this based on earlier findings
};

async function generate() {
    console.log('Scanning themes directory...');

    if (!fs.existsSync(MONKEYTYPE_THEMES_DIR)) {
        console.error(`Directory not found: ${MONKEYTYPE_THEMES_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(MONKEYTYPE_THEMES_DIR).filter(f => f.endsWith('.css') && f !== '_list.json');
    const themes = {};

    console.log(`Found ${files.length} theme files.`);

    for (const file of files) {
        const themeName = file.replace('.css', '').replace(/_/g, ' '); // simple name cleanup
        const themeKey = file.replace('.css', '');
        const filePath = path.join(MONKEYTYPE_THEMES_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Extract variables inside :root { ... }
        const rootMatch = content.match(/:root\s*{([^}]+)}/);
        if (!rootMatch) {
            console.warn(`Skipping ${file}: No :root block found`);
            continue;
        }

        const block = rootMatch[1];
        const themeObj = {
            name: themeKey // Use filename as key/name for now
        };

        // Parse lines
        const lines = block.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('/*')) continue;

            const [keyWithVar, ...valueParts] = trimmed.split(':');
            if (!keyWithVar || valueParts.length === 0) continue;

            const key = keyWithVar.trim();
            const valueRaw = valueParts.join(':');
            const value = valueRaw
                .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
                .replace(';', '')
                .trim();

            if (VAR_MAP[key]) {
                themeObj[VAR_MAP[key]] = value;
            }
        }

        // Validation - ensure required fields
        const required = ['bgColor', 'mainColor', 'subColor', 'textColor'];
        const missing = required.filter(k => !themeObj[k]);

        if (missing.length > 0) {
            console.warn(`Skipping ${file}: Missing required colors: ${missing.join(', ')}`);
            continue;
        }

        themes[themeKey] = themeObj;
    }

    // Generate TypeScript Content
    const outputContent = `/**
 * AUTO-GENERATED FILE
 * Generated from MonkeyType themes directory
 * Do not edit manually.
 */

import type { Theme } from '../utils/themeManager';

export const allThemes: Record<string, Theme> = ${JSON.stringify(themes, null, 4)};
`;

    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, outputContent);

    console.log(`Successfully generated themes to ${OUTPUT_FILE}`);
    console.log(`Total themes: ${Object.keys(themes).length}`);
}

generate();

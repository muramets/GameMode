/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'bg-primary': 'var(--bg-primary)',
                'bg-secondary': 'var(--bg-secondary)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-tertiary': 'var(--text-tertiary)',
                'accent': 'var(--accent)',
                'border': 'var(--border)',
                'hover': 'var(--hover)',
                'hover-bg': 'var(--hover-bg)',
                'card-bg': 'var(--card-bg)',
                'input-bg': 'var(--input-bg)',
                'button-secondary-bg': 'var(--button-secondary-bg)',
                'button-secondary-hover': 'var(--button-secondary-hover)',
                'button-secondary-text': 'var(--button-secondary-text)',
                // Legacy mappings
                'sub': 'var(--sub-color)',
                'sub-alt': 'var(--sub-alt-color)',
                'main': 'var(--main-color)',
                'correct': 'var(--correct-color)',
                'error': 'var(--error-color)',
            },
            zIndex: {
                'base': '0',
                'sticky': '100',
                'dropdown': '200',
                'popover': '300',
                'modal': '400',
                'toast': '500',
            },
        },
    },
    plugins: [],
}

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
                'bg-primary': 'rgb(var(--bg-color-rgb) / <alpha-value>)',
                'bg-secondary': 'rgb(var(--sub-alt-color-rgb) / <alpha-value>)',
                'text-primary': 'rgb(var(--text-color-rgb) / <alpha-value>)',
                'text-secondary': 'rgb(var(--sub-color-rgb) / <alpha-value>)',
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
                'sub': 'rgb(var(--sub-color-rgb) / <alpha-value>)',
                'sub-alt': 'rgb(var(--sub-alt-color-rgb) / <alpha-value>)',
                'main': 'rgb(var(--main-color-rgb) / <alpha-value>)',
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
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                zoomIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                slideInBottom: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.25s ease-out',
                'zoom-in': 'zoomIn 0.25s ease-out',
                'slide-in-bottom': 'slideInBottom 0.25s ease-out',
            },
        },
    },
    plugins: [],
}

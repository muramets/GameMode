import clsx from 'clsx'

/**
 * Tailwind CSS classes for the Tiptap editor prose styling.
 * 
 * This configuration provides:
 * - Typography styles using Tailwind's prose plugin
 * - Dark mode color scheme (prose-invert)
 * - Custom heading hierarchy with indentation
 * - Table styling with premium look
 * - Code block and inline code styling
 * - List and divider customization
 * 
 * Business Logic:
 * - Headers h4-h6 are collapsed by default (see CollapsableHeadings extension)
 * - Dynamic indentation creates IDE-like hierarchy (depth-1 through depth-6)
 * - Color inheritance ensures inline styles work with bold/strong tags
 */
export const EDITOR_PROSE_CLASSES = clsx(
    // Base prose configuration with size adjustment
    'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[100px] text-text-primary',

    // Restore default text colors using CSS variables to avoid inline style overrides
    '[--tw-prose-body:theme(colors.text-primary)]',
    '[--tw-prose-headings:theme(colors.text-primary)]',
    '[--tw-prose-links:theme(colors.main)]',
    '[--tw-prose-bold:inherit]', // Ensure bold doesn't force a color

    // Base spacing for headings
    'prose-headings:mt-6 prose-headings:mb-2 prose-headings:leading-[1.3]',

    // List spacing
    'prose-ul:my-1 prose-ol:my-1',

    // Divider styling (dimmed and narrower for visual separation)
    'prose-hr:border-sub/20 prose-hr:mx-auto prose-hr:w-4/5 prose-hr:my-8',

    // Ensure headers have relative positioning for collapse arrow icons
    'prose-headings:relative',

    // Dynamic Indentation (IDE-like hierarchy)
    // Each depth level adds 1.5rem (24px) of left padding
    '[&_.depth-1]:pl-6',
    '[&_.depth-2]:pl-12',
    '[&_.depth-3]:pl-[4.5rem]',
    '[&_.depth-4]:pl-[6rem]',
    '[&_.depth-5]:pl-[7.5rem]',
    '[&_.depth-6]:pl-[9rem]',

    // Hide nav/toc if present in markdown
    'prose-nav:hidden',

    // Hide collapsed content (controlled by CollapsableHeadings extension)
    '[&_.collapsed-content]:hidden',

    // Fix for color + bold: enforce color inheritance for strong tags
    '[&_strong]:text-inherit',

    // Table styles - Premium look with borders and hover effects
    '[&_table]:w-full [&_table]:my-6 [&_table]:border-separate [&_table]:border-spacing-0 [&_table]:border [&_table]:border-white/10 [&_table]:rounded-xl [&_table]:overflow-hidden',
    'prose-th:bg-sub/5 prose-th:text-text-primary prose-th:font-medium prose-th:text-[10px] prose-th:uppercase prose-th:tracking-[0.2em] prose-th:p-4 prose-th:border-b prose-th:border-white/10 prose-th:text-left prose-th:font-lexend [&_th_*]:uppercase',
    'prose-td:p-4 prose-td:border-b prose-td:border-white/5 prose-td:text-sm prose-td:text-text-primary prose-td:[&_*]:text-inherit',
    '[&_tr:last-child_td]:border-b-0',
    '[&_tr:hover_td]:bg-white/[0.02] transition-colors',

    // Code block styles
    // 1. Remove backticks (apostrophes) added by typography plugin
    'prose-code:before:content-none prose-code:after:content-none',
    // 2. Inline code: high contrast background and inherited color
    'prose-code:bg-black prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-text-primary prose-code:font-lexend prose-code:tracking-wide [&_code]:text-inherit',
    // 3. Code blocks (pre): high contrast black background
    'prose-pre:bg-black prose-pre:text-text-primary prose-pre:font-lexend prose-pre:tracking-wide [&_pre_code]:text-inherit',

    // Blockquote styles
    // Default: border-l-4, theme-border, padding, rounded, background. 
    // Removed: italic, text-sub (text remains normal)
    // Removed: quote marks (before/after !content-none with important)
    'prose-blockquote:border-l-4 prose-blockquote:border-main prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-4 prose-blockquote:bg-sub/5 prose-blockquote:rounded-r-md prose-blockquote:not-italic prose-blockquote:text-text-primary prose-blockquote:font-medium prose-blockquote:before:!content-none prose-blockquote:after:!content-none [&_blockquote_p]:before:!content-none [&_blockquote_p]:after:!content-none',
    // Support for custom border colors via inline styles
    '[&_blockquote[data-border-color]]:border-l-4',

    // Fix Quote Indentation:
    // Convert 'depth-X' padding (standard indent) to margin so the border moves with indent
    // Standard depth-X uses pl-6 (1.5rem steps). We use ml-X to move the border.
    // We must also reset pl to 4 (1rem) which is the internal padding of the quote.
    '[&_blockquote.depth-1]:pl-4 [&_blockquote.depth-1]:ml-6',
    '[&_blockquote.depth-2]:pl-4 [&_blockquote.depth-2]:ml-12',
    '[&_blockquote.depth-3]:pl-4 [&_blockquote.depth-3]:ml-[4.5rem]',
    '[&_blockquote.depth-4]:pl-4 [&_blockquote.depth-4]:ml-[6rem]',
    '[&_blockquote.depth-5]:pl-4 [&_blockquote.depth-5]:ml-[7.5rem]',
    '[&_blockquote.depth-6]:pl-4 [&_blockquote.depth-6]:ml-[9rem]'
)

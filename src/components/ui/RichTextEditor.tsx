import { useEditor, EditorContent, Editor, Extension } from '@tiptap/react'
import { createPortal } from 'react-dom'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import { Code as TiptapCode } from '@tiptap/extension-code'
import { CodeBlock as TiptapCodeBlock } from '@tiptap/extension-code-block'
import { marked } from 'marked'
import TurndownService from 'turndown'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import {
    Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
    Maximize, Minimize, Droplet, Code, AlignLeft, AlignCenter, AlignRight, Minus,
    Table as TableIcon, MoreHorizontal, Bug, Copy, Check
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import * as Popover from '@radix-ui/react-popover'
import { PRESET_COLORS } from '../../constants/common'

import { CollapsableHeadings } from './extensions/CollapsableHeading'
import { IndentedListItem } from './extensions/IndentedListItem'

export const EDITOR_PROSE_CLASSES = clsx(
    // Added prose-sm to fix text size issue. 
    // Restore default text colors using variables to avoid overrides of inline styles
    'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[100px] text-text-primary',
    '[--tw-prose-body:theme(colors.text-primary)]',
    '[--tw-prose-headings:theme(colors.text-primary)]',
    '[--tw-prose-links:theme(colors.main)]',
    '[--tw-prose-bold:inherit]', // Ensure bold doesn't force a color

    // Base spacing for headings
    'prose-headings:mt-6 prose-headings:mb-2 prose-headings:leading-[1.3]',
    // List spacing
    'prose-ul:my-1 prose-ol:my-1',

    // Divider styling (dimmed and narrower)
    'prose-hr:border-sub/20 prose-hr:mx-auto prose-hr:w-4/5 prose-hr:my-8',

    // Custom overrides for adjacent headings (keeping them tight) -- REMOVED to restore standard spacing
    // '[&_h1+h1]:mt-4',
    // '[&_h1+h2]:mt-4',
    // '[&_h2+h2]:mt-4',
    // '[&_h2+h3]:mt-3',
    // '[&_h3+h3]:mt-3',
    // '[&_h3+h4]:mt-3',
    // '[&_h4+h4]:mt-2',
    // '[&_h4+h5]:mt-2',

    // Ensure headers and content have minimal left padding for the arrow icon and hierarchy
    'prose-headings:relative',

    // Dynamic Indentation (IDE-like hierarchy)
    '[&_.depth-1]:pl-6',
    '[&_.depth-2]:pl-12',
    '[&_.depth-3]:pl-[4.5rem]',
    '[&_.depth-4]:pl-[6rem]',
    '[&_.depth-5]:pl-[7.5rem]',
    '[&_.depth-6]:pl-[9rem]',

    // Hide nav/toc if present
    'prose-nav:hidden',

    // Fix indentation for content following headings
    '[&_.collapsed-content]:hidden',

    // Fix for color + bold: enforce color inheritance for strong tags instead of prose default
    '[&_strong]:text-inherit',

    // Table styles adjustment for prose (Premium look)
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
    'prose-pre:bg-black prose-pre:text-text-primary prose-pre:font-lexend prose-pre:tracking-wide [&_pre_code]:text-inherit'
)

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './atoms/Tooltip'

const TableMenu = ({ editor }: { editor: Editor }) => {
    if (!editor.isActive('table')) return null

    return (
        <Popover.Root>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Popover.Trigger asChild>
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            className="p-1.5 rounded-md transition-colors text-sub hover:text-text-primary hover:bg-sub/10 bg-sub/20 text-text-primary"
                            aria-label="Table Options"
                        >
                            <MoreHorizontal size={16} />
                        </button>
                    </Popover.Trigger>
                </TooltipTrigger>
                <TooltipContent>Table Options</TooltipContent>
            </Tooltip>
            <Popover.Portal>
                <Popover.Content
                    className="z-[10000] p-1 bg-sub-alt border border-white/10 rounded-xl shadow-2xl flex flex-col min-w-[140px] animate-in fade-in zoom-in-95 duration-200"
                    sideOffset={5}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <div className="flex flex-col gap-1">
                        <button onClick={() => editor.chain().focus().addColumnBefore().run()} className="text-left px-2 py-1 hover:bg-sub/10 rounded text-xs">Add Column Before</button>
                        <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="text-left px-2 py-1 hover:bg-sub/10 rounded text-xs">Add Column After</button>
                        <button onClick={() => editor.chain().focus().deleteColumn().run()} className="text-left px-2 py-1 hover:bg-sub/10 rounded text-xs text-error">Delete Column</button>
                        <div className="h-px bg-sub/10 my-1" />
                        <button onClick={() => editor.chain().focus().addRowBefore().run()} className="text-left px-2 py-1 hover:bg-sub/10 rounded text-xs">Add Row Before</button>
                        <button onClick={() => editor.chain().focus().addRowAfter().run()} className="text-left px-2 py-1 hover:bg-sub/10 rounded text-xs">Add Row After</button>
                        <button onClick={() => editor.chain().focus().deleteRow().run()} className="text-left px-2 py-1 hover:bg-sub/10 rounded text-xs text-error">Delete Row</button>
                        <div className="h-px bg-sub/10 my-1" />
                        <button onClick={() => editor.chain().focus().toggleHeaderRow().run()} className="text-left px-2 py-1 hover:bg-sub/10 rounded text-xs">Toggle Header Row</button>
                        <button onClick={() => editor.chain().focus().deleteTable().run()} className="text-left px-2 py-1 hover:bg-sub/10 rounded text-xs text-error">Delete Table</button>
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    )
}

const MenuButton = ({
    onClick,
    isActive,
    children,
    title
}: {
    onClick: () => void,
    isActive?: boolean,
    children: React.ReactNode,
    title: string
}) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
                onClick={onClick}
                aria-label={title}
                aria-pressed={isActive}
                className={clsx(
                    "p-1.5 rounded-md transition-colors text-sub hover:text-text-primary hover:bg-sub/10",
                    isActive && "bg-sub/20 text-text-primary"
                )}
            >
                {children}
            </button>
        </TooltipTrigger>
        <TooltipContent>
            {title}
        </TooltipContent>
    </Tooltip>
)

const EditorColorPicker = ({ editor }: { editor: Editor }) => {
    const currentColor = editor.getAttributes('textStyle').color

    const isColorActive = (c: string) => {
        if (!currentColor) return false
        // Normalize for comparison
        const norm = (val: string) => val.toLowerCase().trim()
        return norm(currentColor) === norm(c)
    }

    return (
        <Popover.Root>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Popover.Trigger asChild>
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
                            aria-label="Text Color"
                            className={clsx(
                                "p-1.5 rounded-md transition-colors text-sub hover:text-text-primary hover:bg-sub/10",
                                currentColor && "text-text-primary bg-sub/10"
                            )}
                        >
                            <div className="relative">
                                <Droplet size={16} />
                                {currentColor && (
                                    <div
                                        className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                                        style={{ backgroundColor: currentColor }}
                                    />
                                )}
                            </div>
                        </button>
                    </Popover.Trigger>
                </TooltipTrigger>
                <TooltipContent>Text Color</TooltipContent>
            </Tooltip>

            <Popover.Portal>
                <Popover.Content
                    className="z-[10000] p-2 bg-sub-alt border border-white/10 rounded-xl shadow-2xl flex flex-col gap-2 min-w-[140px] animate-in fade-in zoom-in-95 duration-200"
                    sideOffset={5}
                    onOpenAutoFocus={(e) => e.preventDefault()} // Don't steal focus from editor
                >
                    <div className="grid grid-cols-5 gap-1.5">
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().unsetMark('textStyle').run()}
                            className="w-5 h-5 rounded-full flex items-center justify-center border border-sub/20 transition-transform hover:scale-125 hover:border-white/50 cursor-pointer relative"
                            title="Reset color"
                        >
                            <div className="w-full h-px bg-sub/50 rotate-45 absolute" />
                        </button>
                        {PRESET_COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => editor.chain().focus().setColor(c).run()}
                                className={clsx(
                                    "w-5 h-5 rounded-full transition-transform hover:scale-125 hover:ring-2 hover:ring-white/30 cursor-pointer",
                                    isColorActive(c) && "ring-2 ring-white/50 scale-110"
                                )}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <Popover.Arrow className="fill-sub-alt" />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    )
}

const MenuBar = ({
    editor,
    isExpanded,
    toggleExpand,
    showDebug,
    toggleDebug
}: {
    editor: Editor | null,
    isExpanded: boolean,
    toggleExpand: () => void,
    showDebug: boolean,
    toggleDebug: () => void
}) => {
    if (!editor) {
        return null
    }

    return (
        <TooltipProvider>
            <div className="flex items-center gap-1 border-b border-sub/10 pb-2 mb-2 flex-wrap">
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 size={16} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 size={16} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 size={16} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                    isActive={editor.isActive('heading', { level: 4 })}
                    title="Heading 4"
                >
                    <Heading4 size={16} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
                    isActive={editor.isActive('heading', { level: 5 })}
                    title="Heading 5"
                >
                    <Heading5 size={16} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
                    isActive={editor.isActive('heading', { level: 6 })}
                    title="Heading 6"
                >
                    <Heading6 size={16} />
                </MenuButton>

                <div className="w-px h-4 bg-sub/10 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold"
                >
                    <Bold size={16} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic"
                >
                    <Italic size={16} />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    isActive={editor.isActive('code')}
                    title="Code"
                >
                    <Code size={16} />
                </MenuButton>

                <EditorColorPicker editor={editor} />

                <div className="w-px h-4 bg-sub/10 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    isActive={editor.isActive({ textAlign: 'left' })}
                    title="Align Left"
                >
                    <AlignLeft size={16} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    isActive={editor.isActive({ textAlign: 'center' })}
                    title="Align Center"
                >
                    <AlignCenter size={16} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    isActive={editor.isActive({ textAlign: 'right' })}
                    title="Align Right"
                >
                    <AlignRight size={16} />
                </MenuButton>

                <div className="w-px h-4 bg-sub/10 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    isActive={editor.isActive('table')}
                    title="Insert Table"
                >
                    <TableIcon size={16} />
                </MenuButton>

                <TableMenu editor={editor} />

                <div className="w-px h-4 bg-sub/10 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Divider"
                >
                    <Minus size={16} />
                </MenuButton>

                <div className="w-px h-4 bg-sub/10 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List size={16} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Ordered List"
                >
                    <ListOrdered size={16} />
                </MenuButton>

                <div className="flex-1" /> {/* Spacer */}

                <MenuButton
                    onClick={toggleDebug}
                    isActive={showDebug}
                    title="Toggle Debugger"
                >
                    <Bug size={16} />
                </MenuButton>

                <MenuButton
                    onClick={toggleExpand}
                    isActive={isExpanded}
                    title={isExpanded ? "Collapse" : "Expand"}
                >
                    {isExpanded ? <Minimize size={16} /> : <Maximize size={16} />}
                </MenuButton>
            </div>
        </TooltipProvider>
    )
}

// Debug Panel Component
const CopyButton = ({ text, className }: { text: string, className?: string }) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className={clsx(
                "p-1.5 rounded-md transition-all duration-200 border",
                copied
                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                    : "bg-white/5 border-white/10 text-sub hover:text-white hover:bg-white/10",
                className
            )}
            title="Copy to clipboard"
        >
            {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
    )
}

const DebugPanel = ({ editor }: { editor: Editor }) => {
    if (!editor) return null

    const html = editor.getHTML()
    const json = editor.getJSON()

    return (
        <div className="mt-8 p-4 bg-black/40 rounded-xl border border-white/10 text-xs font-mono overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                <span className="text-sub font-bold uppercase tracking-wider">Editor Debugger</span>
                <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">HTML</span>
                    <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400">JSON</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 h-[400px]">
                <div className="flex flex-col gap-2 h-full relative">
                    <div className="flex items-center justify-between pointer-events-none">
                        <span className="text-sub">HTML Source:</span>
                    </div>
                    <div className="absolute top-0 right-0 z-10">
                        <CopyButton text={html} />
                    </div>
                    <pre className="flex-1 p-3 bg-black/50 rounded-lg border border-white/5 overflow-auto custom-scrollbar text-white/70 whitespace-pre-wrap break-all mt-1">
                        {html}
                    </pre>
                </div>
                <div className="flex flex-col gap-2 h-full relative">
                    <div className="flex items-center justify-between pointer-events-none">
                        <span className="text-sub">JSON Structure:</span>
                    </div>
                    <div className="absolute top-0 right-0 z-10">
                        <CopyButton text={JSON.stringify(json, null, 2)} />
                    </div>
                    <pre className="flex-1 p-3 bg-black/50 rounded-lg border border-white/5 overflow-auto custom-scrollbar text-green-400/80 mt-1">
                        {JSON.stringify(json, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    )
}

export const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
    // Debug state
    const [showDebug, setShowDebug] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const lastValueRef = React.useRef(value)



    // Only parse initial value once to avoid cursor jumps on every keystroke
    // when the parent updates via valid markdown roundtrip.
    const [initialContent] = useState(() => {
        if (!value) return ''
        // Synchronously parse markdown to HTML
        return marked.parse(value, { async: false }) as string
    })

    // Initialize Turndown service - memoized to avoid recreation
    const turndownService = React.useMemo(() => {
        const service = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced'
        })

        // preserve color styles and explicit breaks
        service.keep(['span', 'br'])

        // Preserve tables in Markdown
        service.keep(['table', 'thead', 'tbody', 'tr', 'th', 'td'])

        // Preserve indented list items as HTML to keep the style
        service.addRule('indented-list-item', {
            filter: function (node) {
                return (
                    node.nodeName === 'LI' &&
                    !!node.style.marginLeft &&
                    node.style.marginLeft !== '0px'
                )
            },
            replacement: function (content, node) {
                const element = node as HTMLElement
                const style = element.getAttribute('style')
                // We need to ensure content is treated properly. 
                // Turndown usually converts content to markdown.
                // If we return HTML, usage of markdown inside might be tricky?
                // Actually, Turndown processes children. `content` is the converted markdown of children.
                // But valid HTML <li> cannot contain raw markdown usually if we want it to be parsed back by standard parsers,
                // UNLESS we are in a hybrid mode or using a parser that supports HTML blocks (CommonMark).
                // Tiptap/Marked supports HTML.

                // However, `content` here is Markdown. Putting Markdown inside HTML tags <li>...</li> 
                // is valid in some specs if separated by newlines, but `marked` might handle it.
                // Let's try wrapping standard HTML.
                return `<li style="${style}">\n\n${content}\n\n</li>`
            }
        })

        // preserve text-align styles using a custom rule to force HTML output
        service.addRule('aligned-paragraph', {
            filter: function (node) {
                return (
                    node.nodeName === 'P' &&
                    (node.style.textAlign === 'center' || node.style.textAlign === 'right' || node.style.textAlign === 'justify')
                )
            },
            replacement: function (content, node) {
                const element = node as HTMLElement
                // Ensure we keep the exact style attribute which might contain other things, 
                // but Tiptap usually isolates alignment or we just want the alignment.
                // Let's grab the textAlign and reconstruct valid HTML.
                // Or just use the getAttribute('style') if we trust it.
                const style = element.getAttribute('style')
                return `<p style="${style}">${content}</p>`
            }
        })

        // Preserve empty lines (paragraphs with simple break or empty)
        service.addRule('empty-paragraph', {
            filter: function (node) {
                // Tiptap represents empty paragraphs as <p><br></p> or just <p></p>
                // Sometimes the BR has a class (ProseMirror-trailingBreak)
                // We also check for ZWSP (\u200B) which we inject in onUpdate to bypass the 'blank' rule
                return (
                    node.nodeName === 'P' &&
                    (
                        node.innerHTML.trim() === '' ||
                        node.innerHTML === '<br>' ||
                        node.textContent?.trim() === '' ||
                        node.textContent === '\u200B' || // Zero Width Space
                        (node.childNodes.length === 1 && node.firstChild?.nodeName === 'BR')
                    )
                )
            },
            replacement: function () {
                // Return &nbsp; to create a paragraph with content in Markdown.
                // This ensures 'marked' produces <p>&nbsp;</p> on load, which Tiptap accepts as a valid paragraph.
                return '&nbsp;\n\n'
            }
        })

        return service
    }, [])

    const [, forceUpdate] = useState(0)

    const CustomCodeMark = React.useMemo(() => TiptapCode.extend({
        excludes: '', // Allow other marks (like Color) to coexist with inline code
    }), [])

    const CustomCodeBlockNode = React.useMemo(() => TiptapCodeBlock.extend({
        content: 'inline*', // Allow marks (like Color) inside code blocks
    }), [])

    const TabIndentation = React.useMemo(() => Extension.create({
        name: 'tabIndentation',
        addKeyboardShortcuts() {
            return {
                'Tab': () => {
                    // 1. Try structural indentation (nesting)
                    if (this.editor.commands.sinkListItem('listItem')) {
                        return true
                    }

                    // 2. Fallback: Visual Indentation (margin)
                    const { selection } = this.editor.state
                    const { $from } = selection
                    // const node = $from.node($from.depth) // Get current block (paragraph usually inside li)
                    const listItem = $from.node($from.depth - 1) // Get the list item

                    if (listItem && listItem.type.name === 'listItem') {
                        const currentIndent = listItem.attrs.indent || 0
                        return this.editor.commands.setIndent(currentIndent + 1)
                    }

                    return true // Capture Tab anyway
                },
                'Shift-Tab': () => {
                    // 1. Check for Visual Indentation first
                    const { selection } = this.editor.state
                    const { $from } = selection
                    const listItem = $from.node($from.depth - 1)

                    if (listItem && listItem.type.name === 'listItem' && listItem.attrs.indent > 0) {
                        return this.editor.commands.setIndent(listItem.attrs.indent - 1)
                    }

                    // 2. Fallback: Structural Lift
                    return this.editor.commands.liftListItem('listItem')
                },
            }
        },
    }), [])

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
                code: false,
                codeBlock: false,
                listItem: false, // Disable default listItem to use our custom IndentedListItem
            }),
            IndentedListItem,
            CustomCodeMark,
            CustomCodeBlockNode,
            TabIndentation,
            Placeholder.configure({
                placeholder: placeholder || 'Write something...',
            }),
            TextStyle,
            Color,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            CollapsableHeadings,
        ],
        content: initialContent,
        onUpdate: ({ editor }) => {
            let html = editor.getHTML()

            // Pre-process HTML to ensure empty paragraphs are preserved as &nbsp;
            // This bypasses Turndown's "blank" rule which might strip <p></p> by adding a visible-to-parser character (ZWSP)
            // We use ZWSP (&#8203;) because normal &nbsp; is treated as whitespace by the 'blank' rule
            // and stripped. ZWSP counts as content.
            html = html.replace(/<p><\/p>/g, '<p>&#8203;</p>')
            html = html.replace(/<p><br\s*\/?><\/p>/g, '<p>&#8203;</p>')
            // Also handle class-based breaks if any
            html = html.replace(/<p><br\s+class="[^"]*"\s*\/?><\/p>/g, '<p>&#8203;</p>')
            html = html.replace(/<p>&nbsp;<\/p>/g, '<p>&#8203;</p>') // Also catch our previous attempt if Tiptap normalized it

            const markdown = turndownService.turndown(html)

            if (markdown !== lastValueRef.current) {
                lastValueRef.current = markdown
                onChange(markdown)
            }
        },
        onTransaction: () => {
            forceUpdate(n => n + 1)
        },
    })

    // Dynamic updates to editor attributes when expansion state changes
    useEffect(() => {
        if (!editor) return

        editor.setOptions({
            editorProps: {
                attributes: {
                    class: clsx(
                        EDITOR_PROSE_CLASSES,
                        isExpanded && 'h-full' // Full height for content div in expanded mode
                    ),
                },
                transformPastedHTML(html) {
                    // Check if content comes from ProseMirror/Tiptap (internal paste)
                    // If so, preserve formatting (data-pm-slice is the signature)
                    if (html.includes('data-pm-slice')) return html

                    // Otherwise (external), strip ONLY color/background related styles.
                    // Keep other formatting (alignment, etc.)
                    return html
                        .replace(/color\s*:[^;"]+;?/gi, '')
                        .replace(/background(-color)?\s*:[^;"]+;?/gi, '')
                },
            },
        })
    }, [isExpanded, editor])

    // Sync editor content when value changes externally (e.g. loaded from DB)
    useEffect(() => {
        if (!editor) return

        // Check if internal markdown representation changed vs external
        const currentHTML = editor.getHTML()
        const currentMarkdown = turndownService.turndown(currentHTML)

        if (value !== currentMarkdown && value !== lastValueRef.current) {
            // Normalize incoming value to HTML
            const valueHTML = marked.parse(value, {
                async: false,
                gfm: true,
                breaks: true
            }) as string

            if (!editor.isFocused) {
                editor.commands.setContent(valueHTML)
            }
        }
    }, [value, editor, turndownService])

    const NormalView = (
        <div className={clsx("flex flex-col bg-sub-alt rounded-lg p-3 transition-all duration-300", className)}>
            <MenuBar
                editor={editor}
                isExpanded={false}
                toggleExpand={() => setIsExpanded(true)}
                showDebug={showDebug}
                toggleDebug={() => setShowDebug(!showDebug)}
            />
            {!isExpanded ? (
                <>
                    <EditorContent editor={editor} className="text-text-primary" />
                    {showDebug && <DebugPanel editor={editor} />}
                </>
            ) : (
                <div className="h-full min-h-[100px] flex items-center justify-center text-sub/40 text-sm italic">
                    Editing in Zen Mode...
                </div>
            )}
        </div>
    )

    const ExpandedView = (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
            <div className="flex flex-col w-full bg-sub-alt max-w-4xl mx-auto rounded-xl shadow-2xl p-6 h-[85vh]">
                <MenuBar
                    editor={editor}
                    isExpanded={true}
                    toggleExpand={() => setIsExpanded(false)}
                    showDebug={showDebug}
                    toggleDebug={() => setShowDebug(!showDebug)}
                />
                <div className="flex-grow overflow-y-auto mt-4 custom-scrollbar">
                    <EditorContent
                        editor={editor}
                        className="text-text-primary"
                    />
                    {showDebug && <DebugPanel editor={editor} />}
                </div>
            </div>
        </div>
    )

    return (
        <>
            {NormalView}
            {isExpanded && createPortal(ExpandedView, document.body)}
        </>
    )
}

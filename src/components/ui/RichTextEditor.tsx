import { useEditor, EditorContent, Editor } from '@tiptap/react'
import { createPortal } from 'react-dom'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import { marked } from 'marked'
import TurndownService from 'turndown'
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Maximize, Minimize, Droplet, Code, AlignLeft, AlignCenter, AlignRight, Minus } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import * as Popover from '@radix-ui/react-popover'
import { PRESET_COLORS } from '../../constants/common'

import { CollapsableHeadings } from './extensions/CollapsableHeading'

const EDITOR_PROSE_CLASSES = clsx(
    'prose prose-invert max-w-none focus:outline-none min-h-[100px]',
    'prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-nav:hidden',
    // Styles to ensure arrows are leftmost and text is indented
    '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:pl-6 [&_h1]:relative',
    '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:pl-6 [&_h2]:relative',
    '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:pl-6 [&_h3]:relative',
    '[&_h4]:text-base [&_h4]:font-semibold [&_h4]:pl-6 [&_h4]:relative',
    '[&_h5]:text-sm [&_h5]:font-semibold [&_h5]:pl-6 [&_h5]:relative',
    '[&_h6]:text-xs [&_h6]:font-bold [&_h6]:pl-6 [&_h6]:relative',
    // Indent all other content to align with header text, NOT the arrow
    '[&_p]:pl-0',
    // Reset padding for paragraphs inside lists to prevent double indentation
    '[&_li_p]:pl-0',
    // Increase list indent to account for their bullets + our layout
    // pl-10 (40px) puts text at 40px. Marker is 'outside'.
    '[&_ul]:pl-10 [&_ol]:pl-10',
    '[&_blockquote]:pl-6',
    '[&_pre]:pl-6',

    '[&_ul]:list-disc [&_ul]:list-outside [&_ul]:marker:text-text-primary',
    '[&_ol]:list-decimal [&_ol]:list-outside [&_ol]:marker:text-text-primary',

    '[&_strong]:font-bold',
    '[&_pre]:bg-sub/20 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:my-2 [&_pre]:text-xs [&_pre]:overflow-x-auto',
    '[&_code]:bg-sub/20 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-text-primary', // Inline code styles
    '[&_hr]:my-4 [&_hr]:border-t [&_hr]:border-sub/10 [&_hr]:mx-2', // Custom HR styling
    'text-sm text-text-primary',
    '[&_.collapsed-content]:hidden' // Ensure collapsed content is hidden
)

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './atoms/Tooltip'

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
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().unsetColor().run()}
                            className="w-5 h-5 rounded-full flex items-center justify-center border border-sub/20 transition-transform hover:scale-125 hover:border-white/50 cursor-pointer relative"
                            title="Reset color"
                        >
                            <div className="w-full h-px bg-sub/50 rotate-45 absolute" />
                        </button>
                        {PRESET_COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
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

const MenuBar = ({ editor, isExpanded, toggleExpand }: { editor: Editor | null, isExpanded: boolean, toggleExpand: () => void }) => {
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

export const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
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

        // preserve color styles
        service.keep(['span'])

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
                return node.nodeName === 'P' && (node.innerHTML.trim() === '<br>' || node.innerHTML.trim() === '')
            },
            replacement: function () {
                // Return non-breaking space to ensure it survives markdown parsing as a line
                return '&nbsp;\n\n'
            }
        })

        return service
    }, [])

    const [, forceUpdate] = useState(0)

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Write something...',
            }),
            TextStyle,
            Color,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            CollapsableHeadings,
        ],
        content: initialContent,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML()
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
            <MenuBar editor={editor} isExpanded={false} toggleExpand={() => setIsExpanded(true)} />
            {!isExpanded ? (
                <EditorContent editor={editor} className="text-text-primary" />
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
                <MenuBar editor={editor} isExpanded={true} toggleExpand={() => setIsExpanded(false)} />
                <EditorContent
                    editor={editor}
                    className="flex-grow overflow-y-auto mt-4 text-text-primary"
                />
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

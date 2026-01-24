import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { marked } from 'marked'
import TurndownService from 'turndown'
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import clsx from 'clsx'

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './atoms/Tooltip'

// Initialize Turndown service outside component to avoid recreation on every render
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
})

const MenuBar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null
    }

    const Button = ({
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

    return (
        <TooltipProvider>
            <div className="flex items-center gap-1 border-b border-main/10 pb-2 mb-2">
                <Button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 size={16} />
                </Button>
                <Button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 size={16} />
                </Button>
                <Button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 size={16} />
                </Button>

                <div className="w-px h-4 bg-main/10 mx-1" />

                <Button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold"
                >
                    <Bold size={16} />
                </Button>
                <Button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic"
                >
                    <Italic size={16} />
                </Button>

                <div className="w-px h-4 bg-main/10 mx-1" />

                <Button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List size={16} />
                </Button>
                <Button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Ordered List"
                >
                    <ListOrdered size={16} />
                </Button>
            </div>
        </TooltipProvider>
    )
}

export const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
    // Only parse initial value once to avoid cursor jumps on every keystroke
    // when the parent updates via valid markdown roundtrip.
    const [initialContent] = useState(() => {
        if (!value) return ''
        // Synchronously parse markdown to HTML
        return marked.parse(value, { async: false }) as string
    })

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Write something...',
            }),
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: clsx(
                    'prose prose-invert max-w-none focus:outline-none min-h-[100px]',
                    'prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-nav:hidden',
                    '[&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold',
                    '[&_ul]:list-disc [&_ul]:pl-8 [&_ul]:list-outside [&_ol]:list-decimal [&_ol]:pl-8 [&_ol]:list-outside',
                    'text-sm text-text-primary'
                ),
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML()
            const markdown = turndownService.turndown(html)
            onChange(markdown)
        },
    })

    // If value changes externally (and differs significantly), we might want to update editor.
    // However, handling controlled updates in Tiptap with markdown conversion is tricky.
    // For now, we assume this is a simple input where typed changes flow up.
    // If we need to support resetting the form, we'll need a useEffect to watch `value`.
    useEffect(() => {
        if (editor && value === '') {
            if (editor.getText() !== '') {
                editor.commands.setContent('')
            }
        }
    }, [value, editor])

    return (
        <div className={clsx("flex flex-col bg-sub-alt rounded-lg p-3", className)}>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    )
}

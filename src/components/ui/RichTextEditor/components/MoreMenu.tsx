import { Editor } from '@tiptap/react'
import * as Popover from '@radix-ui/react-popover'
import clsx from 'clsx'
import {
    MoreHorizontal, Bug, Code, Minus, AlignLeft, AlignCenter, AlignRight,
    Pilcrow, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Table as TableIcon
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../atoms/Tooltip'

/**
 * MoreMenu Component
 * 
 * Overflow menu containing less frequently used formatting options:
 * - Text alignment (Left, Center, Right)
 * - Text styles (Normal, Headings 1-6)
 * - Code (Inline Code, Code Block)
 * - Horizontal divider
 * - Table insertion
 * - Debug view toggle
 */

interface MoreMenuProps {
    editor: Editor
    showDebug: boolean
    toggleDebug: () => void
}

export const MoreMenu = ({ editor, showDebug, toggleDebug }: MoreMenuProps) => {
    return (
        <Popover.Root>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Popover.Trigger asChild>
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            className="p-1.5 rounded-md transition-colors text-sub hover:text-text-primary hover:bg-sub/10"
                        >
                            <MoreHorizontal size={16} />
                        </button>
                    </Popover.Trigger>
                </TooltipTrigger>
                <TooltipContent>More Tools</TooltipContent>
            </Tooltip>

            <Popover.Portal>
                <Popover.Content
                    className="z-[10000] p-1.5 bg-sub-alt border border-white/10 rounded-xl shadow-2xl flex flex-col gap-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-200"
                    sideOffset={5}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
                        {/* Alignment Section - FIRST */}
                        <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-sub opacity-50">
                            Alignment
                        </div>

                        <div className="flex bg-sub/10 rounded-lg p-0.5">
                            <button
                                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                className={clsx(
                                    "flex-1 p-1 flex justify-center rounded transition-colors",
                                    editor.isActive({ textAlign: 'left' })
                                        ? "bg-sub/20 text-text-primary"
                                        : "text-sub hover:text-text-primary"
                                )}
                            >
                                <AlignLeft size={14} />
                            </button>
                            <button
                                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                className={clsx(
                                    "flex-1 p-1 flex justify-center rounded transition-colors",
                                    editor.isActive({ textAlign: 'center' })
                                        ? "bg-sub/20 text-text-primary"
                                        : "text-sub hover:text-text-primary"
                                )}
                            >
                                <AlignCenter size={14} />
                            </button>
                            <button
                                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                                className={clsx(
                                    "flex-1 p-1 flex justify-center rounded transition-colors",
                                    editor.isActive({ textAlign: 'right' })
                                        ? "bg-sub/20 text-text-primary"
                                        : "text-sub hover:text-text-primary"
                                )}
                            >
                                <AlignRight size={14} />
                            </button>
                        </div>

                        <div className="border-t border-sub/30 my-2 mx-4" />

                        {/* Text Style Section - SECOND (all 6 headings) */}
                        <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-sub opacity-50">
                            Text Style
                        </div>

                        <button
                            onClick={() => editor.chain().focus().setParagraph().run()}
                            className={clsx(
                                "flex items-center gap-2 px-2 py-1.5 hover:bg-sub/10 rounded text-xs text-left font-mono",
                                editor.isActive('paragraph') && "text-main bg-sub/5"
                            )}
                        >
                            <Pilcrow size={14} className="opacity-50" />
                            Normal
                        </button>

                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className={clsx(
                                "flex items-center gap-2 px-2 py-1.5 hover:bg-sub/10 rounded text-xs text-left font-bold text-lg",
                                editor.isActive('heading', { level: 1 }) && "text-main bg-sub/5"
                            )}
                        >
                            <Heading1 size={14} className="opacity-50" />
                            Heading 1
                        </button>

                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={clsx(
                                "flex items-center gap-2 px-2 py-1.5 hover:bg-sub/10 rounded text-xs text-left font-bold text-base",
                                editor.isActive('heading', { level: 2 }) && "text-main bg-sub/5"
                            )}
                        >
                            <Heading2 size={14} className="opacity-50" />
                            Heading 2
                        </button>

                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            className={clsx(
                                "flex items-center gap-2 px-2 py-1.5 hover:bg-sub/10 rounded text-xs text-left font-bold text-sm",
                                editor.isActive('heading', { level: 3 }) && "text-main bg-sub/5"
                            )}
                        >
                            <Heading3 size={14} className="opacity-50" />
                            Heading 3
                        </button>

                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                            className={clsx(
                                "flex items-center gap-2 px-2 py-1.5 hover:bg-sub/10 rounded text-xs text-left font-bold text-xs",
                                editor.isActive('heading', { level: 4 }) && "text-main bg-sub/5"
                            )}
                        >
                            <Heading4 size={14} className="opacity-50" />
                            Heading 4
                        </button>

                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
                            className={clsx(
                                "flex items-center gap-2 px-2 py-1.5 hover:bg-sub/10 rounded text-xs text-left font-bold text-[11px]",
                                editor.isActive('heading', { level: 5 }) && "text-main bg-sub/5"
                            )}
                        >
                            <Heading5 size={14} className="opacity-50" />
                            Heading 5
                        </button>

                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
                            className={clsx(
                                "flex items-center gap-2 px-2 py-1.5 hover:bg-sub/10 rounded text-xs text-left font-bold text-[10px]",
                                editor.isActive('heading', { level: 6 }) && "text-main bg-sub/5"
                            )}
                        >
                            <Heading6 size={14} className="opacity-50" />
                            Heading 6
                        </button>

                        <div className="border-t border-sub/30 my-2 mx-4" />

                        {/* Code Section - THIRD */}
                        <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-sub opacity-50">
                            Code
                        </div>

                        <button
                            onClick={() => editor.chain().focus().toggleCode().run()}
                            className={clsx(
                                "flex items-center gap-2 px-2 py-1.5 hover:bg-sub/10 rounded text-xs text-left font-mono",
                                editor.isActive('code') && "text-main bg-sub/5"
                            )}
                        >
                            <Code size={14} className="opacity-50" />
                            Inline Code
                        </button>

                        <button
                            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                            className={clsx(
                                "flex items-center gap-2 px-2 py-1.5 hover:bg-sub/10 rounded text-xs text-left font-mono",
                                editor.isActive('codeBlock') && "text-main bg-sub/5"
                            )}
                        >
                            <Code size={14} className="opacity-50" />
                            Code Block
                        </button>

                        <div className="border-t border-sub/30 my-2 mx-4" />

                        {/* Insert Section */}
                        <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-sub opacity-50">
                            Insert
                        </div>

                        <button
                            onClick={() => editor.chain().focus().setHorizontalRule().run()}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-sub/10 rounded text-xs text-left"
                        >
                            <Minus size={14} className="opacity-50" />
                            Divider
                        </button>

                        <button
                            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                            className={clsx(
                                "flex items-center gap-2 px-2 py-1.5 hover:bg-sub/10 rounded text-xs text-left",
                                editor.isActive('table') && "text-main bg-sub/5"
                            )}
                        >
                            <TableIcon size={14} className="opacity-50" />
                            Table
                        </button>

                        <div className="border-t border-sub/30 my-2 mx-4" />

                        {/* Debug Toggle */}
                        <button
                            onClick={toggleDebug}
                            className={clsx(
                                "flex items-center gap-2 px-2 py-1.5 hover:bg-sub/10 rounded text-xs text-left",
                                showDebug && "text-main bg-sub/5"
                            )}
                        >
                            <Bug size={14} className="opacity-50" />
                            Debug View
                        </button>
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    )
}

import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface ProtocolInstructionViewerProps {
    instruction?: string;
    isExpanded: boolean;
    onInteractionEnter?: () => void;
}

import { parseMarkdownSections, type MarkdownSection } from '../../../utils/markdownUtils';
import { CollapsibleSection } from '../../../components/ui/molecules/CollapsibleSection';

// Helper for dynamic indentation based on header level
const getIndentationClass = (level: number) => {
    switch (level) {
        case 1: return "pl-0";
        case 2: return "pl-4";
        case 3: return "pl-8";
        case 4: return "pl-12";
        case 5: return "pl-16";
        case 6: return "pl-20";
        default: return "pl-0";
    }
}

// Helper for dynamic header font size in the collapse button
const getHeaderSizeClass = (level: number) => {
    switch (level) {
        case 1: return "[&_button]:text-sm";
        case 2: return "[&_button]:text-xs";
        case 3: return "[&_button]:text-[10px]";
        case 4: return "[&_button]:text-[10px]";
        case 5: return "[&_button]:text-[9px]";
        case 6: return "[&_button]:text-[9px]";
        default: return "[&_button]:text-sm";
    }
}

export const ProtocolInstructionViewer = React.memo(({ instruction, isExpanded, onInteractionEnter }: ProtocolInstructionViewerProps) => {
    const sections = React.useMemo(() => parseMarkdownSections(instruction || ''), [instruction]);

    const markdownComponents: Components = {
        h1: ({ className, style, children }) => <h1 className={clsx("text-base font-bold text-text-primary mb-2 mt-4 first:mt-0", className)} style={style}>{children}</h1>,
        h2: ({ className, style, children }) => <h2 className={clsx("text-sm font-bold text-text-primary mb-2 mt-4", className)} style={style}>{children}</h2>,
        h3: ({ className, style, children }) => <h3 className={clsx("text-xs font-bold text-text-primary mb-1 mt-3", className)} style={style}>{children}</h3>,
        h4: ({ className, style, children }) => <h4 className={clsx("text-[11px] font-bold text-text-primary mb-1 mt-2", className)} style={style}>{children}</h4>,
        h5: ({ className, style, children }) => <h5 className={clsx("text-[10px] font-bold text-text-primary mb-1 mt-2", className)} style={style}>{children}</h5>,
        h6: ({ className, style, children }) => <h6 className={clsx("text-[9px] font-bold text-text-primary mb-1 mt-2", className)} style={style}>{children}</h6>,
        p: ({ className, style, children }) => <p className={clsx("mb-1 last:mb-0 text-left", className)} style={style}>{children}</p>,
        div: ({ className, style, children }) => <div className={className} style={style}>{children}</div>,
        ul: ({ className, style, children }) => <ul className={clsx("list-disc list-outside pl-10 mb-1 space-y-0.5 marker:text-text-primary", className)} style={style}>{children}</ul>,
        ol: ({ className, style, children }) => <ol className={clsx("list-decimal list-outside pl-10 mb-1 space-y-0.5 marker:text-text-primary", className)} style={style}>{children}</ol>,
        li: ({ className, style, children }) => <li className={clsx("pl-1", className)} style={style}>{children}</li>,
        strong: ({ className, style, children }) => <strong className={clsx("font-bold text-text-primary", className)} style={style}>{children}</strong>,
        em: ({ className, style, children }) => <em className={clsx("italic text-text-primary/80", className)} style={style}>{children}</em>,
        code: ({ className, style, children }) => <code className={clsx("bg-sub/20 rounded px-1 py-0.5 text-[10px] font-mono text-text-primary", className)} style={style}>{children}</code>,
        blockquote: ({ className, style, children }) => <blockquote className={clsx("border-l-2 border-main/50 pl-3 italic text-sub my-2", className)} style={style}>{children}</blockquote>,
        hr: ({ className, style }) => <hr className={clsx("my-4 border-t border-sub/10 w-full", className)} style={style} />,
    };

    return (
        <AnimatePresence>
            {isExpanded && instruction && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden border-t border-sub/10 px-4"
                    onMouseEnter={() => onInteractionEnter?.()}
                    onMouseMove={(e) => e.stopPropagation()}
                >
                    <div
                        className="rich-text-viewer py-4 prose prose-invert prose-sm max-w-none text-sub font-mono text-xs leading-relaxed select-text cursor-text bg-transparent selection:bg-main/80 selection:text-text-primary"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        {sections.preamble && (
                            <div className="mb-4">
                                <ReactMarkdown rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                                    {sections.preamble}
                                </ReactMarkdown>
                            </div>
                        )}

                        {sections.sections.map((section: MarkdownSection, idx: number) => (
                            <CollapsibleSection
                                key={idx}
                                defaultOpen={false}
                                variant="mini"
                                title={
                                    <div className="inline-block pointer-events-none rich-text-viewer-header">
                                        <ReactMarkdown
                                            rehypePlugins={[rehypeRaw]}
                                            components={{
                                                p: ({ children }) => <span className="inline">{children}</span>,
                                            }}
                                        >
                                            {section.title}
                                        </ReactMarkdown>
                                    </div>
                                }
                                className={clsx(
                                    "mb-4",
                                    "[&_button]:items-start [&_button]:text-left [&_button_div:first-child]:mt-[5px]", // Align chevron to top and text to left
                                    getIndentationClass(section.level),
                                    getHeaderSizeClass(section.level)
                                )}
                            >
                                <ReactMarkdown rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                                    {section.content.join('\n')}
                                </ReactMarkdown>
                            </CollapsibleSection>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

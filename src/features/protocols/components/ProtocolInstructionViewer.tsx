import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface ProtocolInstructionViewerProps {
    instruction?: string;
    isExpanded: boolean;
    onInteractionEnter?: () => void;
}

import { CollapsibleSection } from '../../../components/ui/molecules/CollapsibleSection';

export const ProtocolInstructionViewer = React.memo(({ instruction, isExpanded, onInteractionEnter }: ProtocolInstructionViewerProps) => {
    const sections = React.useMemo(() => {
        if (!instruction) return { preamble: '', sections: [] };

        // Split by headers (h1, h2, h3)
        // Use more robust line splitting to handle different line endings
        const lines = instruction.split(/\r?\n/);
        const result: { title: string; level: number; content: string[] }[] = [];
        let currentSection: { title: string; level: number; content: string[] } | null = null;
        const preamble: string[] = [];

        lines.forEach(line => {
            // More lenient regex for standard markdown headers
            const headerMatch = line.match(/^\s*(#{1,3})\s+(.+?)\s*$/);
            if (headerMatch) {
                if (currentSection) {
                    result.push(currentSection);
                }
                currentSection = {
                    title: headerMatch[2],
                    level: headerMatch[1].length,
                    content: []
                };
            } else if (currentSection) {
                currentSection.content.push(line);
            } else {
                preamble.push(line);
            }
        });

        if (currentSection) {
            result.push(currentSection);
        }

        return { preamble: preamble.join('\n'), sections: result };
    }, [instruction]);

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

                        {sections.sections.map((section, idx) => (
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
                                    section.level === 1 ? "[&_button]:text-sm px-0" :
                                        section.level === 2 ? "px-5 [&_button]:text-xs" :
                                            "px-10 [&_button]:text-[10px]"
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

import React, { useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface ProtocolInstructionViewerProps {
    instruction?: string;
    isExpanded: boolean;
    onInteractionEnter?: () => void;
}

export const ProtocolInstructionViewer = React.memo(({ instruction, isExpanded, onInteractionEnter }: ProtocolInstructionViewerProps) => {
    const markdownComponents: Components = useMemo(() => ({
        h1: ({ ...props }) => <h1 className="text-base font-bold text-text-primary mb-2 mt-4 first:mt-0" {...props} />,
        h2: ({ ...props }) => <h2 className="text-sm font-bold text-text-primary mb-2 mt-4" {...props} />,
        h3: ({ ...props }) => <h3 className="text-xs font-bold text-text-primary mb-1 mt-3" {...props} />,
        p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
        ul: ({ ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
        li: ({ ...props }) => <li className="pl-1" {...props} />,
        strong: ({ ...props }) => <strong className="font-bold text-text-primary" {...props} />,
        em: ({ ...props }) => <em className="italic text-text-primary/80" {...props} />,
        code: ({ ...props }) => <code className="bg-sub/20 rounded px-1 py-0.5 text-[10px] font-mono text-text-primary" {...props} />,
        blockquote: ({ ...props }) => <blockquote className="border-l-2 border-main/50 pl-3 italic text-sub my-2" {...props} />,
    }), []);
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
                        className="py-4 prose prose-invert prose-sm max-w-none text-sub font-mono text-xs leading-relaxed select-text cursor-text bg-transparent selection:bg-main/80 selection:text-text-primary"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        <ReactMarkdown components={markdownComponents}>
                            {instruction}
                        </ReactMarkdown>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

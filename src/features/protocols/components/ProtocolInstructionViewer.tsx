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

export const ProtocolInstructionViewer = React.memo(({ instruction, isExpanded, onInteractionEnter }: ProtocolInstructionViewerProps) => {
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
                        <ReactMarkdown rehypePlugins={[rehypeRaw]} components={{
                            h1: ({ className, style, ...props }) => <h1 className={clsx("text-base font-bold text-text-primary mb-2 mt-4 first:mt-0", className)} style={style} {...props} />,
                            h2: ({ className, style, ...props }) => <h2 className={clsx("text-sm font-bold text-text-primary mb-2 mt-4", className)} style={style} {...props} />,
                            h3: ({ className, style, ...props }) => <h3 className={clsx("text-xs font-bold text-text-primary mb-1 mt-3", className)} style={style} {...props} />,
                            p: ({ className, style, ...props }) => <p className={clsx("mb-1 last:mb-0 text-left", className)} style={style} {...props} />,
                            div: ({ className, style, ...props }) => <div className={className} style={style} {...props} />,
                            ul: ({ className, style, ...props }) => <ul className={clsx("list-disc pl-4 mb-1 space-y-0.5", className)} style={style} {...props} />,
                            ol: ({ className, style, ...props }) => <ol className={clsx("list-decimal pl-4 mb-1 space-y-0.5", className)} style={style} {...props} />,
                            li: ({ className, style, ...props }) => <li className={clsx("pl-1", className)} style={style} {...props} />,
                            strong: ({ className, style, ...props }) => <strong className={clsx("font-bold text-text-primary", className)} style={style} {...props} />,
                            em: ({ className, style, ...props }) => <em className={clsx("italic text-text-primary/80", className)} style={style} {...props} />,
                            code: ({ className, style, ...props }) => <code className={clsx("bg-sub/20 rounded px-1 py-0.5 text-[10px] font-mono text-text-primary", className)} style={style} {...props} />,
                            blockquote: ({ className, style, ...props }) => <blockquote className={clsx("border-l-2 border-main/50 pl-3 italic text-sub my-2", className)} style={style} {...props} />,
                            hr: ({ className, style, ...props }) => <hr className={clsx("my-4 border-t border-sub/10 w-full", className)} style={style} {...props} />,
                        }}>
                            {instruction}
                        </ReactMarkdown>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

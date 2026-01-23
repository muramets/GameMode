import React, { useMemo } from 'react';
import TurndownService from 'turndown';

interface ProtocolInstructionInputProps {
    instruction: string;
    setInstruction: (value: string) => void;
    hasInstruction: boolean;
    setHasInstruction: (value: boolean) => void;
}

const InputLabel = ({ label }: { label: string }) => (
    <label className="text-[10px] text-main font-mono font-bold uppercase tracking-[0.2em] opacity-90 px-1">
        {label}
    </label>
);

export const ProtocolInstructionInput = React.memo(({ instruction, setInstruction, hasInstruction, setHasInstruction }: ProtocolInstructionInputProps) => {
    // Initialize Turndown service
    const turndownService = useMemo(() => {
        const service = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced'
        });
        return service;
    }, []);

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const html = e.clipboardData.getData('text/html');
        if (html) {
            e.preventDefault();
            // Convert HTML to Markdown
            const markdown = turndownService.turndown(html);

            // Insert at cursor position
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const newText = text.substring(0, start) + markdown + text.substring(end);

            setInstruction(newText);

            // Restore cursor position (approximate, at end of inserted text)
            // We need to defer this slightly to let React update state
            setTimeout(() => {
                if (textarea) {
                    textarea.selectionStart = textarea.selectionEnd = start + markdown.length;
                }
            }, 0);
        }
    };

    return (
        <div className="flex flex-col gap-1.5">
            <InputLabel label="Specific Instructions" />
            <div className="flex items-center gap-3">
                <div className="flex-1 bg-sub-alt rounded-lg p-1 flex gap-1">
                    <button
                        type="button"
                        onClick={() => setHasInstruction(false)}
                        className={`flex-1 px-3 py-2 rounded-md text-xs font-mono uppercase font-bold transition-all ${!hasInstruction
                            ? 'bg-sub text-text-primary shadow-sm'
                            : 'text-sub hover:text-text-primary'
                            }`}
                    >
                        Off
                    </button>
                    <button
                        type="button"
                        onClick={() => setHasInstruction(true)}
                        className={`flex-1 px-3 py-2 rounded-md text-xs font-mono uppercase font-bold transition-all ${hasInstruction
                            ? 'bg-sub text-text-primary shadow-sm'
                            : 'text-sub hover:text-text-primary'
                            }`}
                    >
                        On
                    </button>
                </div>
            </div>

            {hasInstruction && (
                <div className="flex flex-col gap-1.5 mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <textarea
                        className="w-full bg-sub-alt rounded-lg px-3 py-2 text-sm font-mono text-text-primary placeholder:text-sub focus:outline-none focus:ring-2 focus:ring-main/50 min-h-[120px] resize-y custom-scrollbar"
                        value={instruction}
                        onChange={e => setInstruction(e.target.value)}
                        onPaste={handlePaste}
                        placeholder="Enter specific instructions..."
                    />
                </div>
            )}
        </div>
    );
});

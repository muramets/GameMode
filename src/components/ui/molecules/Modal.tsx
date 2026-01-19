
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    onSubmit?: (e: React.FormEvent) => void;
    className?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, onSubmit, className = '' }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
            <div
                ref={overlayRef}
                className="absolute inset-0 transition-opacity"
                onClick={onClose}
            />
            <div
                className={`relative bg-bg-primary/95 border border-white/5 rounded-2xl shadow-xl w-full max-w-md overflow-hidden ${className}`}
                style={{ isolation: 'isolate', transform: 'translateZ(0)' }}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-text-primary opacity-90">{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-sub hover:text-text-primary hover:bg-white/5 transition-colors"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    </button>
                </div>
                <div className="p-6">
                    {onSubmit ? (
                        <form onSubmit={onSubmit}>
                            {children}
                            {footer && (
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                                    {footer}
                                </div>
                            )}
                        </form>
                    ) : (
                        <>
                            {children}
                            {footer && (
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                                    {footer}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

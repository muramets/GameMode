import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

interface ToastProps {
    message: string;
    isVisible: boolean;
    duration?: number;
    onClose: () => void;
    type?: 'success' | 'error';
}

export function Toast({
    message,
    isVisible,
    duration = 5000,
    onClose,
    type = 'success',
}: ToastProps) {
    const [shouldRender, setShouldRender] = useState(false);
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (isVisible) {
            setTimeout(() => {
                setShouldRender(true);
                setAnimationClass('animate-fade-in-up');
            }, 0);

            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        } else if (shouldRender) {
            setTimeout(() => setAnimationClass('animate-fade-out-down'), 0);
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose, shouldRender]);

    if (!shouldRender) return null;

    const bgColor = type === 'success' ? 'bg-correct' : 'bg-error';
    const icon = type === 'success' ? faCheckCircle : faExclamationCircle;

    return createPortal(
        <div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[20000]"
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className={`${bgColor} text-bg-primary pl-4 pr-3 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${animationClass}`}
            >
                <FontAwesomeIcon icon={icon} className="text-bg-primary flex-shrink-0" />
                <span className="text-sm font-medium font-mono flex-grow">{message}</span>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="bg-transparent border-none text-bg-primary/80 hover:text-bg-primary cursor-pointer p-1 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                >
                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                </button>
            </div>
        </div>,
        document.body
    );
}

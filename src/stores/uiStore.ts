import { create } from 'zustand';

interface ToastState {
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
    actionLabel?: string;
    onAction?: () => void;
}

interface UIState {
    toast: ToastState;
    showToast: (message: string, type?: 'success' | 'error', actionLabel?: string, onAction?: () => void) => void;
    hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    toast: {
        message: '',
        type: 'success',
        isVisible: false,
        actionLabel: undefined,
        onAction: undefined,
    },

    showToast: (message, type = 'success', actionLabel, onAction) => set({
        toast: { message, type, isVisible: true, actionLabel, onAction }
    }),

    hideToast: () => set((state) => ({
        toast: { ...state.toast, isVisible: false, actionLabel: undefined, onAction: undefined }
    })),
}));

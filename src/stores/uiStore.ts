import { create } from 'zustand';

interface ToastState {
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
}

interface UIState {
    toast: ToastState;
    showToast: (message: string, type?: 'success' | 'error') => void;
    hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    toast: {
        message: '',
        type: 'success',
        isVisible: false,
    },

    showToast: (message, type = 'success') => set({
        toast: { message, type, isVisible: true }
    }),

    hideToast: () => set((state) => ({
        toast: { ...state.toast, isVisible: false }
    })),
}));

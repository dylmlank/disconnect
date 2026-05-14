import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
  color?: string;
}

interface ToastState {
  current: ToastMessage | null;
  queue: ToastMessage[];
  show: (toast: Omit<ToastMessage, 'id'>) => void;
  dismiss: () => void;
}

let toastId = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  current: null,
  queue: [],

  show: (toast) => {
    const msg: ToastMessage = { ...toast, id: `toast-${++toastId}` };
    const { current } = get();
    if (current) {
      set((s) => ({ queue: [...s.queue, msg] }));
    } else {
      set({ current: msg });
    }
  },

  dismiss: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ current: next, queue: rest });
    } else {
      set({ current: null });
    }
  },
}));

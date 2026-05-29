import { create } from 'zustand';

export const useAppStore = create((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (activeTab) => set({ activeTab })
}));

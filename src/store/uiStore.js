import { create } from "zustand";

export const useUiStore = create((set) => ({
  sidebarOpen: false,
  modalOpen: null,         // null | string (modal id)
  modalData: null,

  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  openModal: (id, data = null) => set({ modalOpen: id, modalData: data }),
  closeModal: () => set({ modalOpen: null, modalData: null }),
}));

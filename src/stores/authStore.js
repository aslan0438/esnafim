import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  businessId: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setBusinessId: (businessId) => set({ businessId }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, businessId: null }),
}))

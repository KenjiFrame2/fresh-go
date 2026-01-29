import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  storeIds: string[];
  productIds: string[];
  toggleStore: (id: string) => void;
  toggleProduct: (id: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      storeIds: [],
      productIds: [],
      toggleStore: (id) => set((state) => ({
        storeIds: state.storeIds.includes(id)
          ? state.storeIds.filter((i) => i !== id)
          : [...state.storeIds, id],
      })),
      toggleProduct: (id) => set((state) => ({
        productIds: state.productIds.includes(id)
          ? state.productIds.filter((i) => i !== id)
          : [...state.productIds, id],
      })),
    }),
    { name: 'user-favorites' }
  )
);
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  storeId: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: any) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, delta: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product) => set((state) => {
        const existing = state.items.find(i => i.id === product.id);
        if (existing) {
          return { items: state.items.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) };
        }
        return { items: [...state.items, { ...product, qty: 1, price: Number(product.price) }] };
      }),
      removeItem: (productId) => set((state) => ({
        items: state.items.filter(i => i.id !== productId)
      })),
      updateQty: (productId, delta) => set((state) => ({
        items: state.items.map(i => {
          if (i.id === productId) {
            const newQty = Math.max(1, i.qty + delta);
            return { ...i, qty: newQty };
          }
          return i;
        })
      })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'shopping-cart' } // Имя ключа в LocalStorage
  )
);
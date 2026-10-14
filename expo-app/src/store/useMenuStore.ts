import { create } from 'zustand';
import { MenuItem } from '../types';
import { menuApi } from '../api/menuApi';

interface MenuState {
  items: MenuItem[];
  categories: string[];
  isLoading: boolean;
  isRefreshing: boolean;
  lastFetchedAt: number | null;
  error: string | null;

  fetchMenu: (force?: boolean) => Promise<void>;
  refreshMenu: () => Promise<void>;
  addItemToStore: (item: MenuItem) => void;
  upsertItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  updateAvailabilityInStore: (id: string, isAvailable: boolean) => void;
  clearMenu: () => void;
  resetMenu: () => void;
}

const extractCategories = (items: MenuItem[]): string[] => {
  const cats = new Set(items.map(i => i.category).filter(Boolean));
  return Array.from(cats);
};

const normalizeItem = (item: any): MenuItem => ({
  ...item,
  id: item.id || item._id || '',
  _id: item._id || item.id,
  pricePaise: typeof item.pricePaise === 'number' ? item.pricePaise : 0,
  isAvailable: item.isAvailable !== false,
});

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],
  categories: [],
  isLoading: false,
  isRefreshing: false,
  lastFetchedAt: null,
  error: null,

  fetchMenu: async (force = false) => {
    const state = get();
    const hasItems = state.items.length > 0;
    if (!hasItems) {
      set({ isLoading: true, error: null });
    } else {
      set({ isRefreshing: true });
    }

    try {
      const data = await menuApi.getMenu();
      const normalized = (data || []).map(normalizeItem);
      set({
        items: normalized,
        categories: extractCategories(normalized),
        lastFetchedAt: Date.now(),
        isLoading: false,
        isRefreshing: false,
        error: null,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        isRefreshing: false,
        error: err.message || 'Unable to load menu.',
      });
    }
  },

  refreshMenu: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const data = await menuApi.getMenu();
      const normalized = (data || []).map(normalizeItem);
      set({
        items: normalized,
        categories: extractCategories(normalized),
        lastFetchedAt: Date.now(),
        isRefreshing: false,
      });
    } catch (err: any) {
      set({ isRefreshing: false });
    }
  },

  addItemToStore: (newItem: MenuItem) => {
    const item = normalizeItem(newItem);
    set((state) => {
      const exists = state.items.some(i => (i.id === item.id || i._id === item.id || i._id === item._id));
      const items = exists
        ? state.items.map(i => ((i.id === item.id || i._id === item.id || i._id === item._id) ? item : i))
        : [item, ...state.items];
      return { items, categories: extractCategories(items) };
    });
  },

  upsertItem: (updatedItem: MenuItem) => {
    const item = normalizeItem(updatedItem);
    set((state) => {
      const exists = state.items.some(i => (i.id === item.id || i._id === item.id || i._id === item._id));
      const items = exists
        ? state.items.map(i => ((i.id === item.id || i._id === item.id || i._id === item._id) ? item : i))
        : [item, ...state.items];
      return { items, categories: extractCategories(items) };
    });
  },

  removeItem: (id: string) => {
    set((state) => {
      const items = state.items.filter(i => i.id !== id && i._id !== id);
      return { items, categories: extractCategories(items) };
    });
  },

  updateAvailabilityInStore: (id: string, isAvailable: boolean) => {
    set((state) => {
      const items = state.items.map(i =>
        (i.id === id || i._id === id) ? { ...i, isAvailable } : i
      );
      return { items };
    });
  },

  clearMenu: () => {
    set({ items: [], categories: [], lastFetchedAt: null, error: null });
  },

  resetMenu: () => {
    get().clearMenu();
  },
}));


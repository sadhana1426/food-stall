import { create } from 'zustand';
import { MenuItem } from '../types';

export const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Samosa', pricePaise: 1500, category: 'Snacks', isAvailable: true },
  { id: '2', name: 'Vada Pav', pricePaise: 3000, category: 'Snacks', isAvailable: true },
  { id: '3', name: 'Masala Dosa', pricePaise: 6000, category: 'Meals', isAvailable: true },
  { id: '4', name: 'Idli', pricePaise: 4000, category: 'Meals', isAvailable: true },
  { id: '5', name: 'Tea', pricePaise: 1000, category: 'Beverages', isAvailable: true },
  { id: '6', name: 'Coffee', pricePaise: 2000, category: 'Beverages', isAvailable: true },
  { id: '7', name: 'Veg Puff', pricePaise: 2500, category: 'Snacks', isAvailable: true },
  { id: '8', name: 'Paneer Roll', pricePaise: 7000, category: 'Meals', isAvailable: true },
  { id: '9', name: 'Lemon Soda', pricePaise: 3000, category: 'Beverages', isAvailable: true },
  { id: '10', name: 'Water Bottle', pricePaise: 2000, category: 'Beverages', isAvailable: true },
];

interface MenuState {
  items: MenuItem[];
  categories: string[];
  
  addItem: (item: Omit<MenuItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<MenuItem>) => void;
  toggleAvailability: (id: string) => void;
  resetMenu: () => void;
}

const extractCategories = (items: MenuItem[]) => {
  const cats = new Set(items.map(i => i.category));
  return Array.from(cats);
};

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [...INITIAL_MENU],
  categories: extractCategories(INITIAL_MENU),
  
  addItem: (newItem) => set((state) => {
    const nextId = (Math.max(...state.items.map(i => parseInt(i.id) || 0)) + 1).toString();
    const items = [...state.items, { ...newItem, id: nextId }];
    return { items, categories: extractCategories(items) };
  }),
  
  updateItem: (id, updates) => set((state) => {
    const items = state.items.map(item => item.id === id ? { ...item, ...updates } : item);
    return { items, categories: extractCategories(items) };
  }),
  
  toggleAvailability: (id) => set((state) => ({
    items: state.items.map(item => item.id === id ? { ...item, isAvailable: !item.isAvailable } : item)
  })),
  
  resetMenu: () => set({ items: [...INITIAL_MENU], categories: extractCategories(INITIAL_MENU) }),
}));

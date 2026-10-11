import { create } from 'zustand';
import { Order } from '../types';

interface OrdersState {
  orders: Order[];
  nextBillNumber: number;
  
  createOrder: (order: Omit<Order, 'id' | 'billNumber' | 'createdAt' | 'printCount'>) => Order;
  incrementPrintCount: (orderId: string) => void;
  resetOrders: () => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  nextBillNumber: 1001,
  
  createOrder: (orderData) => {
    const { nextBillNumber, orders } = get();
    const newOrder: Order = {
      ...orderData,
      id: Math.random().toString(36).substring(2, 9),
      billNumber: `#${nextBillNumber}`,
      createdAt: new Date().toISOString(),
      printCount: 0,
    };
    
    set({
      orders: [newOrder, ...orders],
      nextBillNumber: nextBillNumber + 1,
    });
    
    return newOrder;
  },
  
  incrementPrintCount: (orderId) => set((state) => ({
    orders: state.orders.map(order => 
      order.id === orderId ? { ...order, printCount: order.printCount + 1 } : order
    )
  })),
  
  resetOrders: () => set({ orders: [], nextBillNumber: 1001 }),
}));

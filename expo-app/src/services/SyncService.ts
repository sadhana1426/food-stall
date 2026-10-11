import { getDB } from '../database/db';
import { ordersApi } from '../api/ordersApi';
import { ApiError } from '../api/client';

export const SyncService = {
  syncPendingOrders: async () => {
    try {
      const db = getDB();
      const pendingOrders = await db.getAllAsync('SELECT * FROM pending_orders WHERE status = ?', ['PENDING_SYNC']);
      
      for (const orderRow of pendingOrders as any[]) {
        try {
          const orderData = JSON.parse(orderRow.orderData);
          
          await db.runAsync('UPDATE pending_orders SET status = ? WHERE clientOrderId = ?', ['SYNCING', orderRow.clientOrderId]);
          
          // API Call
          const serverOrder = await ordersApi.createOrder(orderData);
          
          // Update local record to synced
          await db.runAsync('UPDATE pending_orders SET status = ?, localOrderId = ? WHERE clientOrderId = ?', ['SYNCED', serverOrder.billNumber, orderRow.clientOrderId]);
          
        } catch (error) {
          if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
             // Still pending
             await db.runAsync('UPDATE pending_orders SET status = ? WHERE clientOrderId = ?', ['PENDING_SYNC', orderRow.clientOrderId]);
          } else {
             // Failed for other reason (validation, etc)
             await db.runAsync('UPDATE pending_orders SET status = ? WHERE clientOrderId = ?', ['FAILED', orderRow.clientOrderId]);
          }
        }
      }
    } catch (e) {
      console.error("Sync process failed", e);
    }
  },
  
  saveOrderLocally: async (clientOrderId: string, orderData: any) => {
    const db = getDB();
    const localOrderId = `OFF-${clientOrderId.substring(0,6).toUpperCase()}`;
    await db.runAsync(
      'INSERT OR REPLACE INTO pending_orders (clientOrderId, localOrderId, orderData, status, createdAt) VALUES (?, ?, ?, ?, ?)',
      [clientOrderId, localOrderId, JSON.stringify(orderData), 'PENDING_SYNC', new Date().toISOString()]
    );
    return localOrderId;
  }
};

import { Order } from '../models/Order';
import mongoose from 'mongoose';

export class SalesService {
  static async getTodaySales(businessId: string) {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    const match = { 
      businessId: new mongoose.Types.ObjectId(businessId), 
      createdAt: { $gte: startOfDay, $lte: endOfDay } 
    };

    const result = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalSalesPaise: { $sum: '$grandTotalPaise' },
          totalBills: { $sum: 1 },
          dineInSalesPaise: {
            $sum: { $cond: [{ $eq: ['$orderType', 'DINE_IN'] }, '$grandTotalPaise', 0] }
          },
          takeawaySalesPaise: {
            $sum: { $cond: [{ $eq: ['$orderType', 'TAKEAWAY'] }, '$grandTotalPaise', 0] }
          }
        }
      }
    ]);

    const topItemsResult = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          itemName: { $first: '$items.itemName' },
          quantity: { $sum: '$items.quantity' },
          salesPaise: { $sum: '$items.lineTotalPaise' }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          menuItemId: '$_id',
          itemName: 1,
          quantity: 1,
          salesPaise: 1
        }
      }
    ]);

    const defaultStats = {
      totalSalesPaise: 0,
      totalBills: 0,
      dineInSalesPaise: 0,
      takeawaySalesPaise: 0,
      averageBillPaise: 0,
    };

    if (result.length > 0) {
      const stats = result[0];
      return {
        ...stats,
        averageBillPaise: Math.round(stats.totalSalesPaise / stats.totalBills),
        topItems: topItemsResult,
      };
    }

    return { ...defaultStats, topItems: [] };
  }
}

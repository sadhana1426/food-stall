import { Order, IOrderItemSnapshot, IBusinessSnapshot } from '../models/Order';
import { MenuItem } from '../models/MenuItem';
import { Business } from '../models/Business';
import { Counter } from '../models/Counter';
import { ApiError } from '../utils/ApiError';

export class OrderService {
  static async getNextBillNumber(businessId: string): Promise<string> {
    const counterId = `bill_${businessId}`;
    const counter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    return `#${counter.seq}`;
  }

  static async createOrder(businessId: string, data: any) {
    const existingOrder = await Order.findOne({ clientOrderId: data.clientOrderId, businessId });
    if (existingOrder) return existingOrder;

    let settings = await Business.findById(businessId);
    if (!settings) throw new ApiError(404, 'Business not found');

    const businessSnapshot: IBusinessSnapshot = {
      name: settings.businessName,
      address: settings.address,
      phone: settings.phone || '',
      receiptFooter: settings.receiptFooter,
    };

    let subtotalPaise = 0;
    const itemSnapshots: IOrderItemSnapshot[] = [];

    for (const reqItem of data.items) {
      const menuDoc = await MenuItem.findOne({ _id: reqItem.menuItemId, businessId });
      if (!menuDoc) throw new ApiError(400, `Menu item not found: ${reqItem.menuItemId}`);
      
      const lineTotalPaise = menuDoc.pricePaise * reqItem.quantity;
      subtotalPaise += lineTotalPaise;

      itemSnapshots.push({
        menuItemId: menuDoc.id,
        itemName: menuDoc.name,
        unitPricePaise: menuDoc.pricePaise,
        quantity: reqItem.quantity,
        lineTotalPaise,
      });
    }

    let discountAmountPaise = 0;
    if (data.discount.type === 'PERCENTAGE') {
      discountAmountPaise = Math.round(subtotalPaise * (data.discount.value / 100));
    } else if (data.discount.type === 'FIXED') {
      discountAmountPaise = data.discount.value;
    }

    if (discountAmountPaise > subtotalPaise) discountAmountPaise = subtotalPaise;

    const taxableAmount = subtotalPaise - discountAmountPaise;

    let taxAmountPaise = 0;
    const taxRate = settings.taxEnabled ? settings.taxRate : 0;
    if (settings.taxEnabled) {
      taxAmountPaise = Math.round(taxableAmount * (taxRate / 100));
    }

    const grandTotalPaise = taxableAmount + taxAmountPaise;

    const billNumber = await this.getNextBillNumber(businessId);

    const order = new Order({
      businessId,
      billNumber,
      clientOrderId: data.clientOrderId,
      orderType: data.orderType,
      items: itemSnapshots,
      subtotalPaise,
      discount: data.discount,
      discountAmountPaise,
      taxRate,
      taxAmountPaise,
      grandTotalPaise,
      businessSnapshot,
    });

    return await order.save();
  }

  static async getOrders(businessId: string, query: any) {
    const filter: any = { businessId };
    if (query.billNumber) filter.billNumber = query.billNumber;
    if (query.orderType) filter.orderType = query.orderType;
    
    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {};
      if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
    }

    return await Order.find(filter).sort({ createdAt: -1 });
  }

  static async getOrderById(businessId: string, id: string) {
    const order = await Order.findOne({ _id: id, businessId });
    if (!order) throw new ApiError(404, 'Order not found');
    return order;
  }

  static async getOrderByBillNumber(businessId: string, billNumber: string) {
    const order = await Order.findOne({ billNumber, businessId });
    if (!order) throw new ApiError(404, 'Order not found');
    return order;
  }

  static async reprintOrder(businessId: string, id: string) {
    const order = await Order.findOneAndUpdate(
      { _id: id, businessId },
      { $inc: { printCount: 1 }, lastPrintedAt: new Date() },
      { new: true }
    );
    if (!order) throw new ApiError(404, 'Order not found');
    return order;
  }
}

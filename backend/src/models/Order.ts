import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItemSnapshot {
  menuItemId: string;
  itemName: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
}

export interface IBusinessSnapshot {
  name: string;
  address: string;
  phone: string;
  receiptFooter: string;
}

export interface IOrder extends Document {
  businessId: mongoose.Types.ObjectId;
  billNumber: string;
  clientOrderId: string; // for idempotency
  orderType: 'DINE_IN' | 'TAKEAWAY';
  items: IOrderItemSnapshot[];
  subtotalPaise: number;
  discount: {
    type: 'NONE' | 'PERCENTAGE' | 'FIXED';
    value: number;
  };
  discountAmountPaise: number;
  taxRate: number;
  taxAmountPaise: number;
  grandTotalPaise: number;
  businessSnapshot: IBusinessSnapshot;
  printCount: number;
  lastPrintedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    billNumber: { type: String, required: true },
    clientOrderId: { type: String, required: true },
    orderType: { type: String, enum: ['DINE_IN', 'TAKEAWAY'], required: true },
    items: [
      {
        menuItemId: { type: String, required: true },
        itemName: { type: String, required: true },
        unitPricePaise: { type: Number, required: true },
        quantity: { type: Number, required: true },
        lineTotalPaise: { type: Number, required: true },
      },
    ],
    subtotalPaise: { type: Number, required: true },
    discount: {
      type: { type: String, enum: ['NONE', 'PERCENTAGE', 'FIXED'], required: true },
      value: { type: Number, required: true },
    },
    discountAmountPaise: { type: Number, required: true },
    taxRate: { type: Number, required: true },
    taxAmountPaise: { type: Number, required: true },
    grandTotalPaise: { type: Number, required: true },
    businessSnapshot: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: String, required: true },
      receiptFooter: { type: String, required: true },
    },
    printCount: { type: Number, default: 0 },
    lastPrintedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ businessId: 1, createdAt: -1 });
orderSchema.index({ businessId: 1, billNumber: 1 }, { unique: true });
orderSchema.index({ businessId: 1, clientOrderId: 1 }, { unique: true });

export const Order = mongoose.model<IOrder>('Order', orderSchema);

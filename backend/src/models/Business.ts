import mongoose, { Document, Schema } from 'mongoose';

export interface IBusiness extends Document {
  businessName: string;
  address: string;
  phone?: string;
  receiptFooter: string;
  taxEnabled: boolean;
  taxRate: number;
  defaultDiscount: {
    type: 'NONE' | 'PERCENTAGE' | 'FIXED';
    value: number;
  };
  defaultOrderType: 'DINE_IN' | 'TAKEAWAY';
  paperWidth: '58mm' | '80mm';
  setupCompleted: boolean;
  adminPinHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<IBusiness>(
  {
    businessName: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    receiptFooter: { type: String, default: 'Thank you! Visit again.' },
    taxEnabled: { type: Boolean, default: false },
    taxRate: { type: Number, default: 0 },
    defaultDiscount: {
      type: { type: String, enum: ['NONE', 'PERCENTAGE', 'FIXED'], default: 'NONE' },
      value: { type: Number, default: 0 },
    },
    defaultOrderType: { type: String, enum: ['DINE_IN', 'TAKEAWAY'], default: 'DINE_IN' },
    paperWidth: { type: String, enum: ['58mm', '80mm'], default: '80mm' },
    setupCompleted: { type: Boolean, default: false },
    adminPinHash: { type: String },
  },
  { timestamps: true }
);

export const Business = mongoose.model<IBusiness>('Business', businessSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessSettings extends Document {
  businessName: string;
  address: string;
  phone: string;
  receiptFooter: string;
  taxEnabled: boolean;
  taxRate: number;
  defaultDiscount: {
    type: 'NONE' | 'PERCENTAGE' | 'FIXED';
    value: number;
  };
  defaultOrderType: 'DINE_IN' | 'TAKEAWAY';
  paperWidth: '58mm' | '80mm';
  autoPrint: boolean;
  adminPinHash?: string;
  securityQuestions?: { question: string; answer: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const businessSettingsSchema = new Schema<IBusinessSettings>(
  {
    businessName: { type: String, required: true, default: 'Tasty Bites' },
    address: { type: String, required: true, default: 'Food Street, Bengaluru' },
    phone: { type: String, required: true, default: '98765 43210' },
    receiptFooter: { type: String, required: true, default: 'Thank You! Visit Again.' },
    taxEnabled: { type: Boolean, default: false },
    taxRate: { type: Number, default: 5 },
    defaultDiscount: {
      type: { type: String, enum: ['NONE', 'PERCENTAGE', 'FIXED'], default: 'NONE' },
      value: { type: Number, default: 0 },
    },
    defaultOrderType: { type: String, enum: ['DINE_IN', 'TAKEAWAY'], default: 'DINE_IN' },
    paperWidth: { type: String, enum: ['58mm', '80mm'], default: '80mm' },
    autoPrint: { type: Boolean, default: true },
    adminPinHash: { type: String },
    securityQuestions: [{
      question: { type: String, required: true },
      answer: { type: String, required: true },
    }],
  },
  {
    timestamps: true,
  }
);

export const BusinessSettings = mongoose.model<IBusinessSettings>('BusinessSettings', businessSettingsSchema);

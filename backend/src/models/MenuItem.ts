import mongoose, { Document, Schema } from 'mongoose';

export interface IMenuItem extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  pricePaise: number;
  category: string;
  isAvailable: boolean;
  sortOrder: number;
  image?: {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    format?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    name: { type: String, required: true },
    pricePaise: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    image: {
      url: String,
      publicId: String,
      width: Number,
      height: Number,
      format: String,
    },
  },
  {
    timestamps: true,
  }
);

menuItemSchema.index({ businessId: 1, isAvailable: 1 });
menuItemSchema.index({ businessId: 1, category: 1 });
menuItemSchema.index({ businessId: 1, sortOrder: 1 });

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', menuItemSchema);

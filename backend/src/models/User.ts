import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  businessId: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  role: 'OWNER';
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['OWNER'], default: 'OWNER' },
    emailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);

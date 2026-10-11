import { Business } from '../models/Business';
import { User } from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { ApiError } from '../utils/ApiError';

export class SettingsService {
  static async getSettings(businessId: string) {
    const settings = await Business.findById(businessId);
    if (!settings) throw new ApiError(404, 'Business not found');
    return settings;
  }

  static async updateSettings(businessId: string, updates: any) {
    const settings = await Business.findById(businessId);
    if (!settings) throw new ApiError(404, 'Business not found');

    // Backward compatibility cleanup if needed
    if (updates.adminPin) {
      delete updates.adminPin;
    }

    Object.assign(settings, updates);
    return await settings.save();
  }

  static async verifyAdminPassword(userId: string, businessId: string, password: string) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new ApiError(401, 'Invalid password');
    }

    const token = jwt.sign({ admin: true, businessId }, config.ADMIN_TOKEN_SECRET || 'dev_secret', { expiresIn: '12h' });
    return token;
  }
}

import { Response, NextFunction } from 'express';
import { SettingsService } from '../services/settingsService';
import { AuthRequest } from '../middleware/authMiddleware';

export const getSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await SettingsService.getSettings(req.user!.businessId);
    const data = settings.toObject();
    delete data.adminPinHash;
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await SettingsService.updateSettings(req.user!.businessId, req.body);
    const data = settings.toObject();
    delete data.adminPinHash;
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const verifyAdminPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = await SettingsService.verifyAdminPassword(req.user!.userId, req.user!.businessId, req.body.password);
    res.json({ success: true, data: { token } });
  } catch (error) {
    next(error);
  }
};

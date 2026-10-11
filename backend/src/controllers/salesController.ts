import { Response, NextFunction } from 'express';
import { SalesService } from '../services/salesService';
import { AuthRequest } from '../middleware/authMiddleware';

export const getTodaySales = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await SalesService.getTodaySales(req.user!.businessId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

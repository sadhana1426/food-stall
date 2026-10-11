import { Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { AuthRequest } from '../middleware/authMiddleware';

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.createOrder(req.user!.businessId, req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orders = await OrderService.getOrders(req.user!.businessId, req.query);
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.getOrderById(req.user!.businessId, req.params.id);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const getOrderByBillNumber = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.getOrderByBillNumber(req.user!.businessId, req.params.billNumber);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const reprintOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.reprintOrder(req.user!.businessId, req.params.id);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

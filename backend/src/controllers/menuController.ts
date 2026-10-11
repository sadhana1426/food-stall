import { Response, NextFunction } from 'express';
import { MenuService } from '../services/menuService';
import { AuthRequest } from '../middleware/authMiddleware';

export const getMenu = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await MenuService.getMenuItems(req.user!.businessId, req.query);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const getMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await MenuService.getMenuItemById(req.user!.businessId, req.params.id);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await MenuService.createMenuItem(req.user!.businessId, req.body, req.file);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await MenuService.updateMenuItem(req.user!.businessId, req.params.id, req.body, req.file);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const removeMenuImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await MenuService.removeMenuImage(req.user!.businessId, req.params.id);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const toggleAvailability = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await MenuService.toggleAvailability(req.user!.businessId, req.params.id);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await MenuService.deleteMenuItem(req.user!.businessId, req.params.id);
    res.json({ success: true, data: { message: 'Item deleted successfully' } });
  } catch (error) {
    next(error);
  }
};

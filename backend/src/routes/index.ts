import { Router } from 'express';
import menuRoutes from './menuRoutes';
import orderRoutes from './orderRoutes';
import salesRoutes from './salesRoutes';
import settingsRoutes from './settingsRoutes';
import authRoutes from './authRoutes';
import reportRoutes from './reportRoutes';

const router = Router();

router.use('/auth', authRoutes);

router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/sales', salesRoutes);
router.use('/settings', settingsRoutes);
router.use('/reports', reportRoutes);

export default router;

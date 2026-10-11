import { Router } from 'express';
import * as salesController from '../controllers/salesController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/today', salesController.getTodaySales);

export default router;

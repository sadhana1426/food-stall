import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/orders/:id/pdf', reportController.getOrderPdf);
router.get('/sales/pdf', reportController.getSalesPdf);
router.get('/sales/csv', reportController.getSalesCsv);

export default router;

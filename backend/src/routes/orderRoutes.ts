import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { validate } from '../middleware/validate';
import { createOrderSchema } from '../validation/orderSchemas';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrder);
router.get('/by-bill/:billNumber', orderController.getOrderByBillNumber);
router.post('/:id/reprint', orderController.reprintOrder);

export default router;

import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { validate } from '../middleware/validate';
import { updateBusinessSettingsSchema, updateBillingSettingsSchema, verifyPasswordSchema } from '../validation/settingsSchemas';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/business', settingsController.getSettings);
router.put('/business', validate(updateBusinessSettingsSchema), settingsController.updateSettings);

router.get('/billing', settingsController.getSettings); // Shared resource for now
router.put('/billing', validate(updateBillingSettingsSchema), settingsController.updateSettings);

router.post('/verify-password', validate(verifyPasswordSchema), settingsController.verifyAdminPassword);

export default router;

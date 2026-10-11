import { Router } from 'express';
import * as menuController from '../controllers/menuController';
import { validate } from '../middleware/validate';
import { createMenuSchema, updateMenuSchema } from '../validation/menuSchemas';
import { requireAuth } from '../middleware/authMiddleware';
import multer from 'multer';
import fs from 'fs';

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const router = Router();
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

router.use(requireAuth);

router.get('/', menuController.getMenu);
router.get('/:id', menuController.getMenuItem);

router.post(
  '/', 
  upload.single('image'), 
  validate(createMenuSchema), 
  menuController.createMenuItem
);

router.patch(
  '/:id', 
  upload.single('image'), 
  validate(updateMenuSchema), 
  menuController.updateMenuItem
);

router.patch('/:id/availability', menuController.toggleAvailability);
router.delete('/:id/image', menuController.removeMenuImage);
router.delete('/:id', menuController.deleteMenuItem);

export default router;

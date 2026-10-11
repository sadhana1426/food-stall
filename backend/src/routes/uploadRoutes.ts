import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/authMiddleware';
import { uploadImage } from '../controllers/uploadController';
import fs from 'fs';

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/image', requireAuth, upload.single('image'), uploadImage);

export default router;

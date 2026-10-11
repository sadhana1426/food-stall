import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env';
import fs from 'node:fs';

// CLOUDINARY_URL is automatically picked up by cloudinary from process.env

export const uploadImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'tasty-bites/menu-items',
    });

    // Delete temporary local file
    fs.unlinkSync(req.file.path);

    res.json({ success: true, data: { url: result.secure_url } });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

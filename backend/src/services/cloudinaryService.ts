import { cloudinary } from '../config/cloudinary';
import { config } from '../config/env';
import { ApiError } from '../utils/ApiError';
import fs from 'node:fs';

export class CloudinaryService {
  static async uploadMenuImage(filePath: string, businessId: string) {
    if (!config.CLOUDINARY_CLOUD_NAME && !config.CLOUDINARY_URL) {
      throw new ApiError(500, 'Cloudinary is not configured');
    }
    
    try {
      const folder = `${config.CLOUDINARY_FOLDER}/${businessId}`;
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [
          { width: 600, height: 600, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new ApiError(500, 'Failed to upload image to cloud storage');
    } finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  static async deleteMenuImage(publicId: string) {
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Failed to delete old image from Cloudinary:', error);
      // We don't throw here to avoid failing a safe DB replacement
    }
  }
}

import { v2 as cloudinary } from 'cloudinary';
import { config } from './env';

if (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
  });
} else if (config.CLOUDINARY_URL) {
  // CLOUDINARY_URL naturally configures it, but just in case
  process.env.CLOUDINARY_URL = config.CLOUDINARY_URL;
}

export { cloudinary };

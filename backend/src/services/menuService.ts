import { MenuItem, IMenuItem } from '../models/MenuItem';
import { ApiError } from '../utils/ApiError';
import { CloudinaryService } from './cloudinaryService';
import fs from 'fs';

export class MenuService {
  static async getMenuItems(businessId: string, query: any) {
    const filter: any = { businessId };
    if (query.available === 'true') filter.isAvailable = true;
    if (query.category) filter.category = query.category;
    if (query.search) filter.name = { $regex: query.search, $options: 'i' };

    return await MenuItem.find(filter).sort({ sortOrder: 1, createdAt: 1 });
  }

  static async getMenuItemById(businessId: string, id: string) {
    const item = await MenuItem.findOne({ _id: id, businessId });
    if (!item) throw new ApiError(404, 'Menu item not found');
    return item;
  }

  static async createMenuItem(businessId: string, data: Partial<IMenuItem>, file?: Express.Multer.File) {
    let imageObj = undefined;

    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        fs.unlinkSync(file.path);
        throw new ApiError(400, 'Choose a JPG, PNG or WebP image under 5 MB.');
      }
      imageObj = await CloudinaryService.uploadMenuImage(file.path, businessId);
    }

    try {
      const item = new MenuItem({ ...data, businessId, image: imageObj });
      return await item.save();
    } catch (err) {
      if (imageObj?.publicId) {
        await CloudinaryService.deleteMenuImage(imageObj.publicId);
      }
      throw err;
    }
  }

  static async updateMenuItem(businessId: string, id: string, data: any, file?: Express.Multer.File) {
    const existingItem = await MenuItem.findOne({ _id: id, businessId });
    if (!existingItem) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new ApiError(404, 'Menu item not found');
    }

    let newImageObj = undefined;
    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        fs.unlinkSync(file.path);
        throw new ApiError(400, 'Choose a JPG, PNG or WebP image under 5 MB.');
      }
      newImageObj = await CloudinaryService.uploadMenuImage(file.path, businessId);
    }

    // Prepare update data
    const updateData = { ...data };
    
    // If a new image was uploaded
    if (newImageObj) {
      updateData.image = newImageObj;
    } 
    // If frontend explicitly requests to remove the image and no new image is provided
    else if (data.removeImage === true || data.removeImage === 'true') {
      updateData.image = null;
    }
    // Otherwise keep the existing image

    try {
      const updatedItem = await MenuItem.findOneAndUpdate(
        { _id: id, businessId }, 
        updateData, 
        { new: true, runValidators: true }
      );
      
      // If image was replaced or removed, delete old image from Cloudinary
      if ((newImageObj || updateData.image === null) && existingItem.image?.publicId) {
        await CloudinaryService.deleteMenuImage(existingItem.image.publicId);
      }
      
      return updatedItem;
    } catch (err) {
      if (newImageObj?.publicId) {
        await CloudinaryService.deleteMenuImage(newImageObj.publicId);
      }
      throw err;
    }
  }

  static async removeMenuImage(businessId: string, id: string) {
    const existingItem = await MenuItem.findOne({ _id: id, businessId });
    if (!existingItem) throw new ApiError(404, 'Menu item not found');

    const publicId = existingItem.image?.publicId;
    
    existingItem.image = undefined;
    await existingItem.save();

    if (publicId) {
      await CloudinaryService.deleteMenuImage(publicId);
    }
    
    return existingItem;
  }

  static async toggleAvailability(businessId: string, id: string) {
    const item = await MenuItem.findOne({ _id: id, businessId });
    if (!item) throw new ApiError(404, 'Menu item not found');
    item.isAvailable = !item.isAvailable;
    return await item.save();
  }

  static async deleteMenuItem(businessId: string, id: string) {
    const item = await MenuItem.findOneAndDelete({ _id: id, businessId });
    if (!item) throw new ApiError(404, 'Menu item not found');
    
    if (item.image?.publicId) {
      await CloudinaryService.deleteMenuImage(item.image.publicId);
    }
    
    return item;
  }
}

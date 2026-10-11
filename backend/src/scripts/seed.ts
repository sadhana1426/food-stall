import mongoose from 'mongoose';
import { config } from '../config/env';
import { connectDB } from '../config/database';
import { MenuItem } from '../models/MenuItem';
import { BusinessSettings } from '../models/BusinessSettings';
import bcrypt from 'bcrypt';

const initialMenu = [
  { name: 'Samosa', pricePaise: 1500, category: 'Snacks', isAvailable: true, sortOrder: 1 },
  { name: 'Vada Pav', pricePaise: 3000, category: 'Snacks', isAvailable: true, sortOrder: 2 },
  { name: 'Masala Dosa', pricePaise: 6000, category: 'Meals', isAvailable: true, sortOrder: 3 },
  { name: 'Idli', pricePaise: 4000, category: 'Meals', isAvailable: true, sortOrder: 4 },
  { name: 'Tea', pricePaise: 1000, category: 'Beverages', isAvailable: true, sortOrder: 5 },
  { name: 'Coffee', pricePaise: 2000, category: 'Beverages', isAvailable: true, sortOrder: 6 },
  { name: 'Veg Puff', pricePaise: 2500, category: 'Snacks', isAvailable: true, sortOrder: 7 },
  { name: 'Paneer Roll', pricePaise: 7000, category: 'Meals', isAvailable: true, sortOrder: 8 },
  { name: 'Lemon Soda', pricePaise: 3000, category: 'Beverages', isAvailable: true, sortOrder: 9 },
  { name: 'Water Bottle', pricePaise: 2000, category: 'Beverages', isAvailable: true, sortOrder: 10 },
];

const seedDB = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding database...');

    // Seed Settings
    const existingSettings = await BusinessSettings.findOne();
    if (!existingSettings) {
      const defaultPinHash = await bcrypt.hash('1234', 10);
      await BusinessSettings.create({ adminPinHash: defaultPinHash });
      console.log('✅ Created default business settings');
    } else {
      console.log('⚡ Business settings already exist, skipping');
    }

    // Seed Menu
    const count = await MenuItem.countDocuments();
    if (count === 0) {
      await MenuItem.insertMany(initialMenu);
      console.log('✅ Seeded initial menu items');
    } else {
      console.log('⚡ Menu items already exist, skipping');
    }

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDB();

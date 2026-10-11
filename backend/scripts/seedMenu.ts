import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import { Business } from '../src/models/Business';
import { MenuItem } from '../src/models/MenuItem';

const seed = async () => {
  await connectDB();
  
  const businesses = await Business.find();
  if (businesses.length === 0) {
    console.log('No businesses found. Please signup first.');
    process.exit(1);
  }

  let totalItemsAdded = 0;

  for (const business of businesses) {
    const businessId = business._id;

    const dummyItems = [
      { name: 'Masala Dosa', pricePaise: 8000, category: 'Breakfast', isAvailable: true, businessId },
      { name: 'Idli Sambar', pricePaise: 5000, category: 'Breakfast', isAvailable: true, businessId },
      { name: 'Filter Coffee', pricePaise: 3000, category: 'Beverages', isAvailable: true, businessId },
      { name: 'Veg Thali', pricePaise: 15000, category: 'Lunch', isAvailable: true, businessId },
      { name: 'Paneer Butter Masala', pricePaise: 20000, category: 'Dinner', isAvailable: true, businessId },
      { name: 'Garlic Naan', pricePaise: 4000, category: 'Dinner', isAvailable: true, businessId },
      { name: 'Chicken Biryani', pricePaise: 25000, category: 'Lunch', isAvailable: true, businessId },
      { name: 'Cold Drink', pricePaise: 4000, category: 'Beverages', isAvailable: true, businessId },
      { name: 'Gulab Jamun', pricePaise: 6000, category: 'Dessert', isAvailable: true, businessId },
    ];

    // Avoid duplicates
    await MenuItem.deleteMany({ businessId }); 
    await MenuItem.insertMany(dummyItems);
    
    console.log(`Seeded menu for business: ${business.businessName} (ID: ${businessId})`);
    totalItemsAdded += dummyItems.length;
  }

  console.log(`Successfully added ${totalItemsAdded} total menu items.`);
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

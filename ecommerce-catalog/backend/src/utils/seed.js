/* Seeds the database with sample categories and products for local development/testing.
 * Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');

const categoriesData = [
  { name: 'Electronics', description: 'Phones, laptops, and gadgets' },
  { name: 'Home & Kitchen', description: 'Appliances and home essentials' },
  { name: 'Sports & Outdoors', description: 'Gear for an active lifestyle' },
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  await connectDB();

  console.log('[seed] Clearing existing data...');
  await Product.deleteMany({});
  await Category.deleteMany({});

  console.log('[seed] Inserting categories...');
  const categories = await Category.insertMany(categoriesData);

  const brandsByCategory = {
    Electronics: ['Voltix', 'Nimbus', 'Corelux'],
    'Home & Kitchen': ['Hearthly', 'Kitchara', 'Domesta'],
    'Sports & Outdoors': ['Trailhead', 'PeakForm', 'RangeRunner'],
  };

  const productNouns = {
    Electronics: ['Wireless Earbuds', 'Smartwatch', 'Bluetooth Speaker', 'Laptop Stand', 'USB-C Hub', '4K Monitor'],
    'Home & Kitchen': ['Air Fryer', 'Coffee Grinder', 'Blender', 'Cookware Set', 'Vacuum Cleaner', 'Toaster Oven'],
    'Sports & Outdoors': ['Running Shoes', 'Yoga Mat', 'Camping Tent', 'Water Bottle', 'Hiking Backpack', 'Resistance Bands'],
  };

  console.log('[seed] Inserting products...');
  const products = [];
  let skuCounter = 1000;

  for (const category of categories) {
    const brands = brandsByCategory[category.name];
    const nouns = productNouns[category.name];

    for (let i = 0; i < 12; i++) {
      const brand = randomFrom(brands);
      const noun = randomFrom(nouns);
      const price = Math.round((Math.random() * 180 + 20) * 100) / 100;
      const hasDiscount = Math.random() > 0.6;

      products.push({
        name: `${brand} ${noun} ${i + 1}`,
        sku: `SKU-${skuCounter++}`,
        description: `The ${brand} ${noun} combines durability and value, designed for everyday use.`,
        brand,
        category: category._id,
        price,
        discountPrice: hasDiscount ? Math.round(price * 0.85 * 100) / 100 : undefined,
        stock: Math.floor(Math.random() * 60),
        tags: [category.name.toLowerCase().split(' ')[0], brand.toLowerCase()],
        images: [`https://picsum.photos/seed/${skuCounter}/400/400`],
        ratingAverage: Math.round((Math.random() * 5) * 10) / 10,
        ratingCount: Math.floor(Math.random() * 250),
      });
    }
  }

  await Product.insertMany(products);

  console.log(`[seed] Done. Inserted ${categories.length} categories and ${products.length} products.`);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../modules/product/product.model.js';

dotenv.config();

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find products with missing/empty title
    const missing = await Product.find({
      $or: [
        { title: null },
        { title: undefined },
        { title: '' },
      ],
    });

    if (missing.length === 0) {
      console.log('✓ No products with missing titles found — database is clean!');
      process.exit(0);
    }

    console.log(`Found ${missing.length} product(s) with missing titles:`);
    missing.forEach(p => {
      console.log(`  - ID: ${p._id}, Price: ₹${p.price}`);
    });

    console.log('\nRemoving corrupt products...');
    const result = await Product.deleteMany({
      $or: [
        { title: null },
        { title: undefined },
        { title: '' },
      ],
    });

    console.log(`✓ Deleted ${result.deletedCount} product(s) with missing titles`);
    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
};

main();

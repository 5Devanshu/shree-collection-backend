import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../modules/product/product.model.js';

dotenv.config();

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Find products with missing/empty title
    const missing = await Product.find({
      $or: [
        { title: null },
        { title: undefined },
        { title: '' },
        { title: { $exists: false } },
      ],
    });

    if (missing.length === 0) {
      console.log('✓ No products with missing titles found — database is clean!');
      process.exit(0);
    }

    console.log(`\nFound ${missing.length} product(s) with missing titles:`);
    missing.forEach(p => {
      console.log(`  - ID: ${p._id}, Price: ₹${p.price}, Category: ${p.category}`);
    });

    console.log('\n📝 Fixing by setting title to "Untitled Product"...');
    const result = await Product.updateMany(
      {
        $or: [
          { title: null },
          { title: undefined },
          { title: '' },
          { title: { $exists: false } },
        ],
      },
      { $set: { title: 'Untitled Product' } }
    );

    console.log(`✓ Updated ${result.modifiedCount} product(s)`);
    console.log(`✓ Database cleanup complete!\n`);
    
    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
};

main();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the Admin model
import Admin from '../modules/auth/auth.model.js';

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Change these before running
    const name = 'Admin';
    const email = 'admin@shreecollection.com';
    const password = 'Admin@1234';

    const existing = await Admin.findOne({ email });

    if (existing) {
      console.log('⚠️  Admin already exists with this email');
      process.exit(0);
    }

    const admin = await Admin.create({ name, email, password });
    console.log(`✅ Admin created successfully!`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔐 Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
};

createAdmin();

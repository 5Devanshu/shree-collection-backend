import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import Admin from '../modules/auth/auth.model.js';

const fixAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    const email = 'admin@shreecollection.com';
    const newPassword = 'Admin@123';

    // Find the admin
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin not found with email:', email);
      process.exit(1);
    }

    console.log('👤 Found admin:', admin.email);
    console.log('🔐 Current password (first 20 chars):', admin.password?.substring(0, 20));

    // Check if password is already hashed (bcrypt hashes start with $2a, $2b, or $2y)
    const isHashed = admin.password?.startsWith('$2');
    console.log('🔎 Is password hashed?', isHashed);

    // Update password (pre-save hook will hash it)
    admin.password = newPassword;
    await admin.save();

    console.log('✅ Password updated and hashed!');
    console.log('📧 Email:', admin.email);
    console.log('🔐 New Password:', newPassword);
    console.log('\n✨ Try logging in now with these credentials');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

fixAdminPassword();

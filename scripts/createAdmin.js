const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const path     = require('path');
const Admin    = require('../models/Admin');

dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Change these before running
    const email    = 'admin@shreecollection.com';
    const password = 'Admin@1234';

    const existing = await Admin.findOne({ email });

    if (existing) {
      console.log('Admin already exists with this email');
      process.exit(0);
    }

    const admin = await Admin.create({ email, password });
    console.log(`Admin created: ${admin.email}`);
    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

createAdmin();
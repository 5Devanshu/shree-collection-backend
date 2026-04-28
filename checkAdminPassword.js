import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const admin = await db.collection('admins').findOne({ email: 'admin@shreecollection.com' });
    
    if (!admin) {
      console.log('❌ Admin not found');
      process.exit(1);
    }
    
    console.log('📋 Admin document:');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Password (first 30 chars):', admin.password?.substring(0, 30));
    console.log('   Password length:', admin.password?.length);
    console.log('   Is hashed (starts with $2):', admin.password?.startsWith('$2'));
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();

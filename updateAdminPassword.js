import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    console.log('🔄 Updating admin password...');
    const result = await db.collection('admins').updateOne(
      { email: 'admin@shreecollection.com' },
      {
        $set: {
          password: '$2a$12$vvVKfl4e/arLNws6fTu4LeaK8hBSI6zLwZ45PFY533hYXYlPIQrKe'
        }
      }
    );
    
    console.log('✅ Update result:');
    console.log('   Matched:', result.matchedCount);
    console.log('   Modified:', result.modifiedCount);
    
    if (result.modifiedCount > 0) {
      console.log('\n🎉 Password updated! Try logging in now with:');
      console.log('   Email: admin@shreecollection.com');
      console.log('   Password: Admin@123');
    } else if (result.matchedCount > 0) {
      console.log('\n⚠️  Admin found but not modified (password may already be correct)');
    } else {
      console.log('\n❌ Admin not found with email: admin@shreecollection.com');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();

import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const fixPassword = async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const adminsCollection = db.collection('admins');

    const email = 'admin@shreecollection.com';
    const newPassword = 'Admin@123';

    // Find admin
    const admin = await adminsCollection.findOne({ email });
    if (!admin) {
      console.log('❌ Admin not found');
      await client.close();
      process.exit(1);
    }

    console.log('👤 Found admin:', admin.email);

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('🔐 New hashed password:', hashedPassword.substring(0, 20) + '...');

    // Update
    await adminsCollection.updateOne(
      { email },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    console.log('✅ Password updated successfully!');
    console.log('\n📧 Admin Email:', email);
    console.log('🔐 Password:', newPassword);

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    await client.close();
    process.exit(1);
  }
};

fixPassword();

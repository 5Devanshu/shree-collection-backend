import bcrypt from 'bcryptjs';

// Generate hash for "Admin@123"
const password = 'Admin@123';
const hash = await bcrypt.hash(password, 12);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nUse this command in MongoDB:');
console.log(`db.admins.updateOne({ email: 'admin@shreecollection.com' }, { $set: { password: '${hash}' } })`);

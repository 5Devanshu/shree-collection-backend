import bcrypt from 'bcryptjs';

const testPassword = 'Admin@123';
const storedHash = '$2a$12$vvVKfl4e/arLNws6fTu4LeaK8hBSI6zLwZ45PFY533hYXYlPIQrKe';

(async () => {
  try {
    const isMatch = await bcrypt.compare(testPassword, storedHash);
    console.log('Testing password comparison:');
    console.log('Incoming password:', testPassword);
    console.log('Stored hash:', storedHash);
    console.log('Match result:', isMatch);
    
    if (isMatch) {
      console.log('\n✅ Password matches! Login should work.');
    } else {
      console.log('\n❌ Password does NOT match. Hash is wrong.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();

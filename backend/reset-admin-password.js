/**
 * Reset Admin Password Script
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI;

const UserSchema = new mongoose.Schema({
  id: String,
  email: String,
  password_hash: String,
  first_name: String,
  last_name: String,
  role: String
});

const User = mongoose.model('User', UserSchema);

async function resetAdminPassword() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const adminEmail = 'admin@assetbridge.com';
    const newPassword = 'Admin@1234';

    const admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      console.log('❌ Admin user not found');
      await mongoose.disconnect();
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    admin.password_hash = passwordHash;
    await admin.save();

    console.log('✅ Admin password reset successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${newPassword}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();

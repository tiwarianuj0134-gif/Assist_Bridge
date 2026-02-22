/**
 * Create Admin User Script
 * 
 * Creates an admin user for testing Phase 8
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://assetbridge_user:Anuj%401234@assetbridge.kdmp6id.mongodb.net/assetbridge?retryWrites=true&w=majority&appName=AssetBridge';

// User schema (simplified)
const UserSchema = new mongoose.Schema({
  id: String,
  email: String,
  password_hash: String,
  first_name: String,
  last_name: String,
  role: String,
  account_type: String,
  kyc_status: String,
  is_verified: Boolean,
  investor_balance: Number,
  created_at: Date,
  updated_at: Date
});

const User = mongoose.model('User', UserSchema);

async function createAdminUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const adminEmail = 'assistbridge15@gmail.com';
    const adminPassword = 'Anuj@1234';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Role: ${existingAdmin.role}`);
      
      // Update to admin role if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin role');
      }
      
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const admin = await User.create({
      id: uuidv4(),
      email: adminEmail,
      password_hash: passwordHash,
      first_name: 'Anuj',
      last_name: 'Admin',
      role: 'admin',
      account_type: 'BORROWER',
      kyc_status: 'VERIFIED',
      is_verified: true,
      investor_balance: 0,
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Role:', admin.role);
    console.log('🆔 User ID:', admin.id);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();

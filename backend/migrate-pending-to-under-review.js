/**
 * Migration Script: Update PENDING loans to UNDER_REVIEW
 * Run this once to migrate existing data
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://assetbridge_user:Anuj%401234@assetbridge.kdmp6id.mongodb.net/assetbridge?retryWrites=true&w=majority&appName=AssetBridge';

async function migrate() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Loan = mongoose.model('Loan', new mongoose.Schema({}, { strict: false }));

    // Find all loans with PENDING status
    const pendingLoans = await Loan.find({ status: 'PENDING' });
    console.log(`📊 Found ${pendingLoans.length} loans with PENDING status`);

    if (pendingLoans.length === 0) {
      console.log('✅ No migration needed - all loans are already using correct status');
      process.exit(0);
    }

    // Update all PENDING loans to UNDER_REVIEW
    const result = await Loan.updateMany(
      { status: 'PENDING' },
      { $set: { status: 'UNDER_REVIEW', updated_at: new Date() } }
    );

    console.log(`✅ Migration complete: ${result.modifiedCount} loans updated from PENDING to UNDER_REVIEW`);
    
    // Verify migration
    const remainingPending = await Loan.countDocuments({ status: 'PENDING' });
    if (remainingPending === 0) {
      console.log('✅ Verification passed: No PENDING loans remaining');
    } else {
      console.log(`⚠️  Warning: ${remainingPending} PENDING loans still exist`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();

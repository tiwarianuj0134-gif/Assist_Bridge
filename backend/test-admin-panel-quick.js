/**
 * Quick Test: Admin Panel - Real-time Pending Loans
 * Tests admin login and viewing pending loans
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

// Admin credentials
const ADMIN = {
  email: 'assistbridge15@gmail.com',
  password: 'Anuj@1234'
};

async function testAdminPanel() {
  console.log('\n🔐 Testing Admin Panel - Real-time Pending Loans');
  console.log('='.repeat(60));

  try {
    // Step 1: Admin Login
    console.log('\n1️⃣  Admin Login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, ADMIN);

    if (loginResponse.data.status !== 'success') {
      throw new Error('Admin login failed: ' + loginResponse.data.error?.message);
    }

    const adminToken = loginResponse.data.data.accessToken;
    console.log('✅ Admin logged in successfully');
    console.log('   Token:', adminToken.substring(0, 20) + '...');

    // Step 2: Get Pending Loans
    console.log('\n2️⃣  Fetching Pending Loans...');
    const pendingResponse = await axios.get(`${API_BASE}/loans/pending`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (pendingResponse.data.status !== 'success') {
      throw new Error('Failed to fetch pending loans: ' + pendingResponse.data.error?.message);
    }

    const pendingLoans = pendingResponse.data.data.loans || [];
    console.log('✅ Pending loans fetched successfully');
    console.log('   Count:', pendingLoans.length);

    if (pendingLoans.length > 0) {
      console.log('\n📋 Pending Loans Details:');
      console.log('='.repeat(60));
      
      pendingLoans.forEach((loan, index) => {
        console.log(`\n${index + 1}. Loan ID: ${loan.id}`);
        console.log(`   Borrower: ${loan.borrower_name} (${loan.borrower_email})`);
        console.log(`   Amount: ₹${loan.amount.toLocaleString()}`);
        console.log(`   Tenure: ${loan.tenure_months} months`);
        console.log(`   EMI: ₹${loan.emi_amount.toLocaleString()}`);
        console.log(`   Purpose: ${loan.purpose}`);
        console.log(`   Status: ${loan.status}`);
        console.log(`   Applied: ${new Date(loan.created_at).toLocaleString()}`);
        
        if (loan.risk_band) {
          console.log(`   Risk Band: ${loan.risk_band}`);
        }
        if (loan.ai_decision) {
          console.log(`   AI Decision: ${loan.ai_decision}`);
        }
      });
    } else {
      console.log('\nℹ️  No pending loans found');
      console.log('   This means:');
      console.log('   - All loans have been processed, OR');
      console.log('   - No borrowers have applied yet, OR');
      console.log('   - All loans were auto-approved by AI');
    }

    // Step 3: Get All Loans (to see what's in the system)
    console.log('\n3️⃣  Checking All Loans in System...');
    const allLoansResponse = await axios.get(`${API_BASE}/admin/loans`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (allLoansResponse.data.status === 'success') {
      const allLoans = allLoansResponse.data.data.loans || [];
      console.log('✅ Total loans in system:', allLoans.length);

      // Count by status
      const statusCounts = {};
      allLoans.forEach(loan => {
        statusCounts[loan.status] = (statusCounts[loan.status] || 0) + 1;
      });

      console.log('\n📊 Loans by Status:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST PASSED - Admin Panel Working!');
    console.log('='.repeat(60));
    console.log('\n💡 Next Steps:');
    console.log('   1. Login to Admin Panel with: admin@assetbridge.com / Admin@123');
    console.log('   2. Pending loans will appear automatically');
    console.log('   3. Click Approve/Reject to process loans');
    console.log('   4. Approved loans will appear in Investor Dashboard');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  }
}

// Run test
testAdminPanel();

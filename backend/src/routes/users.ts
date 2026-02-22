import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { mongoDatabase } from '../db/mongoDatabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getRealTimeFXRates } from '../services/fxService';

const router = Router();

// Get user profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await mongoDatabase.findUserById(req.user!.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Get bank account
    const bankAccount = await mongoDatabase.findBankAccountByUserId(req.user!.userId);

    // Get trust score
    const trustScore = await mongoDatabase.findLatestTrustScore(req.user!.userId);

    // Remove password hash
    const { password_hash, ...userWithoutPassword } = user.toObject();

    res.json({
      status: 'success',
      data: {
        ...userWithoutPassword,
        bankAccount,
        trustScore: trustScore?.score || null
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get profile'
      }
    });
  }
});

// Update user details
router.put('/details', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const {
      dateOfBirth,
      address,
      city,
      country,
      postalCode,
      occupation,
      annualIncome,
      panNumber,
      bankName,
      accountNumber,
      ifscCode
    } = req.body;

    // Update user with profile_completed flag
    await mongoDatabase.updateUser(req.user!.userId, {
      date_of_birth: dateOfBirth,
      address,
      city,
      country,
      postal_code: postalCode,
      occupation,
      annual_income: annualIncome,
      pan_number: panNumber,
      // Mark profile as completed
      profile_completed: true
    });

    // Add/update bank account
    const existingBank = await mongoDatabase.findBankAccountByUserId(req.user!.userId);
    
    if (existingBank) {
      await mongoDatabase.updateBankAccount(req.user!.userId, {
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode
      });
    } else {
      const bankId = uuidv4();
      await mongoDatabase.createBankAccount({
        id: bankId,
        user_id: req.user!.userId,
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        is_primary: true,
        created_at: new Date().toISOString()
      });
    }

    // Generate initial trust score
    const existingScore = await mongoDatabase.findLatestTrustScore(req.user!.userId);
    if (!existingScore) {
      // Calculate basic trust score based on income
      let baseScore = 500;
      if (annualIncome.includes('50 Lakhs') || annualIncome.includes('Crore')) {
        baseScore = 750;
      } else if (annualIncome.includes('20-30') || annualIncome.includes('30-50')) {
        baseScore = 650;
      } else if (annualIncome.includes('10-15') || annualIncome.includes('15-20')) {
        baseScore = 600;
      }

      const trustScoreId = uuidv4();
      await mongoDatabase.createTrustScore({
        id: trustScoreId,
        user_id: req.user!.userId,
        score: baseScore,
        factors: JSON.stringify([
          { name: 'Income Stability', weight: 25, value: 70, impact: 'POSITIVE' },
          { name: 'Credit History', weight: 20, value: 65, impact: 'NEUTRAL' },
          { name: 'Asset Coverage', weight: 25, value: 60, impact: 'POSITIVE' },
          { name: 'Debt-to-Income', weight: 15, value: 75, impact: 'POSITIVE' },
          { name: 'Cross-border Activity', weight: 10, value: 50, impact: 'NEUTRAL' },
          { name: 'Fraud Risk', weight: 5, value: 90, impact: 'POSITIVE' }
        ]),
        calculated_at: new Date().toISOString()
      });
    }

    res.json({
      status: 'success',
      data: {
        message: 'Details updated successfully',
        profileCompleted: true
      }
    });
  } catch (error) {
    console.error('Update details error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update details'
      }
    });
  }
});

// Get dashboard data
router.get('/dashboard', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // Get user profile
    const user = await mongoDatabase.findUserById(req.user!.userId);
    
    // Get all assets
    const assets = await mongoDatabase.findAssetsByUserId(req.user!.userId);
    const totalAssetValue = assets
      .filter(a => a.status === 'ACTIVE' || a.status === 'LOCKED')
      .reduce((sum, asset) => sum + asset.current_value, 0);

    // Get locked assets and credit
    const lockedAssets = await mongoDatabase.findLockedAssetsByUserId(req.user!.userId);
    const totalCredit = lockedAssets.reduce((sum, la) => sum + la.credit_limit, 0);
    const usedCredit = lockedAssets.reduce((sum, la) => sum + la.used_credit, 0);

    // Get trust score
    const trustScore = await mongoDatabase.findLatestTrustScore(req.user!.userId);

    // Get active loans
    const loans = await mongoDatabase.findLoansByBorrowerId(req.user!.userId);
    const activeLoans = loans
      .filter(l => l.status === 'ACTIVE')
      .reduce((sum, loan) => sum + (loan.amount - loan.total_repaid), 0);

    // Calculate asset allocation based on actual assets
    const assetsByType: Record<string, number> = {};
    assets.forEach(asset => {
      const type = asset.asset_type;
      assetsByType[type] = (assetsByType[type] || 0) + asset.current_value;
    });

    const assetAllocation = Object.entries(assetsByType).map(([type, value]) => ({
      name: type,
      value: Math.round((value / totalAssetValue) * 100),
      amount: value
    }));

    // Generate portfolio history (last 12 months based on current value)
    const currentMonth = new Date().getMonth();
    const portfolioHistory = Array.from({ length: 12 }, (_, i) => {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      // Simulate growth over time (current value at end, decreasing backwards)
      const growthFactor = 0.85 + (i / 11) * 0.15; // 85% to 100%
      return {
        month: monthNames[monthIndex],
        value: Math.round(totalAssetValue * growthFactor)
      };
    });

    // Get recent transactions (locked assets + loans)
    const recentTransactions: any[] = [];
    
    // Add locked assets as transactions
    lockedAssets.slice(0, 3).forEach(la => {
      const asset = assets.find(a => a.id === la.asset_id);
      if (asset) {
        recentTransactions.push({
          id: la.id,
          type: 'Lock',
          asset: asset.name,
          amount: `₹${asset.current_value.toLocaleString()}`,
          status: 'Completed',
          time: getTimeAgo(la.locked_at),
          icon: 'Lock'
        });
      }
    });

    // Add loans as transactions
    loans.slice(0, 2).forEach(loan => {
      recentTransactions.push({
        id: loan.id,
        type: 'Loan',
        asset: `${loan.purpose} Loan`,
        amount: `₹${loan.amount.toLocaleString()}`,
        status: loan.status === 'ACTIVE' ? 'Active' : loan.status,
        time: getTimeAgo(loan.created_at),
        icon: 'CreditCard'
      });
    });

    // Real FX rates from live API
    const fxRates = await getRealTimeFXRates();

    res.json({
      status: 'success',
      data: {
        // Summary stats
        totalAssetValue,
        creditAvailable: totalCredit - usedCredit,
        trustScore: trustScore?.score || 0,
        activeLoans,
        
        // Detailed data
        userName: user?.first_name || user?.email?.split('@')[0] || 'User',
        userEmail: user?.email,
        assetAllocation,
        portfolioHistory,
        recentTransactions,
        fxRates,
        
        // Counts
        totalAssets: assets.length,
        lockedAssets: lockedAssets.length,
        activeLoansCount: loans.filter(l => l.status === 'ACTIVE').length
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get dashboard data'
      }
    });
  }
});

// Helper function to calculate time ago
function getTimeAgo(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default router;

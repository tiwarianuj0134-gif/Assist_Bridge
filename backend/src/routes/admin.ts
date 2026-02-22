import { Router } from 'express';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';
import { mongoDatabase } from '../db/mongoDatabase';
import { NotificationService } from '../services/notificationService';

const router = Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Get dashboard statistics
router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const users = await mongoDatabase.getAllUsers();
    const loans = await mongoDatabase.getAllLoans();

    const totalUsers = users.length;
    const borrowers = users.filter(u => u.account_type === 'BORROWER').length;
    const investors = users.filter(u => u.account_type === 'INVESTOR').length;

    const totalLoans = loans.length;
    const pendingLoans = loans.filter(l => l.status === 'UNDER_REVIEW').length;
    const activeLoans = loans.filter(l => l.status === 'ACTIVE').length;
    const completedLoans = loans.filter(l => l.status === 'REPAID').length;
    const rejectedLoans = loans.filter(l => l.status === 'REJECTED').length;

    const totalVolume = loans
      .filter(l => l.status === 'ACTIVE' || l.status === 'REPAID')
      .reduce((sum, l) => sum + l.amount, 0);

    const defaultedLoans = loans.filter(l => l.status === 'DEFAULTED').length;
    const defaultRate = totalLoans > 0 ? (defaultedLoans / totalLoans) * 100 : 0;

    res.json({
      status: 'success',
      data: {
        users: {
          total: totalUsers,
          borrowers,
          investors
        },
        loans: {
          total: totalLoans,
          pending: pendingLoans,
          active: activeLoans,
          completed: completedLoans,
          rejected: rejectedLoans,
          defaulted: defaultedLoans
        },
        volume: {
          total: totalVolume,
          average: totalLoans > 0 ? totalVolume / totalLoans : 0
        },
        metrics: {
          defaultRate: parseFloat(defaultRate.toFixed(2)),
          approvalRate: totalLoans > 0 ? ((totalLoans - rejectedLoans) / totalLoans) * 100 : 0
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get dashboard statistics'
      }
    });
  }
});

// Get all loans with filters
router.get('/loans', async (req: AuthRequest, res) => {
  try {
    const { status, riskBand, limit = '50', offset = '0' } = req.query;

    let loans = await mongoDatabase.getAllLoans();

    // Apply filters
    if (status && status !== 'ALL') {
      loans = loans.filter(l => l.status === status);
    }

    if (riskBand && riskBand !== 'ALL') {
      loans = loans.filter(l => l.risk_band === riskBand);
    }

    // Get borrower details for each loan
    const loansWithDetails = await Promise.all(
      loans.map(async (loan) => {
        const borrower = await mongoDatabase.findUserById(loan.borrower_id);
        const investor = loan.investor_id ? await mongoDatabase.findUserById(loan.investor_id) : null;

        return {
          ...loan.toObject(),
          borrower: borrower ? {
            id: borrower.id,
            name: `${borrower.first_name} ${borrower.last_name}`,
            email: borrower.email,
            kyc_status: borrower.kyc_status
          } : null,
          investor: investor ? {
            id: investor.id,
            name: `${investor.first_name} ${investor.last_name}`,
            email: investor.email
          } : null
        };
      })
    );

    // Sort by created_at (descending)
    loansWithDetails.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedLoans = loansWithDetails.slice(offsetNum, offsetNum + limitNum);

    res.json({
      status: 'success',
      data: {
        loans: paginatedLoans,
        total: loansWithDetails.length
      }
    });
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get loans'
      }
    });
  }
});

// Approve loan
router.post('/loans/:id/approve', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const loan = await mongoDatabase.findLoanById(id);

    if (!loan) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'LOAN_NOT_FOUND',
          message: 'Loan not found'
        }
      });
    }

    if (loan.status !== 'UNDER_REVIEW') {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_STATUS',
          message: 'Only loans under review can be approved'
        }
      });
    }

    // Update loan status
    await mongoDatabase.updateLoan(id, {
      status: 'LISTED_FOR_FUNDING',
      admin_notes: notes || 'Approved by admin',
      approved_at: new Date().toISOString()
    });

    console.log(`✅ Loan ${id} approved by admin ${req.user!.email}`);

    // Send notification to borrower
    await NotificationService.create({
      userId: loan.borrower_id,
      type: 'LOAN_APPROVED',
      title: 'Loan Approved',
      message: `Your loan application for ₹${loan.amount.toLocaleString()} has been approved and is now listed for funding.`,
      data: {
        loanId: id,
        amount: loan.amount,
        tenure: loan.tenure_months
      },
      priority: 'HIGH'
    });

    res.json({
      status: 'success',
      data: {
        loanId: id,
        status: 'LISTED_FOR_FUNDING',
        message: 'Loan approved successfully'
      }
    });
  } catch (error) {
    console.error('Approve loan error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to approve loan'
      }
    });
  }
});

// Reject loan
router.post('/loans/:id/reject', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const loan = await mongoDatabase.findLoanById(id);

    if (!loan) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'LOAN_NOT_FOUND',
          message: 'Loan not found'
        }
      });
    }

    if (loan.status !== 'UNDER_REVIEW') {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_STATUS',
          message: 'Only loans under review can be rejected'
        }
      });
    }

    // Update loan status
    await mongoDatabase.updateLoan(id, {
      status: 'REJECTED',
      rejection_reason: reason || 'Rejected by admin',
      rejected_at: new Date().toISOString()
    });

    console.log(`❌ Loan ${id} rejected by admin ${req.user!.email}`);

    // Send notification to borrower
    await NotificationService.create({
      userId: loan.borrower_id,
      type: 'LOAN_REJECTED',
      title: 'Loan Application Rejected',
      message: `Your loan application for ₹${loan.amount.toLocaleString()} has been rejected. Reason: ${reason || 'Please contact support for details.'}`,
      data: {
        loanId: id,
        amount: loan.amount,
        reason: reason || 'Rejected by admin'
      },
      priority: 'HIGH'
    });

    res.json({
      status: 'success',
      data: {
        loanId: id,
        status: 'REJECTED',
        message: 'Loan rejected successfully'
      }
    });
  } catch (error) {
    console.error('Reject loan error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to reject loan'
      }
    });
  }
});

// Get all users
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const { accountType, kycStatus, limit = '50', offset = '0' } = req.query;

    let users = await mongoDatabase.getAllUsers();

    // Apply filters
    if (accountType && accountType !== 'ALL') {
      users = users.filter(u => u.account_type === accountType);
    }

    if (kycStatus && kycStatus !== 'ALL') {
      users = users.filter(u => u.kyc_status === kycStatus);
    }

    // Sort by created_at (descending)
    users.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedUsers = users.slice(offsetNum, offsetNum + limitNum);

    // Remove sensitive data
    const sanitizedUsers = paginatedUsers.map(u => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      phone: u.phone,
      account_type: u.account_type,
      kyc_status: u.kyc_status,
      investor_balance: u.investor_balance,
      is_verified: u.is_verified,
      created_at: u.created_at
    }));

    res.json({
      status: 'success',
      data: {
        users: sanitizedUsers,
        total: users.length
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get users'
      }
    });
  }
});

// Verify user KYC
router.post('/users/:id/verify', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { kycStatus } = req.body;

    const user = await mongoDatabase.findUserById(id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Update KYC status
    await mongoDatabase.updateUser(id, {
      kyc_status: kycStatus || 'VERIFIED'
    });

    console.log(`✅ User ${id} KYC status updated to ${kycStatus} by admin ${req.user!.email}`);

    // Send notification to user
    if (kycStatus === 'VERIFIED') {
      await NotificationService.create({
        userId: id,
        type: 'ACCOUNT_VERIFIED',
        title: 'Account Verified',
        message: 'Your KYC verification has been completed successfully. You can now access all features.',
        data: {
          kycStatus: 'VERIFIED'
        },
        priority: 'HIGH'
      });
    }

    res.json({
      status: 'success',
      data: {
        userId: id,
        kycStatus: kycStatus || 'VERIFIED',
        message: 'User KYC status updated successfully'
      }
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify user'
      }
    });
  }
});

export default router;

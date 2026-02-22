import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { mongoDatabase } from '../db/mongoDatabase';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Calculate EMI
function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  const monthlyRate = annualRate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

// Get all loans for user
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const loans = await mongoDatabase.findLoansByBorrowerId(req.user!.userId);
    
    res.json({
      status: 'success',
      data: { loans }
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

// Get all pending loan requests (for admin)
router.get('/pending', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const allLoans = await mongoDatabase.getAllLoans();
    const pendingLoans = allLoans.filter(l => l.status === 'UNDER_REVIEW');
    
    // Get user details for each loan
    const loansWithUserDetails = await Promise.all(
      pendingLoans.map(async (loan) => {
        const user = await mongoDatabase.findUserById(loan.borrower_id);
        return {
          ...loan.toObject(),
          borrower_name: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
          borrower_email: user?.email || 'N/A'
        };
      })
    );
    
    res.json({
      status: 'success',
      data: { loans: loansWithUserDetails }
    });
  } catch (error) {
    console.error('Get pending loans error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get pending loans'
      }
    });
  }
});

// Get funding opportunities (for investors)
router.get('/funding-opportunities', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // Get user to verify they are investor
    const user = await mongoDatabase.findUserById(req.user!.userId);
    if (!user || user.account_type !== 'INVESTOR') {
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'FORBIDDEN',
          message: 'Only investors can view funding opportunities'
        }
      });
    }

    const allLoans = await mongoDatabase.getAllLoans();
    // Filter for loans that are LISTED_FOR_FUNDING and not yet funded (investor_id is null)
    const availableLoans = allLoans.filter(l => l.status === 'LISTED_FOR_FUNDING' && !l.investor_id);
    
    console.log(`📊 Found ${availableLoans.length} funding opportunities`);
    
    // Get user details and assets for each loan
    const loansWithDetails = await Promise.all(
      availableLoans.map(async (loan) => {
        const borrower = await mongoDatabase.findUserById(loan.borrower_id);
        const lockedAssets = await mongoDatabase.findLockedAssetsByUserId(loan.borrower_id);
        const trustScore = await mongoDatabase.findLatestTrustScore(loan.borrower_id);
        
        // Calculate total collateral value
        const totalCollateral = lockedAssets.reduce((sum, asset) => sum + (asset.credit_limit || 0), 0);
        
        return {
          ...loan.toObject(),
          borrower_id: loan.borrower_id,
          borrower_name: borrower ? `${borrower.first_name} ${borrower.last_name.charAt(0)}.` : 'Unknown',
          borrower_email: borrower?.email || 'N/A',
          trust_score: trustScore?.score || 550,
          collateral_value: totalCollateral,
          collateral_assets: lockedAssets.map(asset => ({
            type: asset.asset_type,
            value: asset.credit_limit
          }))
        };
      })
    );
    
    res.json({
      status: 'success',
      data: { loans: loansWithDetails }
    });
  } catch (error) {
    console.error('Get funding opportunities error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get funding opportunities'
      }
    });
  }
});

// Apply for loan
router.post('/apply', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { amount, tenure, purpose } = req.body;

    if (!amount || !tenure) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_INPUT',
          message: 'Amount and tenure are required'
        }
      });
    }

    // Check credit limit
    const lockedAssets = await mongoDatabase.findLockedAssetsByUserId(req.user!.userId);
    const totalCredit = lockedAssets.reduce((sum, la) => sum + la.credit_limit, 0);
    const usedCredit = lockedAssets.reduce((sum, la) => sum + la.used_credit, 0);
    const availableCredit = totalCredit - usedCredit;

    if (amount > availableCredit) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INSUFFICIENT_CREDIT',
          message: `Requested amount exceeds available credit limit of ₹${availableCredit.toLocaleString()}`
        }
      });
    }

    // Calculate EMI (assuming 12% annual interest)
    const interestRate = 12;
    const emi = calculateEMI(amount, interestRate, tenure);

    const loanId = uuidv4();
    
    // Perform AI risk assessment (PHASE 2)
    console.log(`🤖 Running AI risk assessment for loan=${loanId}`);
    
    const user = await mongoDatabase.findUserById(req.user!.userId);
    const activeLoans = await mongoDatabase.findLoansByBorrowerId(req.user!.userId);
    const activeLoansList = activeLoans.filter((l: any) => l.status === 'ACTIVE');
    const trustScore = await mongoDatabase.findLatestTrustScore(req.user!.userId);
    
    // Calculate risk factors for assessment
    const currentTrustScore = trustScore?.score || 550;
    const totalCollateralValue = lockedAssets.reduce((sum, la) => sum + (la.credit_limit || 0), 0);
    const activeLoansTotal = activeLoansList.reduce((sum: number, l: any) => sum + l.amount, 0);
    const monthlyIncome = (parseInt(user?.annual_income || '0') || 0) / 12;
    const debtToIncomeRatio = monthlyIncome > 0 ? (activeLoansTotal + amount) / monthlyIncome : 999;
    const collateralToLoanRatio = amount > 0 ? totalCollateralValue / amount : 0;
    
    const purposeRiskMultiplier: any = {
      'Business Expansion': 1.0,
      'Personal': 1.2,
      'Home Improvement': 0.8,
      'Education': 0.9,
      'Medical': 1.1,
      'Vehicle Purchase': 0.7,
      'Debt Consolidation': 1.3
    };
    const riskMultiplier = purposeRiskMultiplier[purpose] || 1.0;

    // Compute default probability
    let defaultProbability = 0.15;
    defaultProbability += (Math.max(0, 100 - (currentTrustScore / 10)) * 0.0005);
    defaultProbability += ((collateralToLoanRatio >= 0.5 ? 5 : collateralToLoanRatio >= 0.25 ? 15 : 35) * 0.0008);
    defaultProbability += ((debtToIncomeRatio <= 3 ? 10 : debtToIncomeRatio <= 5 ? 25 : 50) * 0.0006);
    defaultProbability += ((activeLoansList.length <= 2 ? 8 : activeLoansList.length <= 4 ? 20 : 40) * 0.0004);
    defaultProbability += ((user?.kyc_status ? 5 : 20) * 0.0003);
    defaultProbability *= riskMultiplier;
    defaultProbability = Math.max(0.05, Math.min(0.75, defaultProbability));

    // Determine risk band
    let riskBand: string;
    if (defaultProbability <= 0.15) {
      riskBand = 'LOW';
    } else if (defaultProbability <= 0.35) {
      riskBand = 'MEDIUM';
    } else {
      riskBand = 'HIGH';
    }

    // Scoring for approval
    let approvalScore = 0;
    if (currentTrustScore >= 750) approvalScore += 30;
    else if (currentTrustScore >= 650) approvalScore += 20;
    else if (currentTrustScore >= 550) approvalScore += 10;

    if (collateralToLoanRatio >= 0.5) approvalScore += 30;
    else if (collateralToLoanRatio >= 0.3) approvalScore += 20;
    else if (collateralToLoanRatio >= 0.1) approvalScore += 10;

    if (debtToIncomeRatio <= 2) approvalScore += 20;
    else if (debtToIncomeRatio <= 3) approvalScore += 10;

    if (activeLoansList.length <= 1) approvalScore += 15;
    else if (activeLoansList.length <= 3) approvalScore += 8;

    if (user?.kyc_status) approvalScore += 10;

    // Decision logic
    let aiDecision: string;
    if (approvalScore >= 70) {
      aiDecision = 'APPROVED';
    } else if (approvalScore >= 50) {
      aiDecision = 'REVIEW';
    } else {
      aiDecision = 'REJECT';
    }

    console.log(`✅ AI Assessment: ${aiDecision} (score: ${approvalScore}/100, risk: ${riskBand})`);

    // Create loan with risk assessment
    const loan: any = {
      id: loanId,
      borrower_id: req.user!.userId,
      amount,
      tenure_months: tenure,
      interest_rate: interestRate,
      emi_amount: emi,
      purpose: purpose || 'Personal',
      status: 'UNDER_REVIEW',
      disbursed_amount: 0,
      total_repaid: 0,
      risk_band: riskBand,
      default_probability: parseFloat((defaultProbability * 100).toFixed(2)),
      ai_decision: aiDecision,
      risk_assessment: `Risk band: ${riskBand} | Default probability: ${(defaultProbability * 100).toFixed(1)}% | Status: ${aiDecision}`,
      risk_factors: JSON.stringify({
        trustScore: currentTrustScore,
        collateralRatio: collateralToLoanRatio,
        debtToIncomeRatio: debtToIncomeRatio,
        activeLoans: activeLoansList.length,
        approvalScore: approvalScore
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await mongoDatabase.createLoan(loan);

    // If APPROVED: auto-transition to LISTED_FOR_FUNDING
    if (aiDecision === 'APPROVED') {
      await mongoDatabase.updateLoan(loanId, { status: 'LISTED_FOR_FUNDING' });
      console.log(`✅ Loan auto-listed for funding (status: LISTED_FOR_FUNDING)`);
    } else {
      console.log(`⏳ Loan pending review (status: UNDER_REVIEW, decision: ${aiDecision})`);
    }

    res.status(201).json({
      status: 'success',
      data: {
        loan: { ...loan, status: aiDecision === 'APPROVED' ? 'LISTED_FOR_FUNDING' : 'UNDER_REVIEW' },
        riskAssessment: {
          defaultProbability: parseFloat((defaultProbability * 100).toFixed(2)),
          riskBand,
          aiDecision,
          approvalScore,
          summary: `Risk band: ${riskBand} | Default risk: ${(defaultProbability * 100).toFixed(1)}% | Decision: ${aiDecision}`
        },
        message: aiDecision === 'APPROVED' 
          ? 'Loan approved by AI! Listed for investor funding.' 
          : `Loan submitted for review. Status: ${aiDecision}`
      }
    });
  } catch (error) {
    console.error('Apply loan error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to apply for loan'
      }
    });
  }
});

// Calculate EMI (utility endpoint)
router.post('/calculate-emi', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { amount, tenure } = req.body;

    if (!amount || !tenure) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_INPUT',
          message: 'Amount and tenure are required'
        }
      });
    }

    const interestRate = 12; // 12% annual
    const emi = calculateEMI(amount, interestRate, tenure);
    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - amount;

    res.json({
      status: 'success',
      data: {
        emi,
        totalPayment,
        totalInterest,
        interestRate,
        principal: amount,
        tenure
      }
    });
  } catch (error) {
    console.error('Calculate EMI error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to calculate EMI'
      }
    });
  }
});

// Approve loan (admin only)
router.post('/:loanId/approve', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { loanId } = req.params;
    
    const loan = await mongoDatabase.findLoanById(loanId);
    
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
          message: 'Loan is not under review'
        }
      });
    }

    // Update loan status
    await mongoDatabase.updateLoan(loanId, {
      status: 'ACTIVE',
      disbursed_amount: loan.amount,
      disbursed_at: new Date().toISOString()
    });

    // Update user's used credit
    const lockedAssets = await mongoDatabase.findLockedAssetsByUserId(loan.borrower_id);
    if (lockedAssets.length > 0) {
      const firstAsset = lockedAssets[0];
      await mongoDatabase.updateLockedAsset(firstAsset.id, {
        used_credit: firstAsset.used_credit + loan.amount
      });
    }

    res.json({
      status: 'success',
      data: {
        message: 'Loan approved and disbursed successfully'
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

// Reject loan (admin only)
router.post('/:loanId/reject', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { loanId } = req.params;
    const { reason } = req.body;
    
    const loan = await mongoDatabase.findLoanById(loanId);
    
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
          message: 'Loan is not under review'
        }
      });
    }

    // Update loan status
    await mongoDatabase.updateLoan(loanId, {
      status: 'REJECTED',
      rejection_reason: reason || 'Not specified'
    });

    res.json({
      status: 'success',
      data: {
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

// Invest in loan (investor only)
router.post('/:loanId/invest', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { loanId } = req.params;
    
    // Get investor details
    const investor = await mongoDatabase.findUserById(req.user!.userId);
    
    if (!investor) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Investor not found'
        }
      });
    }

    // Check if user is an investor
    if (investor.account_type !== 'INVESTOR') {
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'NOT_INVESTOR',
          message: 'Only investors can fund loans'
        }
      });
    }

    // Get loan details
    const loan = await mongoDatabase.findLoanById(loanId);
    
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'LOAN_NOT_FOUND',
          message: 'Loan not found'
        }
      });
    }

    // Check if loan is available for funding  
    if (loan.status !== 'LISTED_FOR_FUNDING') {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'LOAN_NOT_AVAILABLE',
          message: 'This loan is not available for funding. Status: ' + loan.status
        }
      });
    }

    // Check if loan already has an investor
    if (loan.investor_id) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'LOAN_ALREADY_FUNDED',
          message: 'This loan has already been funded'
        }
      });
    }

    // Check if investor has enough balance
    if ((investor.investor_balance || 0) < loan.amount) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: `Insufficient balance. You have $${investor.investor_balance?.toLocaleString()} but need $${loan.amount.toLocaleString()}`
        }
      });
    }

    console.log(`💰 Processing investment: Investor=${investor.id} → Loan=${loanId} (${loan.amount})`);

    // Deduct from investor balance
    const newInvestorBalance = (investor.investor_balance || 0) - loan.amount;
    await mongoDatabase.updateUser(investor.id, {
      investor_balance: newInvestorBalance
    });

    // Update loan status to ACTIVE and set investor
    await mongoDatabase.updateLoan(loanId, {
      status: 'ACTIVE',
      investor_id: investor.id,
      disbursed_amount: loan.amount,
      disbursed_at: new Date().toISOString()
    });

    // Update borrower's used credit
    const lockedAssets = await mongoDatabase.findLockedAssetsByUserId(loan.borrower_id);
    if (lockedAssets.length > 0) {
      const firstAsset = lockedAssets[0];
      await mongoDatabase.updateLockedAsset(firstAsset.id, {
        used_credit: (firstAsset.used_credit || 0) + loan.amount
      });
    }

    console.log(`✅ Investment complete: New investor balance = $${newInvestorBalance}`);

    res.json({
      status: 'success',
      data: {
        message: 'Investment successful! Loan funded and activated.',
        newBalance: newInvestorBalance,
        loanAmount: loan.amount,
        expectedReturns: Math.round(loan.amount * (loan.interest_rate / 100) * (loan.tenure_months / 12))
      }
    });
  } catch (error) {
    console.error('Invest in loan error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to invest in loan'
      }
    });
  }
});

// POST /loans/:id/approve - Approve/Reject loans pending review
router.post('/:loanId/approve', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { loanId } = req.params;
    const { decision, reason } = req.body;

    // Validate input
    if (!decision || !['APPROVE', 'REJECT'].includes(decision)) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_INPUT',
          message: 'decision must be APPROVE or REJECT'
        }
      });
    }

    // Get loan details
    const loan = await mongoDatabase.findLoanById(loanId);
    
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'LOAN_NOT_FOUND',
          message: 'Loan not found'
        }
      });
    }

    // Loan must be in UNDER_REVIEW to be approved/rejected
    if (loan.status !== 'UNDER_REVIEW') {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_STATUS',
          message: `Loan status is ${loan.status}, only UNDER_REVIEW loans can be reviewed`
        }
      });
    }

    if (decision === 'APPROVE') {
      console.log(`✅ Approving loan ${loanId} for funding`);
      
      // Transition to LISTED_FOR_FUNDING
      await mongoDatabase.updateLoan(loanId, {
        status: 'LISTED_FOR_FUNDING',
        ai_decision: 'APPROVED'
      });

      res.json({
        status: 'success',
        data: {
          message: 'Loan approved successfully and listed for investor funding',
          loan: {
            id: loanId,
            status: 'LISTED_FOR_FUNDING',
            decision: 'APPROVED'
          }
        }
      });
    } else {
      // REJECT
      console.log(`❌ Rejecting loan ${loanId} - Reason: ${reason || 'Not specified'}`);
      
      // Update loan with rejection
      await mongoDatabase.updateLoan(loanId, {
        status: 'REJECTED',
        ai_decision: 'REJECT',
        rejection_reason: reason || 'Application rejected after review'
      });

      res.json({
        status: 'success',
        data: {
          message: 'Loan rejected',
          loan: {
            id: loanId,
            status: 'REJECTED',
            decision: 'REJECT',
            rejection_reason: reason || 'Application rejected after review'
          }
        }
      });
    }
  } catch (error) {
    console.error('Loan approval error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process loan approval'
      }
    });
  }
});

// GET /marketplace - Browse available loans (PHASE 3)
router.get('/marketplace/browse', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { riskBand, status, minAmount, maxAmount, minReturn, sortBy } = req.query;
    
    console.log(`📊 Marketplace browse: riskBand=${riskBand}, status=${status}, sort=${sortBy}`);

    // Get all ACTIVE and LISTED_FOR_FUNDING loans
    const allLoans = await mongoDatabase.getAllLoans();
    let loans = allLoans.filter(l => ['LISTED_FOR_FUNDING', 'ACTIVE'].includes(l.status));

    // Apply filters
    if (riskBand && riskBand !== 'ALL') {
      loans = loans.filter(l => l.risk_band === riskBand);
    }

    if (status && status !== 'ALL') {
      loans = loans.filter(l => l.status === status);
    }

    if (minAmount) {
      loans = loans.filter(l => l.amount >= parseInt(minAmount as string));
    }

    if (maxAmount) {
      loans = loans.filter(l => l.amount <= parseInt(maxAmount as string));
    }

    // Enrich loans with borrower and investor details
    const enrichedLoans = await Promise.all(
      loans.map(async (loan) => {
        const borrower = await mongoDatabase.findUserById(loan.borrower_id);
        const investor = loan.investor_id ? await mongoDatabase.findUserById(loan.investor_id) : null;
        const trustScore = await mongoDatabase.findLatestTrustScore(loan.borrower_id);
        
        const expectedReturns = loan.amount * (loan.interest_rate / 100) * (loan.tenure_months / 12);
        const monthsPassed = loan.status === 'ACTIVE' ? Math.floor((new Date().getTime() - new Date(loan.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;
        const repaidAmount = monthsPassed > 0 ? monthsPassed * loan.emi_amount : 0;
        const remainingAmount = loan.amount - repaidAmount;

        return {
          ...loan.toObject(),
          borrower_name: borrower ? `${borrower.first_name} ${borrower.last_name}` : 'Unknown',
          borrower_email: borrower?.email,
          investor_name: investor ? `${investor.first_name} ${investor.last_name}` : null,
          trust_score: trustScore?.score || 550,
          expected_returns: Math.round(expectedReturns),
          months_passed: monthsPassed,
          repaid_amount: Math.round(repaidAmount),
          remaining_amount: Math.round(remainingAmount),
          return_percentage: ((expectedReturns / loan.amount) * 100).toFixed(1)
        };
      })
    );

    // Apply sorting
    let sortedLoans = enrichedLoans;
    switch (sortBy) {
      case 'return-high':
        sortedLoans = enrichedLoans.sort((a, b) => b.expected_returns - a.expected_returns);
        break;
      case 'return-low':
        sortedLoans = enrichedLoans.sort((a, b) => a.expected_returns - b.expected_returns);
        break;
      case 'trust-high':
        sortedLoans = enrichedLoans.sort((a, b) => b.trust_score - a.trust_score);
        break;
      case 'amount-high':
        sortedLoans = enrichedLoans.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-low':
        sortedLoans = enrichedLoans.sort((a, b) => a.amount - b.amount);
        break;
      default:
        sortedLoans = enrichedLoans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    console.log(`✅ Found ${sortedLoans.length} loans after filtering`);

    res.json({
      status: 'success',
      data: {
        loans: sortedLoans,
        count: sortedLoans.length,
        filters: { riskBand, status }
      }
    });
  } catch (error) {
    console.error('Marketplace browse error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to browse marketplace'
      }
    });
  }
});

// GET /portfolio - User's investment portfolio (PHASE 3)
router.get('/portfolio', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = await mongoDatabase.findUserById(userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    console.log(`📈 Loading portfolio for user=${userId}, type=${user.account_type}`);

    let portfolioData: any = {
      user_type: user.account_type,
      current_balance: user.account_type === 'INVESTOR' ? user.investor_balance : undefined
    };

    if (user.account_type === 'INVESTOR') {
      // Investor portfolio: loans they're funding
      const allLoans = await mongoDatabase.getAllLoans();
      const investedLoans = allLoans.filter(l => l.investor_id === userId);

      const enrichedInvestments = await Promise.all(
        investedLoans.map(async (loan) => {
          const borrower = await mongoDatabase.findUserById(loan.borrower_id);
          const expectedReturns = loan.amount * (loan.interest_rate / 100) * (loan.tenure_months / 12);
          const monthsPassed = Math.max(0, Math.floor((new Date().getTime() - new Date(loan.disbursed_at || loan.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)));
          const repaidAmount = monthsPassed * loan.emi_amount;
          const remainingAmount = loan.amount - repaidAmount;
          const returnsEarned = (repaidAmount - loan.amount) * (loan.interest_rate / 100);

          return {
            id: loan.id,
            amount: loan.amount,
            tenure_months: loan.tenure_months,
            interest_rate: loan.interest_rate,
            status: loan.status,
            borrower_name: borrower ? `${borrower.first_name} ${borrower.last_name}` : 'Unknown',
            expected_returns: Math.round(expectedReturns),
            months_passed: monthsPassed,
            repaid_amount: Math.round(repaidAmount),
            remaining_amount: Math.round(remainingAmount),
            returns_earned: Math.round(returnsEarned),
            completion_pct: Math.round((monthsPassed / loan.tenure_months) * 100)
          };
        })
      );

      portfolioData.investments = enrichedInvestments;
      portfolioData.total_invested = enrichedInvestments.reduce((sum, l) => sum + l.amount, 0);
      portfolioData.total_expected_returns = enrichedInvestments.reduce((sum, l) => sum + l.expected_returns, 0);
      portfolioData.total_returns_earned = enrichedInvestments.reduce((sum, l) => sum + l.returns_earned, 0);
      portfolioData.active_investments = enrichedInvestments.filter(l => l.status === 'ACTIVE').length;
      portfolioData.completed_investments = enrichedInvestments.filter(l => l.status === 'REPAID').length;
    } else {
      // Borrower portfolio: loans they've taken
      const borrowerLoans = await mongoDatabase.findLoansByBorrowerId(userId);

      const enrichedLoans = await Promise.all(
        borrowerLoans.map(async (loan) => {
          const investor = loan.investor_id ? await mongoDatabase.findUserById(loan.investor_id) : null;
          const monthsPassed = Math.max(0, Math.floor((new Date().getTime() - new Date(loan.disbursed_at || loan.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)));
          const repaidAmount = monthsPassed * loan.emi_amount;

          return {
            id: loan.id,
            amount: loan.amount,
            tenure_months: loan.tenure_months,
            status: loan.status,
            investor_name: investor ? `${investor.first_name} ${investor.last_name}` : null,
            emi_amount: loan.emi_amount,
            months_passed: monthsPassed,
            repaid_amount: Math.round(repaidAmount),
            remaining_amount: Math.round(loan.amount - repaidAmount),
            completion_pct: Math.round((monthsPassed / loan.tenure_months) * 100)
          };
        })
      );

      portfolioData.loans = enrichedLoans;
      portfolioData.total_borrowed = enrichedLoans.reduce((sum, l) => sum + l.amount, 0);
      portfolioData.total_repaid = enrichedLoans.reduce((sum, l) => sum + l.repaid_amount, 0);
      portfolioData.total_owed = enrichedLoans.reduce((sum, l) => sum + l.remaining_amount, 0);
      portfolioData.active_loans = enrichedLoans.filter(l => l.status === 'ACTIVE').length;
      portfolioData.completed_loans = enrichedLoans.filter(l => l.status === 'REPAID').length;
    }

    console.log(`✅ Portfolio loaded: ${user.account_type}`);

    res.json({
      status: 'success',
      data: portfolioData
    });
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch portfolio'
      }
    });
  }
});

// POST /simulate-default - Simulate loan default (PHASE 5 - Admin only)
router.post('/:loanId/simulate-default', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { loanId } = req.params;
    const loan = await mongoDatabase.findLoanById(loanId);
    
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        error: { code: 'LOAN_NOT_FOUND', message: 'Loan not found' }
      });
    }

    if (loan.status !== 'ACTIVE') {
      return res.status(400).json({
        status: 'error',
        error: { code: 'INVALID_STATUS', message: 'Only ACTIVE loans can be defaulted' }
      });
    }

    console.log(`⚠️ Simulating default for loan=${loanId}`);

    // Get collateral value from locked assets
    const lockedAssets = await mongoDatabase.findLockedAssetsByUserId(loan.borrower_id);
    const totalCollateralValue = lockedAssets.reduce((sum, asset) => sum + (asset.credit_limit || 0), 0);

    // Apply 8% haircut for liquidation
    const recoveredAmount = totalCollateralValue * 0.92;
    const recoveryPercentage = (recoveredAmount / loan.amount) * 100;

    console.log(`💰 Collateral value: ${totalCollateralValue}, Recovered: ${recoveredAmount} (${recoveryPercentage.toFixed(1)}%)`);

    // Update loan status to DEFAULTED
    await mongoDatabase.updateLoan(loanId, {
      status: 'DEFAULTED',
      updated_at: new Date().toISOString()
    });

    // Find or create investment record
    const Investment = (await import('../models/Investment')).default;
    let investment = await Investment.findOne({ loan_id: loanId });

    if (!investment) {
      // Create investment record if it doesn't exist
      const { v4: uuidv4 } = await import('uuid');
      investment = await Investment.create({
        id: uuidv4(),
        loan_id: loanId,
        investor_id: loan.investor_id || 'UNKNOWN',
        amount: loan.amount,
        status: 'DEFAULTED',
        returns_earned: 0,
        recovery_amount: Math.round(recoveredAmount),
        recovery_percentage: parseFloat(recoveryPercentage.toFixed(2)),
        defaulted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });
    } else {
      // Update existing investment record
      investment.status = 'DEFAULTED';
      investment.recovery_amount = Math.round(recoveredAmount);
      investment.recovery_percentage = parseFloat(recoveryPercentage.toFixed(2));
      investment.defaulted_at = new Date();
      investment.updated_at = new Date();
      await investment.save();
    }

    console.log(`✅ Default simulated: Investment record updated with recovery stats`);

    res.json({
      status: 'success',
      data: {
        message: 'Loan defaulted successfully',
        loan_id: loanId,
        loan_status: 'DEFAULTED',
        collateral_value: totalCollateralValue,
        recovered_amount: Math.round(recoveredAmount),
        recovery_percentage: parseFloat(recoveryPercentage.toFixed(2)),
        haircut_percentage: 8,
        investment: {
          id: investment.id,
          status: investment.status,
          recovery_amount: investment.recovery_amount,
          recovery_percentage: investment.recovery_percentage
        }
      }
    });
  } catch (error) {
    console.error('Simulate default error:', error);
    res.status(500).json({
      status: 'error',
      error: { code: 'INTERNAL_ERROR', message: 'Failed to simulate default' }
    });
  }
});

// POST /repay - Make loan repayment (PHASE 3)
router.post('/:loanId/repay', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { loanId } = req.params;
    const { repayAmount } = req.body;
    const userId = req.user!.userId;

    if (!repayAmount || repayAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        error: { code: 'INVALID_INPUT', message: 'Repay amount must be positive' }
      });
    }

    const loan = await mongoDatabase.findLoanById(loanId);
    
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        error: { code: 'LOAN_NOT_FOUND', message: 'Loan not found' }
      });
    }

    if (loan.borrower_id !== userId) {
      return res.status(403).json({
        status: 'error',
        error: { code: 'FORBIDDEN', message: 'Can only repay own loans' }
      });
    }

    console.log(`💳 Processing repayment: loan=${loanId}, amount=${repayAmount}`);

    // Update loan repayment
    const newTotalRepaid = (loan.total_repaid || 0) + repayAmount;
    const loanFullyRepaid = newTotalRepaid >= loan.amount;

    await mongoDatabase.updateLoan(loanId, {
      total_repaid: newTotalRepaid,
      status: loanFullyRepaid ? 'REPAID' : loan.status
    });

    // If fully repaid, credit investor's balance
    if (loanFullyRepaid && loan.investor_id) {
      const investor = await mongoDatabase.findUserById(loan.investor_id);
      const interestEarned = loan.amount * (loan.interest_rate / 100) * (loan.tenure_months / 12);
      const newBalance = (investor?.investor_balance || 0) + loan.amount + interestEarned;
      
      await mongoDatabase.updateUser(loan.investor_id, {
        investor_balance: newBalance
      });

      console.log(`✅ Loan repaid fully: investor earned ₹${Math.round(interestEarned)}`);
    } else {
      console.log(`⏳ Partial repayment recorded: ₹${repayAmount}`);
    }

    res.json({
      status: 'success',
      data: {
        message: loanFullyRepaid ? 'Loan fully repaid!' : 'Repayment recorded',
        loan_id: loanId,
        total_repaid: newTotalRepaid,
        status: loanFullyRepaid ? 'REPAID' : loan.status
      }
    });
  } catch (error) {
    console.error('Repayment error:', error);
    res.status(500).json({
      status: 'error',
      error: { code: 'INTERNAL_ERROR', message: 'Failed to process repayment' }
    });
  }
});

export default router;

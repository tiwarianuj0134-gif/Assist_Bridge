import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { processVoiceCommand } from '../services/aiService';
import User from '../models/User';
import Asset from '../models/Asset';
import LockedAsset from '../models/LockedAsset';
import Loan from '../models/Loan';
import TrustScore from '../models/TrustScore';

const router = Router();

// POST /api/v1/ai/chat - Process chatbot messages with OpenAI
router.post('/chat', authMiddleware, async (req, res) => {
  const { message } = req.body;
  const userId = (req as any).user.userId;

  try {
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        status: 'error',
        error: 'Message is required'
      });
    }

    // Fetch user context
    const [user, assets, loans, trustScore] = await Promise.all([
      User.findOne({ id: userId }).select('first_name last_name email'),
      Asset.find({ user_id: userId }),
      Loan.find({ user_id: userId }),
      TrustScore.findOne({ user_id: userId }).sort({ calculated_at: -1 })
    ]);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: 'User not found'
      });
    }

    // Build context
    const userName = `${user.first_name} ${user.last_name}`;
    const totalAssets = assets.reduce((sum, a) => sum + a.current_value, 0);
    const activeLoans = loans.filter(l => l.status === 'ACTIVE');
    const totalLoanAmount = activeLoans.reduce((sum, l) => sum + l.amount, 0);
    const currentTrustScore = trustScore?.score || 0;

    const userContext = {
      name: userName,
      email: user.email || '',
      trustScore: currentTrustScore,
      totalAssets: totalAssets,
      assetsCount: assets.length,
      activeLoansCount: activeLoans.length,
      totalLoanAmount: totalLoanAmount
    };

    // Try OpenAI first, fallback if it fails
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const systemPrompt = `You are AssetBridge's Legal & Tax AI Assistant. You help users with:
- Tax implications across countries
- Legal compliance questions
- Best asset choices per country
- Regulatory warnings
- Cross-border financial regulations

User Context:
- Name: ${userContext.name}
- Trust Score: ${userContext.trustScore}
- Total Assets: ₹${userContext.totalAssets.toLocaleString('en-IN')}
- Active Loans: ${userContext.activeLoansCount} (Total: ₹${userContext.totalLoanAmount.toLocaleString('en-IN')})

Provide helpful, accurate, and professional responses. Keep answers concise but informative. Use markdown formatting for better readability.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const response = completion.choices[0].message.content;

      return res.json({
        status: 'success',
        data: { response: response }
      });
    } catch (openaiError: any) {
      console.log('OpenAI unavailable, using fallback:', openaiError.message);
      
      // Use fallback response
      const fallbackResponse = generateFallbackResponse(message, userContext);
      
      return res.json({
        status: 'success',
        data: { response: fallbackResponse }
      });
    }
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return res.status(500).json({
      status: 'error',
      error: error.message || 'Failed to process chat message'
    });
  }
});

// Fallback response generator when OpenAI is unavailable
function generateFallbackResponse(message: string, context: any): string {
  const lowerMsg = message.toLowerCase();
  
  // Greeting
  if (lowerMsg.match(/^(hi|hello|hey|greetings)/i)) {
    return `Hello ${context.name}! 👋\n\nI'm your AssetBridge Legal & Tax AI Assistant. I can help you with:\n\n- Tax implications across countries\n- Legal compliance questions\n- Best asset choices per country\n- Regulatory warnings\n- Cross-border financial regulations\n\nWhat would you like to know?`;
  }
  
  // Tax questions
  if (lowerMsg.includes('tax')) {
    return `## Tax Implications\n\nBased on your profile:\n- Trust Score: ${context.trustScore}\n- Total Assets: ₹${context.totalAssets.toLocaleString('en-IN')}\n\n**General Tax Guidelines:**\n- Asset-backed loans are typically not taxable as income\n- Interest paid may be tax-deductible depending on jurisdiction\n- Cross-border transactions require FEMA compliance\n- Consult a tax professional for specific advice\n\n💡 **Tip:** Keep all documentation for audit purposes.`;
  }
  
  // Asset questions
  if (lowerMsg.includes('asset') || lowerMsg.includes('collateral')) {
    return `## Best Assets for Collateralization\n\nBased on your profile (${context.assetsCount} assets worth ₹${context.totalAssets.toLocaleString('en-IN')}):\n\n### 🥇 Top Choices:\n1. **Fixed Deposits** - LTV: 85%, Stable value\n2. **Gold** - LTV: 70%, High liquidity\n3. **Real Estate** - LTV: 60-65%, Long-term value\n4. **Blue-chip Stocks** - LTV: 55-65%, Market-dependent\n\n💡 **Recommendation:** Diversify collateral for better credit terms.`;
  }
  
  // GDPR/Compliance
  if (lowerMsg.includes('gdpr') || lowerMsg.includes('compliance') || lowerMsg.includes('data')) {
    return `## Data Protection & Compliance\n\n**AssetBridge Compliance:**\n- ✅ End-to-end encryption (AES-256)\n- ✅ GDPR compliant data handling\n- ✅ Right to deletion within 30 days\n- ✅ Standard Contractual Clauses (SCCs)\n\n**Your Rights:**\n1. Access your data anytime\n2. Request corrections\n3. Request deletion\n4. Export data in standard formats\n\n📧 Contact: dpo@assetbridge.io`;
  }
  
  // Reverse remittance
  if (lowerMsg.includes('remittance') || lowerMsg.includes('reverse')) {
    return `## Reverse Remittance Shield\n\n**How It Works:**\n\nTraditional: USD → Exchange → INR → Bank (2-5% fees, 3-5 days)\n\nAssetBridge: USD Assets → RWA Token → INR Credit (0.5% fees, Instant)\n\n**Benefits:**\n- ✅ No currency conversion losses\n- ✅ No remittance fees\n- ✅ Instant credit access\n- ✅ Assets keep earning returns\n- ✅ Tax-efficient structure\n\n💡 **Use Case:** Lock US assets, get INR credit for family in India.`;
  }
  
  // Loan questions
  if (lowerMsg.includes('loan')) {
    if (context.activeLoansCount > 0) {
      return `## Your Loan Status\n\nYou currently have ${context.activeLoansCount} active loan(s) totaling ₹${context.totalLoanAmount.toLocaleString('en-IN')}.\n\n**Loan Management Tips:**\n- Monitor EMI payments regularly\n- Maintain asset value above loan amount\n- Consider prepayment to reduce interest\n- Keep credit score healthy\n\n💡 **Your Trust Score:** ${context.trustScore}/1000`;
    } else {
      return `## Loan Information\n\nYou have no active loans currently.\n\n**To Apply for a Loan:**\n1. Lock eligible assets\n2. Get instant credit limit\n3. Apply for loan amount\n4. Receive funds within 24 hours\n\n**Your Profile:**\n- Trust Score: ${context.trustScore}/1000\n- Total Assets: ₹${context.totalAssets.toLocaleString('en-IN')}\n\n💡 **Tip:** Higher trust score = Better interest rates`;
    }
  }
  
  // Default response
  return `## AssetBridge AI Assistant\n\nThank you for your question about "${message}".\n\n**Your Profile:**\n- Name: ${context.name}\n- Trust Score: ${context.trustScore}/1000\n- Assets: ${context.assetsCount} (₹${context.totalAssets.toLocaleString('en-IN')})\n- Active Loans: ${context.activeLoansCount}\n\n**I can help with:**\n- Tax implications and regulations\n- Asset collateralization advice\n- Legal compliance questions\n- Cross-border financial guidance\n- Loan and credit information\n\n**Popular Topics:**\n- "Tax implications of gold loans"\n- "Best assets for UK credit"\n- "GDPR compliance"\n- "How does reverse remittance work?"\n\nWhat would you like to know more about?`;
}

// POST /api/v1/ai/command - Process voice command with user context
router.post('/command', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const userId = (req as any).user.userId;

    console.log('\n========================================');
    console.log('📥 NEW VOICE COMMAND RECEIVED');
    console.log('========================================');
    console.log('📝 Text:', text);
    console.log('👤 User ID:', userId);
    console.log('⏰ Time:', new Date().toISOString());

    // Validate input
    if (!text || typeof text !== 'string') {
      console.error('❌ VALIDATION ERROR: Invalid text input');
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_INPUT',
          message: 'Text is required and must be a string'
        }
      });
    }

    if (!userId) {
      console.error('❌ AUTH ERROR: User ID missing from token');
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication failed'
        }
      });
    }

    // Fetch user's complete financial profile
    console.log('🔍 Fetching user context from database...');
    const [user, assets, lockedAssets, loans, trustScore] = await Promise.all([
      User.findOne({ id: userId }).select('first_name last_name email'),
      Asset.find({ user_id: userId }),
      LockedAsset.find({ user_id: userId }),
      Loan.find({ user_id: userId }),
      TrustScore.findOne({ user_id: userId }).sort({ calculated_at: -1 })
    ]);

    if (!user) {
      console.error('❌ DATABASE ERROR: User not found');
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found'
        }
      });
    }

    console.log('✅ User found:', user.first_name, user.last_name);

    // Build context summary
    const userName = `${user.first_name} ${user.last_name}`;
    const totalAssets = assets.reduce((sum, a) => sum + a.current_value, 0);
    const lockedAssetsCount = lockedAssets.length;
    const totalLockedValue = lockedAssets.reduce((sum, la) => sum + (la.credit_limit || 0), 0);
    const activeLoans = loans.filter(l => l.status === 'ACTIVE');
    const totalLoanAmount = activeLoans.reduce((sum, l) => sum + l.amount, 0);
    const currentTrustScore = trustScore?.score || 0;

    const userContext = {
      name: userName,
      email: user.email || '',
      trustScore: currentTrustScore,
      totalAssets: totalAssets,
      assetsCount: assets.length,
      lockedAssetsCount: lockedAssetsCount,
      creditAvailable: totalLockedValue,
      activeLoansCount: activeLoans.length,
      totalLoanAmount: totalLoanAmount,
      hasActiveLoans: activeLoans.length > 0,
      assets: assets.map(a => ({
        type: a.asset_type,
        name: a.name,
        value: a.current_value,
        status: a.status
      })),
      activeLoans: activeLoans.map(l => ({
        amount: l.amount,
        tenure: l.tenure_months,
        status: l.status,
        emi: l.emi_amount
      }))
    };

    console.log('📊 User context summary:');
    console.log('   - Name:', userName);
    console.log('   - Trust Score:', currentTrustScore);
    console.log('   - Assets:', assets.length);
    console.log('   - Active Loans:', activeLoans.length);

    // Process command with user context
    console.log('🤖 Processing command with AI service...');
    const result = await processVoiceCommand(text, userContext);

    console.log('✅ COMMAND PROCESSED SUCCESSFULLY');
    console.log('📤 Response:', JSON.stringify(result, null, 2));
    console.log('========================================\n');

    res.json({
      status: 'success',
      data: result
    });
  } catch (error: any) {
    console.error('\n========================================');
    console.error('❌ AI COMMAND ERROR');
    console.error('========================================');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('========================================\n');
    
    res.status(500).json({
      status: 'error',
      error: {
        code: 'AI_ERROR',
        message: error.message || 'Failed to process command'
      }
    });
  }
});

// POST /api/v1/ai/analyze - Analyze documents and update trust score
router.post('/analyze', authMiddleware, async (req, res) => {
  const { documentType } = req.body;
  const userId = (req as any).user.userId;

  try {
    if (!documentType || typeof documentType !== 'string') {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_INPUT',
          message: 'Document type is required'
        }
      });
    }

    // Fetch user data
    const user = await User.findOne({ id: userId }).select('first_name last_name email kyc_status annual_income');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Get current trust score
    const currentScore = await TrustScore.findOne({ user_id: userId }).sort({ calculated_at: -1 });
    const baseScore = currentScore?.score || 550;

    // Simulate document analysis (in production, use real OCR/ML)
    const documentAnalysis = {
      'Bank Statement': { scoreBoost: 80, factors: ['Income Stability +40pt', 'Account Age +20pt', 'Transaction Volume +20pt'] },
      'CIBIL Report': { scoreBoost: 100, factors: ['Credit History +50pt', 'Payment Discipline +30pt', 'Credit Mix +20pt'] },
      'Tax Returns': { scoreBoost: 90, factors: ['Income Verification +40pt', 'Tax Compliance +30pt', 'Income Growth +20pt'] },
      'Salary Slips': { scoreBoost: 60, factors: ['Income Stability +40pt', 'Employment Confirmation +20pt'] },
      'Property Documents': { scoreBoost: 110, factors: ['Auto Collateral +50pt', 'Asset Ownership +40pt', 'Property Tax Status +20pt'] }
    };

    const analysis = documentAnalysis[documentType as keyof typeof documentAnalysis] || { 
      scoreBoost: 40, 
      factors: ['Document Verified +40pt'] 
    };

    // Calculate new score
    const newScore = Math.min(baseScore + analysis.scoreBoost, 1000);
    const scoreImprovement = newScore - baseScore;

    // Create new trust score record
    const trustScoreId = (await import('uuid')).v4();
    const newTrustScore = await TrustScore.create({
      id: trustScoreId,
      user_id: userId,
      score: newScore,
      factors: JSON.stringify([
        { name: 'Income Stability', weight: 25, value: Math.min(85 + (scoreImprovement / 5), 100), impact: 'POSITIVE' },
        { name: 'Credit History', weight: 20, value: Math.min(75 + (scoreImprovement / 4), 100), impact: 'POSITIVE' },
        { name: 'Asset Coverage', weight: 25, value: Math.min(80 + (scoreImprovement / 5), 100), impact: 'POSITIVE' },
        { name: 'Debt-to-Income', weight: 15, value: Math.min(70 + (scoreImprovement / 6), 100), impact: 'POSITIVE' },
        { name: 'Cross-border Activity', weight: 10, value: Math.min(60 + (scoreImprovement / 8), 100), impact: 'NEUTRAL' },
        { name: 'Fraud Risk (Inverse)', weight: 5, value: Math.min(95 + (scoreImprovement / 10), 100), impact: 'POSITIVE' }
      ]),
      calculated_at: new Date()
    });

    console.log(`✅ Document analyzed: ${documentType}`);
    console.log(`   Old Score: ${baseScore}`);
    console.log(`   New Score: ${newScore}`);
    console.log(`   Improvement: +${scoreImprovement}pts`);

    res.json({
      status: 'success',
      data: {
        documentType,
        oldScore: baseScore,
        newScore: newScore,
        scoreImprovement: scoreImprovement,
        insights: analysis.factors,
        factors: JSON.parse(newTrustScore.factors),
        message: `Document ${documentType} analyzed successfully! Score improved by ${scoreImprovement} points.`
      }
    });
  } catch (error: any) {
    console.error('Document analysis error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'ANALYSIS_ERROR',
        message: error.message || 'Failed to analyze document'
      }
    });
  }
});

// GET /api/v1/ai/trust-score - Get user's current trust score
router.get('/trust-score', authMiddleware, async (req, res) => {
  const userId = (req as any).user.userId;

  try {
    const trustScore = await TrustScore.findOne({ user_id: userId }).sort({ calculated_at: -1 });

    if (!trustScore) {
      return res.json({
        status: 'success',
        data: {
          currentScore: 500,
          previousScore: 500,
          factors: []
        }
      });
    }

    res.json({
      status: 'success',
      data: {
        currentScore: trustScore.score,
        factors: JSON.parse(trustScore.factors || '[]'),
        calculatedAt: trustScore.calculated_at
      }
    });
  } catch (error: any) {
    console.error('Trust score fetch error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'FETCH_ERROR',
        message: error.message || 'Failed to fetch trust score'
      }
    });
  }
});

// POST /api/v1/ai/predict-risk - Predict loan default risk
router.post('/predict-risk', authMiddleware, async (req, res) => {
  const { loanAmount, tenure, purpose } = req.body;
  const userId = (req as any).user.userId;

  try {
    // Validate input
    if (!loanAmount || !tenure) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_INPUT',
          message: 'loanAmount and tenure are required'
        }
      });
    }

    console.log(`🤖 Risk prediction for user=${userId}, amount=${loanAmount}, tenure=${tenure}, purpose=${purpose}`);

    // Fetch user data for risk assessment
    const [user, lockedAssets, activeLoans, trustScore] = await Promise.all([
      User.findOne({ id: userId }).select('first_name last_name email kyc_status annual_income'),
      LockedAsset.find({ user_id: userId }),
      Loan.find({ borrower_id: userId, status: 'ACTIVE' }),
      TrustScore.findOne({ user_id: userId }).sort({ calculated_at: -1 })
    ]);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Calculate risk factors
    const currentTrustScore = trustScore?.score || 550;
    const totalCollateralValue = lockedAssets.reduce((sum, la) => sum + (la.credit_limit || 0), 0);
    const activeLoansTotal = activeLoans.reduce((sum, l) => sum + l.amount, 0);
    const monthlyIncome = (parseInt(user?.annual_income || '0') || 0) / 12;
    const debtToIncomeRatio = monthlyIncome > 0 ? (activeLoansTotal + loanAmount) / monthlyIncome : 999;
    const collateralToLoanRatio = loanAmount > 0 ? totalCollateralValue / loanAmount : 0;
    const purposeRiskMultiplier = {
      'Business Expansion': 1.0,
      'Personal': 1.2,
      'Home Improvement': 0.8,
      'Education': 0.9,
      'Medical': 1.1,
      'Vehicle Purchase': 0.7,
      'Debt Consolidation': 1.3
    };
    const riskMultiplier = purposeRiskMultiplier[purpose as keyof typeof purposeRiskMultiplier] || 1.0;

    // Compute risk factors with explainability
    const riskFactors: any = {
      trust_score_factor: {
        name: 'Trust Score',
        value: currentTrustScore,
        max: 1000,
        weight: 0.25,
        contribution: Math.max(0, 100 - (currentTrustScore / 10)),
        impact: currentTrustScore >= 750 ? 'POSITIVE' : currentTrustScore >= 650 ? 'NEUTRAL' : 'NEGATIVE'
      },
      collateral_ratio_factor: {
        name: 'Collateral to Loan Ratio',
        value: Math.round(collateralToLoanRatio * 100) / 100,
        threshold: 0.5,
        weight: 0.25,
        contribution: collateralToLoanRatio >= 0.5 ? 5 : collateralToLoanRatio >= 0.25 ? 15 : 35,
        impact: collateralToLoanRatio >= 0.5 ? 'POSITIVE' : 'NEGATIVE'
      },
      debt_to_income_factor: {
        name: 'Debt-to-Income Ratio',
        value: Math.round(debtToIncomeRatio * 100) / 100,
        threshold: 3.0,
        weight: 0.25,
        contribution: debtToIncomeRatio <= 3 ? 10 : debtToIncomeRatio <= 5 ? 25 : 50,
        impact: debtToIncomeRatio <= 3 ? 'POSITIVE' : 'NEGATIVE'
      },
      active_loans_factor: {
        name: 'Active Loans Count',
        value: activeLoans.length,
        threshold: 2,
        weight: 0.15,
        contribution: activeLoans.length <= 2 ? 8 : activeLoans.length <= 4 ? 20 : 40,
        impact: activeLoans.length <= 2 ? 'POSITIVE' : 'NEGATIVE'
      },
      kyc_status_factor: {
        name: 'KYC Verification',
        value: user.kyc_status ? 'Verified' : 'Pending',
        weight: 0.1,
        contribution: user.kyc_status ? 5 : 20,
        impact: user.kyc_status ? 'POSITIVE' : 'NEGATIVE'
      }
    };

    // Calculate default probability (0-1)
    let defaultProbability = 0.15; // Base rate
    
    // Apply factor contributions
    defaultProbability += (riskFactors.trust_score_factor.contribution * 0.0005);
    defaultProbability += (riskFactors.collateral_ratio_factor.contribution * 0.0008);
    defaultProbability += (riskFactors.debt_to_income_factor.contribution * 0.0006);
    defaultProbability += (riskFactors.active_loans_factor.contribution * 0.0004);
    defaultProbability += (riskFactors.kyc_status_factor.contribution * 0.0003);
    
    // Apply purpose risk multiplier
    defaultProbability *= riskMultiplier;
    
    // Cap at reasonable range [0.05, 0.75]
    defaultProbability = Math.max(0.05, Math.min(0.75, defaultProbability));

    // Determine risk band
    let riskBand: 'LOW' | 'MEDIUM' | 'HIGH';
    if (defaultProbability <= 0.15) {
      riskBand = 'LOW';
    } else if (defaultProbability <= 0.35) {
      riskBand = 'MEDIUM';
    } else {
      riskBand = 'HIGH';
    }

    // Determine AI decision
    let aiDecision: 'APPROVED' | 'REVIEW' | 'REJECT';
    let approvalScore = 0;

    // Scoring for approval
    if (currentTrustScore >= 750) approvalScore += 30;
    else if (currentTrustScore >= 650) approvalScore += 20;
    else if (currentTrustScore >= 550) approvalScore += 10;

    if (collateralToLoanRatio >= 0.5) approvalScore += 30;
    else if (collateralToLoanRatio >= 0.3) approvalScore += 20;
    else if (collateralToLoanRatio >= 0.1) approvalScore += 10;

    if (debtToIncomeRatio <= 2) approvalScore += 20;
    else if (debtToIncomeRatio <= 3) approvalScore += 10;

    if (activeLoans.length <= 1) approvalScore += 15;
    else if (activeLoans.length <= 3) approvalScore += 8;

    if (user.kyc_status) approvalScore += 10;

    // Decision logic
    if (approvalScore >= 70) {
      aiDecision = 'APPROVED';
    } else if (approvalScore >= 50) {
      aiDecision = 'REVIEW';
    } else {
      aiDecision = 'REJECT';
    }

    // Build explanation
    const explanationReasons: string[] = [];
    
    if (currentTrustScore >= 750) {
      explanationReasons.push('💪 Strong trust score indicates reliable payment history');
    } else if (currentTrustScore < 550) {
      explanationReasons.push('⚠️ Low trust score - may require additional documentation');
    }

    if (collateralToLoanRatio >= 0.5) {
      explanationReasons.push('✅ Strong collateral coverage reduces lender risk');
    } else if (collateralToLoanRatio < 0.1) {
      explanationReasons.push('⚠️ Low collateral coverage - high unsecured component');
    }

    if (debtToIncomeRatio <= 3) {
      explanationReasons.push('✅ Healthy debt-to-income ratio demonstrates repayment capacity');
    } else {
      explanationReasons.push('⚠️ High debt-to-income ratio may impact repayment ability');
    }

    if (activeLoans.length === 0) {
      explanationReasons.push('✅ No existing loans - first-time borrower');
    } else if (activeLoans.length > 3) {
      explanationReasons.push('⚠️ Multiple active loans - monitor concentration risk');
    }

    if (!user.kyc_status) {
      explanationReasons.push('📋 Complete KYC verification to improve approval chances');
    }

    console.log(`✅ Risk assessment complete:`);
    console.log(`   Default Probability: ${(defaultProbability * 100).toFixed(2)}%`);
    console.log(`   Risk Band: ${riskBand}`);
    console.log(`   AI Decision: ${aiDecision}`);
    console.log(`   Approval Score: ${approvalScore}/100`);

    res.json({
      status: 'success',
      data: {
        loanAmount,
        tenure,
        purpose,
        defaultProbability: parseFloat((defaultProbability * 100).toFixed(2)),
        riskBand,
        aiDecision,
        approvalScore,
        recommendedInterestRate: aiDecision === 'APPROVED' ? 12 : aiDecision === 'REVIEW' ? 14 : null,
        riskFactors: riskFactors,
        explanationReasons,
        estimatedMonthlyPayment: Math.round(loanAmount / tenure),
        summary: `Risk band: ${riskBand} | Default risk: ${(defaultProbability * 100).toFixed(1)}% | Decision: ${aiDecision}`
      }
    });
  } catch (error: any) {
    console.error('Risk prediction error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'PREDICTION_ERROR',
        message: error.message || 'Failed to predict loan risk'
      }
    });
  }
});

export default router;

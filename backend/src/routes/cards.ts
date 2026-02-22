import express from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import cardService from '../services/cardService';
import mongoDatabase from '../db/mongoDatabase';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * POST /api/v1/cards/issue
 * Issue a virtual card for an approved loan
 */
router.post('/issue', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { loanId } = req.body;

    if (!loanId) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'MISSING_LOAN_ID',
          message: 'Loan ID is required'
        }
      });
    }

    const card = await cardService.issueCard(userId, loanId);

    res.json({
      status: 'success',
      data: card
    });
  } catch (error: any) {
    console.error('Issue card error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'ISSUE_FAILED',
        message: error.message || 'Failed to issue card'
      }
    });
  }
});

/**
 * GET /api/v1/cards/my-card
 * Get user's active card
 */
router.get('/my-card', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const card = await cardService.getCard(userId);

    if (!card) {
      return res.json({
        status: 'success',
        data: null
      });
    }

    res.json({
      status: 'success',
      data: card
    });
  } catch (error: any) {
    console.error('Get card error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'FETCH_FAILED',
        message: error.message || 'Failed to fetch card'
      }
    });
  }
});

/**
 * POST /api/v1/cards/transact
 * Process a transaction
 */
router.post('/transact', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { amount, merchant, category, location, currency } = req.body;

    if (!amount || !merchant) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'MISSING_FIELDS',
          message: 'Amount and merchant are required'
        }
      });
    }

    const result = await cardService.processTransaction(userId, {
      amount,
      merchant,
      category,
      location,
      currency
    });

    res.json({
      status: 'success',
      data: result
    });
  } catch (error: any) {
    console.error('Transaction error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'TRANSACTION_FAILED',
        message: error.message || 'Failed to process transaction'
      }
    });
  }
});

/**
 * GET /api/v1/cards/transactions
 * Get transaction history
 */
router.get('/transactions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const transactions = await cardService.getTransactions(userId, limit);

    res.json({
      status: 'success',
      data: transactions
    });
  } catch (error: any) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'FETCH_FAILED',
        message: error.message || 'Failed to fetch transactions'
      }
    });
  }
});

/**
 * POST /api/v1/cards/toggle-status
 * Freeze/Unfreeze card
 */
router.post('/toggle-status', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { freeze } = req.body;

    const result = await cardService.toggleCardStatus(userId, freeze);

    res.json({
      status: 'success',
      data: result
    });
  } catch (error: any) {
    console.error('Toggle card status error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'TOGGLE_FAILED',
        message: error.message || 'Failed to toggle card status'
      }
    });
  }
});

/**
 * POST /api/v1/cards/global/issue
 * Issue a global multi-currency card
 */
router.post('/global/issue', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { primaryCurrency, cardType } = req.body;

    // Validate user exists
    const user = await mongoDatabase.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Generate card details
    const cardId = uuidv4();
    const cardNumber = `4532${Math.floor(Math.random() * 10000000000000).toString().padStart(12, '0')}`;
    const cvv = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);
    
    const globalCard = {
      id: cardId,
      user_id: userId,
      card_number: cardNumber,
      cvv,
      expiry_date: expiryDate.toISOString().split('T')[0],
      card_holder_name: `${user.first_name} ${user.last_name}`,
      primary_currency: primaryCurrency || 'USD',
      supported_currencies: ['USD', 'EUR', 'GBP', 'INR', 'JPY'],
      balance_by_currency: {
        USD: 10000,
        EUR: 8500,
        GBP: 7500,
        INR: 850000,
        JPY: 1500000
      },
      daily_limit: 5000,
      monthly_limit: 50000,
      daily_spend: 0,
      monthly_spend: 0,
      status: 'ACTIVE',
      card_type: cardType || 'VIRTUAL',
      issued_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };

    console.log(`✅ Global card issued: ${cardId}`);

    res.status(201).json({
      status: 'success',
      data: globalCard
    });
  } catch (error: any) {
    console.error('Issue global card error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'ISSUANCE_FAILED',
        message: error.message || 'Failed to issue global card'
      }
    });
  }
});

/**
 * GET /api/v1/cards/global
 * Get user's global card details
 */
router.get('/global', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = await mongoDatabase.findUserById(userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Return mock global card
    const globalCard = {
      id: 'global_card_001',
      user_id: userId,
      card_number: '4532****8901',
      expiry_date: '2027-03-15',
      card_holder_name: `${user.first_name} ${user.last_name}`,
      primary_currency: user.preferred_currency || 'USD',
      supported_currencies: user.supported_currencies || ['USD', 'EUR', 'GBP', 'INR', 'JPY'],
      balance_by_currency: {
        USD: 10000,
        EUR: 8500,
        GBP: 7500,
        INR: 850000,
        JPY: 1500000
      },
      total_balance_usd: 25000,
      daily_limit: 5000,
      monthly_limit: 50000,
      daily_spend: 1250,
      monthly_spend: 15000,
      status: 'ACTIVE',
      card_type: 'VIRTUAL',
      issued_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      last_used_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
      usage_percentage: {
        daily: (1250 / 5000) * 100,
        monthly: (15000 / 50000) * 100
      }
    };

    res.json({
      status: 'success',
      data: globalCard
    });
  } catch (error: any) {
    console.error('Get global card error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'FETCH_FAILED',
        message: error.message || 'Failed to fetch global card'
      }
    });
  }
});

/**
 * POST /api/v1/cards/global/set-currency
 * Set preferred currency for global card
 */
router.post('/global/set-currency', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { currency } = req.body;

    if (!currency) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'MISSING_CURRENCY',
          message: 'Currency is required'
        }
      });
    }

    // Validate supported currency
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY'];
    if (!supportedCurrencies.includes(currency.toUpperCase())) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_CURRENCY',
          message: `Currency ${currency} is not supported`
        }
      });
    }

    // Update user preference
    await mongoDatabase.updateUser(userId, { 
      preferred_currency: currency.toUpperCase() 
    });

    res.json({
      status: 'success',
      data: {
        message: `Primary currency updated to ${currency}`,
        preferred_currency: currency.toUpperCase()
      }
    });
  } catch (error: any) {
    console.error('Set currency error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'UPDATE_FAILED',
        message: error.message || 'Failed to set currency'
      }
    });
  }
});

/**
 * GET /api/v1/cards/global/transactions
 * Get global card transactions in multiple currencies
 */
router.get('/global/transactions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const currency = (req.query.currency as string) || 'USD';

    // Mock multi-currency transactions
    const transactions = [
      {
        id: 'txn_001',
        amount: 450.00,
        currency: 'USD',
        merchant: 'Amazon.com',
        location: 'Seattle, USA',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'COMPLETED',
        category: 'Shopping'
      },
      {
        id: 'txn_002',
        amount: 35.50,
        currency: 'EUR',
        merchant: 'Nike Store',
        location: 'Paris, France',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'COMPLETED',
        category: 'Retail'
      },
      {
        id: 'txn_003',
        amount: 2500.00,
        currency: 'INR',
        merchant: 'FBB Store',
        location: 'Mumbai, India',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'COMPLETED',
        category: 'Clothing'
      },
      {
        id: 'txn_004',
        amount: 125.00,
        currency: 'GBP',
        merchant: 'Harrods',
        location: 'London, UK',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'COMPLETED',
        category: 'Luxury'
      }
    ];

    // Filter by selected currency if specified
    const filtered = currency === 'ALL' 
      ? transactions 
      : transactions.filter(t => t.currency === currency);

    res.json({
      status: 'success',
      data: {
        total: filtered.length,
        currency,
        transactions: filtered
      }
    });
  } catch (error: any) {
    console.error('Get global transactions error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'FETCH_FAILED',
        message: error.message || 'Failed to fetch transactions'
      }
    });
  }
});

export default router;


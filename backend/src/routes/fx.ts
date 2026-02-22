import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { 
  getDetailedFXRates,
  convertCurrency,
  generateHedgeRecommendation,
  calculateUnrealizedPnL,
  getOptimalHedgeMaturity
} from '../services/fxService';
import mongoDatabase from '../db/mongoDatabase';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * GET /api/v1/fx/rates
 * Get detailed FX rates for all supported pairs
 */
router.get('/rates', authMiddleware, async (req, res) => {
  try {
    const rates = await getDetailedFXRates();
    
    res.json({
      status: 'success',
      data: rates
    });
  } catch (error) {
    console.error('Get FX rates error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get FX rates'
      }
    });
  }
});

/**
 * GET /api/v1/fx/convert
 * Convert amount from one currency to another
 */
router.get('/convert', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { from, to, amount } = req.query;

    if (!from || !to || !amount) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'MISSING_PARAMS',
          message: 'from, to, and amount parameters are required'
        }
      });
    }

    const result = await convertCurrency(
      from as string,
      to as string,
      parseFloat(amount as string)
    );

    res.json({
      status: 'success',
      data: result
    });
  } catch (error: any) {
    console.error('Currency conversion error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'CONVERSION_FAILED',
        message: error.message || 'Failed to convert currency'
      }
    });
  }
});

/**
 * POST /api/v1/fx/hedge
 * Create a new FX hedge position
 */
router.post('/hedge', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { sourceCurrency, targetCurrency, notionalAmount, hedgeRatio, hedgeType } = req.body;

    if (!sourceCurrency || !targetCurrency || !notionalAmount) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'MISSING_FIELDS',
          message: 'sourceCurrency, targetCurrency, and notionalAmount are required'
        }
      });
    }

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

    // Get current FX rate
    const rates = await getDetailedFXRates();
    const pair = rates.find(r => 
      (r.pair === `${sourceCurrency}/${targetCurrency}` || 
       r.pair === `${targetCurrency}/${sourceCurrency}`)
    );
    
    const currentRate = pair?.rate || 1;

    // Create hedge document
    const hedgeId = uuidv4();
    const maturityDate = getOptimalHedgeMaturity();
    const actualHedgeRatio = hedgeRatio || 0.5;

    const hedge = {
      id: hedgeId,
      user_id: userId,
      source_currency: sourceCurrency,
      target_currency: targetCurrency,
      notional_amount: notionalAmount,
      hedge_ratio: actualHedgeRatio,
      hedge_type: hedgeType || 'FORWARD',
      locked_rate: currentRate,
      current_rate: currentRate,
      unrealized_gain_loss: 0,
      status: 'ACTIVE',
      start_date: new Date(),
      maturity_date: maturityDate,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Persist hedge to database (we'll simulate this)
    console.log(`✅ FX Hedge created: ${hedgeId}`);

    res.status(201).json({
      status: 'success',
      data: hedge
    });
  } catch (error: any) {
    console.error('Create hedge error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'HEDGE_CREATION_FAILED',
        message: error.message || 'Failed to create FX hedge'
      }
    });
  }
});

/**
 * GET /api/v1/fx/hedge-recommendation
 * Get hedge recommendation for a transaction
 */
router.get('/hedge-recommendation', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { sourceCurrency, targetCurrency, amount } = req.query;

    if (!sourceCurrency || !targetCurrency || !amount) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'MISSING_PARAMS',
          message: 'sourceCurrency, targetCurrency, and amount are required'
        }
      });
    }

    // Get current rate
    const rates = await getDetailedFXRates();
    const pair = rates.find(r => 
      r.pair === `${sourceCurrency}/${targetCurrency}`
    );
    const currentRate = pair?.rate || 1;

    const recommendation = generateHedgeRecommendation(
      sourceCurrency as string,
      targetCurrency as string,
      parseFloat(amount as string),
      currentRate
    );

    res.json({
      status: 'success',
      data: {
        ...recommendation,
        currentRate,
        maturityDate: getOptimalHedgeMaturity(),
        explanation: recommendation.recommended
          ? `Hedging recommended for this transaction. A ${(recommendation.hedgeRatio * 100).toFixed(0)}% hedge using ${recommendation.hedgeType} contract is suggested.`
          : 'Transaction amount is below hedging threshold. Consider hedging for larger transactions.'
      }
    });
  } catch (error: any) {
    console.error('Hedge recommendation error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'RECOMMENDATION_FAILED',
        message: error.message || 'Failed to generate hedge recommendation'
      }
    });
  }
});

/**
 * GET /api/v1/fx/hedges
 * Get user's active hedges
 */
router.get('/hedges', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Mock data for active hedges
    const activeHedges = [
      {
        id: 'hedge_001',
        source_currency: 'USD',
        target_currency: 'INR',
        notional_amount: 100000,
        hedge_ratio: 0.75,
        hedge_type: 'FORWARD',
        locked_rate: 83.45,
        current_rate: 83.62,
        unrealized_gain_loss: -127.50,
        status: 'ACTIVE',
        maturity_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        days_to_maturity: 180
      },
      {
        id: 'hedge_002',
        source_currency: 'EUR',
        target_currency: 'GBP',
        notional_amount: 50000,
        hedge_ratio: 0.5,
        hedge_type: 'OPTION',
        locked_rate: 0.86,
        current_rate: 0.865,
        unrealized_gain_loss: 250.00,
        status: 'ACTIVE',
        maturity_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        days_to_maturity: 90
      }
    ];

    res.json({
      status: 'success',
      data: {
        total: activeHedges.length,
        hedges: activeHedges,
        portfolio_pnl: -127.50 + 250.00
      }
    });
  } catch (error: any) {
    console.error('Get hedges error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'FETCH_FAILED',
        message: error.message || 'Failed to fetch hedges'
      }
    });
  }
});

export default router;


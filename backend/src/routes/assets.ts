import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { mongoDatabase } from '../db/mongoDatabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

const router = Router();

// LTV ratios by asset type
const LTV_RATIOS: Record<string, number> = {
  FD: 0.90,
  STOCK: 0.70,
  GOLD: 0.75,
  PROPERTY: 0.60,
  MUTUAL_FUND: 0.65
};

// Get all assets
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const assets = await mongoDatabase.findAssetsByUserId(req.user!.userId);
    const lockedAssets = await mongoDatabase.findLockedAssetsByUserId(req.user!.userId);

    // Merge locked asset data
    const assetsWithLockInfo = assets.map(asset => {
      const locked = lockedAssets.find(la => la.asset_id === asset.id);
      return {
        ...asset.toObject(),
        locked_id: locked?.id || null,
        credit_limit: locked?.credit_limit || null,
        used_credit: locked?.used_credit || null,
        locked_at: locked?.locked_at || null
      };
    });

    const totalValue = assets.reduce((sum, asset) => sum + asset.current_value, 0);

    res.json({
      status: 'success',
      data: {
        assets: assetsWithLockInfo,
        totalValue
      }
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get assets'
      }
    });
  }
});

// Add asset
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    console.log('Add asset request received:', req.body);
    console.log('User ID:', req.user?.userId);
    
    const { assetType, name, currentValue, currency, metadata } = req.body;

    if (!assetType || !name || !currentValue) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_INPUT',
          message: 'Asset type, name, and current value are required'
        }
      });
    }

    const assetId = uuidv4();
    const asset = {
      id: assetId,
      user_id: req.user!.userId,
      asset_type: assetType,
      name,
      current_value: currentValue,
      currency: currency || 'INR',
      status: 'ACTIVE',
      metadata: metadata || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating asset:', asset);
    const savedAsset = await mongoDatabase.createAsset(asset);
    console.log('Asset created successfully:', savedAsset);

    res.status(201).json({
      status: 'success',
      data: asset
    });
  } catch (error) {
    console.error('Add asset error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to add asset'
      }
    });
  }
});

// Lock asset
router.post('/:assetId/lock', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { assetId } = req.params;
    const { walletAddress } = req.body;

    console.log('Lock asset request:', { assetId, walletAddress, userId: req.user?.userId });

    // Get asset
    const asset = await mongoDatabase.findAssetById(assetId);
    console.log('Found asset:', asset);

    if (!asset || asset.user_id !== req.user!.userId) {
      console.log('Asset not found or unauthorized');
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'ASSET_NOT_FOUND',
          message: 'Asset not found'
        }
      });
    }

    if (asset.status === 'LOCKED') {
      console.log('Asset already locked');
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'ASSET_ALREADY_LOCKED',
          message: 'Asset is already locked'
        }
      });
    }

    // Calculate credit limit
    const ltvRatio = LTV_RATIOS[asset.asset_type] || 0.50;
    const creditLimit = asset.current_value * ltvRatio;

    console.log('Calculated credit limit:', { ltvRatio, creditLimit });

    // Lock asset
    const lockedId = uuidv4();
    const tokenId = `TOKEN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const lockedAssetData = {
      id: lockedId,
      asset_id: assetId,
      user_id: req.user!.userId,
      token_id: tokenId,
      wallet_address: walletAddress || null,
      ltv_ratio: ltvRatio,
      credit_limit: creditLimit,
      used_credit: 0,
      locked_at: new Date().toISOString()
    };

    console.log('Creating locked asset:', lockedAssetData);
    await mongoDatabase.createLockedAsset(lockedAssetData);

    // Update asset status
    console.log('Updating asset status to LOCKED');
    await mongoDatabase.updateAsset(assetId, { status: 'LOCKED' });

    console.log('Asset locked successfully');

    // Send notification
    await NotificationService.create({
      userId: req.user!.userId,
      type: 'ASSET_LOCKED',
      title: 'Asset Locked Successfully',
      message: `Your ${asset.asset_type} asset "${asset.name}" has been locked. Credit limit: ₹${creditLimit.toLocaleString()}`,
      data: {
        assetId,
        assetType: asset.asset_type,
        assetName: asset.name,
        creditLimit,
        tokenId
      },
      priority: 'MEDIUM'
    });

    res.json({
      status: 'success',
      data: {
        lockedAssetId: lockedId,
        tokenId,
        walletAddress: walletAddress || null,
        ltvRatio,
        creditLimit
      }
    });
  } catch (error) {
    console.error('Lock asset error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to lock asset'
      }
    });
  }
});

// Unlock asset
router.post('/:assetId/unlock', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { assetId } = req.params;

    // Check if asset has active loans
    const loans = await mongoDatabase.findLoansByBorrowerId(req.user!.userId);
    const activeLoan = loans.find(l => l.status === 'ACTIVE');

    if (activeLoan) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'ASSET_HAS_ACTIVE_LOANS',
          message: 'Cannot unlock asset with active loans'
        }
      });
    }

    // Delete locked asset record
    await mongoDatabase.deleteLockedAsset(assetId);

    // Update asset status
    await mongoDatabase.updateAsset(assetId, { status: 'ACTIVE' });

    res.json({
      status: 'success',
      data: {
        message: 'Asset unlocked successfully'
      }
    });
  } catch (error) {
    console.error('Unlock asset error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to unlock asset'
      }
    });
  }
});

// Get credit limit
router.get('/credit-limit', authMiddleware, async (req: AuthRequest, res) => {
  try {
    console.log('Get credit limit request for user:', req.user?.userId);
    
    const lockedAssets = await mongoDatabase.findLockedAssetsByUserId(req.user!.userId);
    console.log('Found locked assets:', lockedAssets.length);
    
    const totalCredit = lockedAssets.reduce((sum, la) => sum + la.credit_limit, 0);
    const usedCredit = lockedAssets.reduce((sum, la) => sum + la.used_credit, 0);
    const availableCredit = totalCredit - usedCredit;

    console.log('Credit limit calculated:', { totalCredit, usedCredit, availableCredit });

    res.json({
      status: 'success',
      data: {
        totalCreditLimit: totalCredit,
        usedCredit,
        availableCredit
      }
    });
  } catch (error) {
    console.error('Get credit limit error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get credit limit'
      }
    });
  }
});

export default router;

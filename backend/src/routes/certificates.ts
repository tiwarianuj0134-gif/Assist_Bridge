import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { mongoDatabase } from '../db/mongoDatabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Certificate from '../models/Certificate';
import { CertificateService } from '../services/certificateService';
import { NotificationService } from '../services/notificationService';

const router = Router();

// Generate certificate for locked asset
router.post('/generate', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { assetId } = req.body;
    const userId = req.user!.userId;

    if (!assetId) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_INPUT',
          message: 'Asset ID is required'
        }
      });
    }

    // Get locked asset
    const lockedAssets = await mongoDatabase.findLockedAssetsByUserId(userId);
    const lockedAsset = lockedAssets.find(la => la.asset_id === assetId);

    if (!lockedAsset) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'ASSET_NOT_FOUND',
          message: 'Locked asset not found or does not belong to you'
        }
      });
    }

    // Get user details
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

    // Check if there's an active loan using this asset
    const allLoans = await mongoDatabase.getAllLoans();
    const activeLoan = allLoans.find(
      l => l.borrower_id === userId && 
           l.status === 'ACTIVE' && 
           l.amount <= lockedAsset.credit_limit
    );

    let lienHolder = null;
    let lienHolderEmail = null;
    let loanId = null;

    if (activeLoan && activeLoan.investor_id) {
      const investor = await mongoDatabase.findUserById(activeLoan.investor_id);
      if (investor) {
        lienHolder = `${investor.first_name} ${investor.last_name}`;
        lienHolderEmail = investor.email;
        loanId = activeLoan.id;
      }
    }

    // Generate certificate number
    const certificateNumber = await CertificateService.generateCertificateNumber();
    const certificateId = uuidv4();

    // Calculate verification hash
    const verificationHash = CertificateService.calculateHash({
      certificateNumber,
      assetId: lockedAsset.asset_id,
      userId,
      issuedAt: new Date()
    });

    // Create certificate record
    const certificate = await Certificate.create({
      id: certificateId,
      certificate_number: certificateNumber,
      asset_id: lockedAsset.asset_id,
      user_id: userId,
      loan_id: loanId || undefined,
      certificate_type: lienHolder ? 'LIEN' : 'CUSTODY',
      status: 'ACTIVE',
      issued_at: new Date(),
      verification_hash: verificationHash,
      metadata: {
        asset_type: lockedAsset.asset_type || 'Asset',
        asset_value: lockedAsset.credit_limit,
        credit_limit: lockedAsset.credit_limit,
        used_credit: lockedAsset.used_credit || 0,
        lien_holder: lienHolder || undefined,
        lien_holder_email: lienHolderEmail || undefined
      },
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log(`✅ Certificate generated: ${certificateNumber} for asset ${assetId}`);

    // Send notification
    await NotificationService.create({
      userId,
      type: 'CERTIFICATE_GENERATED',
      title: 'Certificate Generated',
      message: `Certificate ${certificateNumber} has been generated for your ${lockedAsset.asset_type || 'asset'}`,
      data: {
        certificateId: certificate.id,
        certificateNumber: certificate.certificate_number,
        assetId,
        certificateType: certificate.certificate_type
      },
      priority: 'LOW'
    });

    res.status(201).json({
      status: 'success',
      data: {
        certificateId: certificate.id,
        certificateNumber: certificate.certificate_number,
        certificateType: certificate.certificate_type,
        downloadUrl: `/api/v1/certificates/${certificate.id}/download`,
        verificationHash: certificate.verification_hash,
        verificationUrl: `${req.protocol}://${req.get('host')}/verify/${verificationHash}`
      }
    });

  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate certificate'
      }
    });
  }
});

// Download certificate PDF
router.get('/:id/download', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Get certificate
    const certificate = await Certificate.findOne({ id });

    if (!certificate) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'CERTIFICATE_NOT_FOUND',
          message: 'Certificate not found'
        }
      });
    }

    // Check authorization (owner only for now)
    if (certificate.user_id !== userId) {
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to download this certificate'
        }
      });
    }

    // Get asset and user details
    const owner = await mongoDatabase.findUserById(certificate.user_id);
    const lockedAssets = await mongoDatabase.findLockedAssetsByUserId(certificate.user_id);
    const lockedAsset = lockedAssets.find(la => la.asset_id === certificate.asset_id);

    if (!owner || !lockedAsset) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'DATA_NOT_FOUND',
          message: 'Required data not found'
        }
      });
    }

    // Prepare certificate data
    const certificateData = {
      certificateNumber: certificate.certificate_number,
      certificateType: certificate.certificate_type,
      issueDate: certificate.issued_at,
      status: certificate.status,
      assetId: certificate.asset_id,
      assetType: certificate.metadata.asset_type,
      assetValue: certificate.metadata.asset_value,
      tokenId: lockedAsset.token_id,
      ownerName: `${owner.first_name} ${owner.last_name}`,
      ownerEmail: owner.email,
      lockedDate: lockedAsset.locked_at,
      creditLimit: certificate.metadata.credit_limit,
      usedCredit: certificate.metadata.used_credit,
      availableCredit: certificate.metadata.credit_limit - certificate.metadata.used_credit,
      lienHolder: certificate.metadata.lien_holder,
      lienHolderEmail: certificate.metadata.lien_holder_email,
      loanId: certificate.loan_id,
      verificationHash: certificate.verification_hash,
      verificationUrl: `${req.protocol}://${req.get('host')}/verify/${certificate.verification_hash}`
    };

    // Generate PDF
    const pdfStream = await CertificateService.generatePDF(certificateData);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificate_number}.pdf"`);

    // Pipe PDF to response
    pdfStream.pipe(res);

    console.log(`📄 Certificate downloaded: ${certificate.certificate_number}`);

  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to download certificate'
      }
    });
  }
});

// Verify certificate (public endpoint)
router.get('/verify/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    // Find certificate by hash
    const certificate = await Certificate.findOne({ verification_hash: hash });

    if (!certificate) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'CERTIFICATE_NOT_FOUND',
          message: 'Certificate not found or invalid hash'
        }
      });
    }

    // Get owner details
    const owner = await mongoDatabase.findUserById(certificate.user_id);

    res.json({
      status: 'success',
      data: {
        valid: certificate.status === 'ACTIVE',
        certificate: {
          certificateNumber: certificate.certificate_number,
          certificateType: certificate.certificate_type,
          status: certificate.status,
          issuedAt: certificate.issued_at,
          revokedAt: certificate.revoked_at,
          ownerName: owner ? `${owner.first_name} ${owner.last_name}` : 'Unknown',
          assetType: certificate.metadata.asset_type,
          assetValue: certificate.metadata.asset_value,
          creditLimit: certificate.metadata.credit_limit,
          usedCredit: certificate.metadata.used_credit,
          lienHolder: certificate.metadata.lien_holder || 'None'
        }
      }
    });

  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify certificate'
      }
    });
  }
});

// Get user's certificates
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Get all certificates for user
    const certificates = await Certificate.find({ user_id: userId }).sort({ issued_at: -1 });

    // Enrich with asset details
    const enrichedCertificates = await Promise.all(
      certificates.map(async (cert) => {
        const lockedAssets = await mongoDatabase.findLockedAssetsByUserId(userId);
        const asset = lockedAssets.find(la => la.asset_id === cert.asset_id);

        return {
          id: cert.id,
          certificateNumber: cert.certificate_number,
          certificateType: cert.certificate_type,
          status: cert.status,
          issuedAt: cert.issued_at,
          revokedAt: cert.revoked_at,
          assetId: cert.asset_id,
          assetType: cert.metadata.asset_type,
          assetValue: cert.metadata.asset_value,
          lienHolder: cert.metadata.lien_holder,
          downloadUrl: `/api/v1/certificates/${cert.id}/download`,
          verificationHash: cert.verification_hash,
          assetStillLocked: !!asset
        };
      })
    );

    res.json({
      status: 'success',
      data: {
        certificates: enrichedCertificates,
        count: enrichedCertificates.length
      }
    });

  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get certificates'
      }
    });
  }
});

// Revoke certificate
router.post('/:id/revoke', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Get certificate
    const certificate = await Certificate.findOne({ id });

    if (!certificate) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'CERTIFICATE_NOT_FOUND',
          message: 'Certificate not found'
        }
      });
    }

    // Check authorization (owner only for now)
    if (certificate.user_id !== userId) {
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to revoke this certificate'
        }
      });
    }

    // Check if already revoked
    if (certificate.status === 'REVOKED') {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'ALREADY_REVOKED',
          message: 'Certificate is already revoked'
        }
      });
    }

    // Revoke certificate
    certificate.status = 'REVOKED';
    certificate.revoked_at = new Date();
    await certificate.save();

    console.log(`🚫 Certificate revoked: ${certificate.certificate_number}`);

    res.json({
      status: 'success',
      data: {
        message: 'Certificate revoked successfully',
        certificateNumber: certificate.certificate_number,
        status: 'REVOKED',
        revokedAt: certificate.revoked_at
      }
    });

  } catch (error) {
    console.error('Revoke certificate error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to revoke certificate'
      }
    });
  }
});

export default router;

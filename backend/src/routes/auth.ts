import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { mongoDatabase } from '../db/mongoDatabase';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { OTPService } from '../services/otpService';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, accountType } = req.body;

    // Check if user exists
    const existingUser = await mongoDatabase.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Determine account type and investor balance
    const userAccountType = accountType || 'BORROWER';
    const investorBalance = userAccountType === 'INVESTOR' ? 100000 : 0;

    // Create user
    const userId = uuidv4();
    const user = {
      id: userId,
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      is_verified: false,
      kyc_status: 'NOT_STARTED',
      role: 'user',
      account_type: userAccountType,
      investor_balance: investorBalance,
      created_at: new Date(),
      updated_at: new Date()
    };

    await mongoDatabase.createUser(user);

    // Generate tokens
    const accessToken = generateAccessToken({ userId, email, role: 'user' });
    const refreshToken = generateRefreshToken({ userId, email, role: 'user' });

    res.status(201).json({
      status: 'success',
      data: {
        userId,
        email,
        accountType: userAccountType,
        investorBalance,
        accessToken,
        refreshToken,
        expiresIn: 900
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to register user'
      }
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await mongoDatabase.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });
    const refreshToken = generateRefreshToken({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });

    res.json({
      status: 'success',
      data: {
        accessToken,
        refreshToken,
        expiresIn: 900,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          kycStatus: user.kyc_status
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to login'
      }
    });
  }
});

// Verify email (mock - just marks as verified)
router.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body;

    // In real app, verify the code
    // For now, just mark as verified
    const user = await mongoDatabase.findUserByEmail(email);
    if (user) {
      await mongoDatabase.updateUser(user.id, { is_verified: true });
    }

    res.json({
      status: 'success',
      data: {
        verified: true
      }
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify email'
      }
    });
  }
});

// Forgot password - Send reset code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await mongoDatabase.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No account found with this email'
        }
      });
    }

    // Check rate limiting
    const canSend = await OTPService.checkRateLimit(email, 'PASSWORD_RESET');
    if (!canSend) {
      return res.status(429).json({
        status: 'error',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many OTP requests. Please try again later.'
        }
      });
    }

    // Generate and send OTP
    const { code, expiresAt } = await OTPService.createOTP({
      email,
      userId: user.id,
      type: 'PASSWORD_RESET'
    });

    // In production, send email with OTP code
    // For now, log it (in test mode, code will be '123456')
    console.log(`📧 Password reset OTP for ${email}: ${code}`);

    res.json({
      status: 'success',
      data: {
        message: 'Password reset code sent to your email',
        email: user.email,
        // Only include code in test/development mode
        ...(process.env.NODE_ENV !== 'production' && { code })
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process forgot password request'
      }
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    // Find user
    const user = await mongoDatabase.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No account found with this email'
        }
      });
    }

    // Verify OTP
    const verification = await OTPService.verifyOTP({
      email,
      code,
      type: 'PASSWORD_RESET'
    });

    if (!verification.valid) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_CODE',
          message: verification.message
        }
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await mongoDatabase.updateUser(user.id, { password_hash: passwordHash });

    res.json({
      status: 'success',
      data: {
        message: 'Password reset successfully'
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to reset password'
      }
    });
  }
});

export default router;

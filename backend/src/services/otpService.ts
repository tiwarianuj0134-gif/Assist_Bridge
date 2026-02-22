import { v4 as uuidv4 } from 'uuid';
import OTP, { OTPType } from '../models/OTP';

export class OTPService {
  /**
   * Generate a random 6-digit OTP code
   */
  static generateCode(): string {
    // In test/development mode, return fixed code for testing
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      return '123456';
    }
    
    // Generate random 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create and store OTP
   */
  static async createOTP(params: {
    email: string;
    userId?: string;
    type: OTPType;
  }): Promise<{ code: string; expiresAt: Date }> {
    const { email, userId, type } = params;

    // Delete any existing unused OTPs for this email and type
    await OTP.deleteMany({
      email,
      type,
      used: false
    });

    // Generate code
    const code = this.generateCode();

    // Set expiry (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Create OTP record
    await OTP.create({
      id: uuidv4(),
      user_id: userId,
      email,
      code,
      type,
      expires_at: expiresAt,
      used: false,
      created_at: new Date()
    });

    console.log(`✅ OTP created for ${email}: ${code} (expires at ${expiresAt.toISOString()})`);

    return { code, expiresAt };
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(params: {
    email: string;
    code: string;
    type: OTPType;
  }): Promise<{ valid: boolean; message: string }> {
    const { email, code, type } = params;

    // Find OTP
    const otp = await OTP.findOne({
      email,
      code,
      type,
      used: false
    });

    if (!otp) {
      return {
        valid: false,
        message: 'Invalid or expired OTP code'
      };
    }

    // Check expiry
    if (new Date() > otp.expires_at) {
      return {
        valid: false,
        message: 'OTP code has expired'
      };
    }

    // Mark as used
    otp.used = true;
    await otp.save();

    console.log(`✅ OTP verified for ${email}`);

    return {
      valid: true,
      message: 'OTP verified successfully'
    };
  }

  /**
   * Check rate limiting (max 3 OTP requests per hour)
   */
  static async checkRateLimit(email: string, type: OTPType): Promise<boolean> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const count = await OTP.countDocuments({
      email,
      type,
      created_at: { $gte: oneHourAgo }
    });

    return count < 3;
  }

  /**
   * Clean up expired OTPs (run as cron job)
   */
  static async cleanupExpiredOTPs(): Promise<number> {
    const result = await OTP.deleteMany({
      expires_at: { $lt: new Date() }
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} expired OTPs`);
    return result.deletedCount;
  }
}

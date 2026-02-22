import mongoose, { Schema, Document } from 'mongoose';

export type OTPType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

export interface IOTP extends Document {
  id: string;
  user_id?: string;
  email: string;
  code: string;
  type: OTPType;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

const OTPSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String },
  email: { type: String, required: true },
  code: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET']
  },
  expires_at: { type: Date, required: true },
  used: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

// Compound indexes for efficient queries
OTPSchema.index({ user_id: 1, type: 1 });
OTPSchema.index({ email: 1, type: 1 });
// TTL index for automatic expiration - this is the only expires_at index needed
OTPSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IOTP>('OTP', OTPSchema);

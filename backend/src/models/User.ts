import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_verified: boolean;
  profile_completed?: boolean;
  role: 'user' | 'admin';
  account_type: 'BORROWER' | 'INVESTOR';
  investor_balance?: number;
  kyc_status?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  occupation?: string;
  annual_income?: string;
  pan_number?: string;
  preferred_currency?: string;
  supported_currencies?: string[];
  country_code?: string;
  created_at: Date;
  updated_at: Date;
}

const UserSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  phone: { type: String },
  is_verified: { type: Boolean, default: false },
  profile_completed: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  account_type: { type: String, enum: ['BORROWER', 'INVESTOR'], default: 'BORROWER' },
  investor_balance: { type: Number, default: 0 },
  kyc_status: { type: String, default: 'NOT_STARTED' },
  date_of_birth: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  postal_code: { type: String },
  occupation: { type: String },
  annual_income: { type: String },
  pan_number: { type: String },
  preferred_currency: { type: String, default: 'USD' },
  supported_currencies: { type: [String], default: ['USD', 'EUR', 'GBP', 'INR', 'JPY'] },
  country_code: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  // Disable automatic _id field to avoid confusion
  // We use custom 'id' field instead
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Note: id field already has unique: true which creates an index automatically
// No need for explicit index creation

// Update timestamp on save
UserSchema.pre('save', function(this: IUser) {
  this.updated_at = new Date();
});

export default mongoose.model<IUser>('User', UserSchema);

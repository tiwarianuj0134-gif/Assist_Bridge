import mongoose, { Schema, Document } from 'mongoose';

export interface IBankAccount extends Document {
  id: string;
  user_id: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
  is_primary: boolean;
  is_verified: boolean;
  created_at: Date;
}

const BankAccountSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  bank_name: { type: String, required: true },
  account_number: { type: String, required: true },
  ifsc_code: { type: String, required: true },
  account_type: { type: String, default: 'SAVINGS' },
  is_primary: { type: Boolean, default: true },
  is_verified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model<IBankAccount>('BankAccount', BankAccountSchema);

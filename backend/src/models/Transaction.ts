import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  id: string;
  card_id: string;
  user_id: string;
  merchant: string;
  amount: number;
  currency: string;
  amount_inr: number;
  category: string;
  location: string;
  status: 'success' | 'declined' | 'pending';
  decline_reason?: string;
  created_at: Date;
}

const TransactionSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  card_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true, index: true },
  merchant: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'INR' },
  amount_inr: { type: Number, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, enum: ['success', 'declined', 'pending'], default: 'success' },
  decline_reason: { type: String },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);

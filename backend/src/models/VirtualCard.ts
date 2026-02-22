import mongoose, { Schema, Document } from 'mongoose';

export interface IVirtualCard extends Document {
  id: string;
  user_id: string;
  loan_id: string;
  card_number: string;
  cvv: string;
  expiry_date: string;
  card_holder_name: string;
  credit_limit: number;
  available_balance: number;
  status: 'active' | 'frozen' | 'cancelled';
  issued_at: Date;
  last_used_at?: Date;
}

const VirtualCardSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  loan_id: { type: String, required: true },
  card_number: { type: String, required: true, unique: true },
  cvv: { type: String, required: true },
  expiry_date: { type: String, required: true },
  card_holder_name: { type: String, required: true },
  credit_limit: { type: Number, required: true },
  available_balance: { type: Number, required: true },
  status: { type: String, enum: ['active', 'frozen', 'cancelled'], default: 'active' },
  issued_at: { type: Date, default: Date.now },
  last_used_at: { type: Date }
});

export default mongoose.model<IVirtualCard>('VirtualCard', VirtualCardSchema);

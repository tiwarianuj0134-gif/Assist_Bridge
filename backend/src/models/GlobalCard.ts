import mongoose, { Schema, Document } from 'mongoose';

export interface IGlobalCard extends Document {
  id: string;
  user_id: string;
  card_number: string;
  cvv: string;
  expiry_date: string;
  card_holder_name: string;
  primary_currency: string;
  supported_currencies: string[];
  balance_by_currency: { [key: string]: number };
  daily_limit: number;
  monthly_limit: number;
  daily_spend: number;
  monthly_spend: number;
  status: 'ACTIVE' | 'FROZEN' | 'CANCELLED';
  card_type: 'PHYSICAL' | 'VIRTUAL';
  issued_at: Date;
  last_used_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const GlobalCardSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  card_number: { type: String, required: true, unique: true },
  cvv: { type: String, required: true },
  expiry_date: { type: String, required: true },
  card_holder_name: { type: String, required: true },
  primary_currency: { type: String, default: 'USD' },
  supported_currencies: { type: [String], default: ['USD', 'EUR', 'GBP', 'INR', 'JPY'] },
  balance_by_currency: { type: Map, of: Number, default: new Map() },
  daily_limit: { type: Number, default: 5000 },
  monthly_limit: { type: Number, default: 50000 },
  daily_spend: { type: Number, default: 0 },
  monthly_spend: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'FROZEN', 'CANCELLED'], default: 'ACTIVE' },
  card_type: { type: String, enum: ['PHYSICAL', 'VIRTUAL'], default: 'VIRTUAL' },
  issued_at: { type: Date, default: Date.now },
  last_used_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

GlobalCardSchema.index({ user_id: 1, status: 1 });

export default mongoose.model<IGlobalCard>('GlobalCard', GlobalCardSchema);

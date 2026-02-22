import mongoose, { Schema, Document } from 'mongoose';

export interface IFXHedge extends Document {
  id: string;
  user_id: string;
  source_currency: string;
  target_currency: string;
  notional_amount: number;
  hedge_ratio: number; // 0-1, percentage of exposure being hedged
  hedge_type: 'FORWARD' | 'OPTION' | 'COLLAR';
  locked_rate: number;
  current_rate: number;
  unrealized_gain_loss: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CLOSED';
  start_date: Date;
  maturity_date: Date;
  created_at: Date;
  updated_at: Date;
}

const FXHedgeSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  source_currency: { type: String, required: true },
  target_currency: { type: String, required: true },
  notional_amount: { type: Number, required: true },
  hedge_ratio: { type: Number, required: true, min: 0, max: 1 }, // 0-100% hedge
  hedge_type: { type: String, enum: ['FORWARD', 'OPTION', 'COLLAR'], default: 'FORWARD' },
  locked_rate: { type: Number, required: true },
  current_rate: { type: Number, required: true },
  unrealized_gain_loss: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'CLOSED'], default: 'ACTIVE' },
  start_date: { type: Date, default: Date.now },
  maturity_date: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

FXHedgeSchema.index({ user_id: 1, status: 1 });

export default mongoose.model<IFXHedge>('FXHedge', FXHedgeSchema);

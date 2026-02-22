import mongoose, { Schema, Document } from 'mongoose';

export interface IFXRate extends Document {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  bid_rate?: number;
  ask_rate?: number;
  mid_rate: number;
  timestamp: Date;
  updated_at: Date;
}

const FXRateSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  base_currency: { type: String, required: true, index: true },
  target_currency: { type: String, required: true, index: true },
  rate: { type: Number, required: true },
  bid_rate: { type: Number }, // What we pay when selling
  ask_rate: { type: Number }, // What we receive when buying
  mid_rate: { type: Number, required: true }, // Average of bid and ask
  timestamp: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Compound index for efficient queries
FXRateSchema.index({ base_currency: 1, target_currency: 1, timestamp: -1 });

export default mongoose.model<IFXRate>('FXRate', FXRateSchema);

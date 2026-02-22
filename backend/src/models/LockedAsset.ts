import mongoose, { Schema, Document } from 'mongoose';

export interface ILockedAsset extends Document {
  id: string;
  asset_id: string;
  user_id: string;
  token_id: string;
  wallet_address?: string;
  asset_type?: string;
  ltv_ratio: number;
  credit_limit: number;
  used_credit: number;
  locked_at: Date;
}

const LockedAssetSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  asset_id: { type: String, required: true, unique: true, index: true },
  user_id: { type: String, required: true, index: true },
  token_id: { type: String, required: true },
  wallet_address: { type: String, required: false },
  asset_type: { type: String, default: 'Crypto' },
  ltv_ratio: { type: Number, required: true },
  credit_limit: { type: Number, required: true },
  used_credit: { type: Number, default: 0 },
  locked_at: { type: Date, default: Date.now }
});

export default mongoose.model<ILockedAsset>('LockedAsset', LockedAssetSchema);

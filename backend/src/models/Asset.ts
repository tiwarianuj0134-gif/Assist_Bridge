import mongoose, { Schema, Document } from 'mongoose';

export interface IAsset extends Document {
  id: string;
  user_id: string;
  asset_type: string;
  name: string;
  current_value: number;
  currency: string;
  status: 'ACTIVE' | 'LOCKED';
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

const AssetSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  asset_type: { type: String, required: true },
  name: { type: String, required: true },
  current_value: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['ACTIVE', 'LOCKED'], default: 'ACTIVE' },
  metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

AssetSchema.pre('save', function(this: IAsset) {
  this.updated_at = new Date();
});

export default mongoose.model<IAsset>('Asset', AssetSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface ITrustScore extends Document {
  id: string;
  user_id: string;
  score: number;
  factors: any;
  calculated_at: Date;
}

const TrustScoreSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  score: { type: Number, required: true },
  factors: { type: Schema.Types.Mixed },
  calculated_at: { type: Date, default: Date.now }
});

export default mongoose.model<ITrustScore>('TrustScore', TrustScoreSchema);

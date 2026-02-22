import mongoose, { Schema, Document } from 'mongoose';

export interface IInvestment extends Document {
  id: string;
  loan_id: string;
  investor_id: string;
  amount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED';
  returns_earned: number;
  recovery_amount?: number;
  recovery_percentage?: number;
  defaulted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const InvestmentSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  loan_id: { type: String, required: true, index: true },
  investor_id: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'COMPLETED', 'DEFAULTED'], 
    default: 'ACTIVE' 
  },
  returns_earned: { type: Number, default: 0 },
  recovery_amount: { type: Number },
  recovery_percentage: { type: Number },
  defaulted_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

InvestmentSchema.pre('save', function(this: IInvestment) {
  this.updated_at = new Date();
});

export default mongoose.model<IInvestment>('Investment', InvestmentSchema);

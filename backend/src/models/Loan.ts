import mongoose, { Schema, Document } from 'mongoose';

export interface ILoan extends Document {
  id: string;
  borrower_id: string;
  investor_id?: string;
  amount: number;
  tenure_months: number;
  interest_rate: number;
  emi_amount: number;
  purpose: string;
  status: 'UNDER_REVIEW' | 'LISTED_FOR_FUNDING' | 'ACTIVE' | 'REJECTED' | 'REPAID' | 'DEFAULTED';
  disbursed_amount: number;
  total_repaid: number;
  rejection_reason?: string;
  risk_band?: 'LOW' | 'MEDIUM' | 'HIGH';
  default_probability?: number;
  ai_decision?: 'APPROVED' | 'REVIEW' | 'REJECT' | null;
  risk_assessment?: string;
  risk_factors?: string;
  created_at: Date;
  updated_at: Date;
  disbursed_at?: Date;
  approved_at?: Date;
}

const LoanSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  borrower_id: { type: String, required: true, index: true },
  investor_id: { type: String, index: true },
  amount: { type: Number, required: true },
  tenure_months: { type: Number, required: true },
  interest_rate: { type: Number, required: true },
  emi_amount: { type: Number, required: true },
  purpose: { type: String, default: 'Personal' },
  status: { 
    type: String, 
    enum: ['UNDER_REVIEW', 'LISTED_FOR_FUNDING', 'ACTIVE', 'REJECTED', 'REPAID', 'DEFAULTED'], 
    default: 'UNDER_REVIEW' 
  },
  disbursed_amount: { type: Number, default: 0 },
  total_repaid: { type: Number, default: 0 },
  rejection_reason: { type: String },
  risk_band: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
  default_probability: { type: Number },
  ai_decision: { type: String, enum: ['APPROVED', 'REVIEW', 'REJECT'] },
  risk_assessment: { type: String },
  risk_factors: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  disbursed_at: { type: Date },
  approved_at: { type: Date }
});

LoanSchema.pre('save', function(this: ILoan) {
  this.updated_at = new Date();
});

export default mongoose.model<ILoan>('Loan', LoanSchema);

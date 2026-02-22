import mongoose, { Schema, Document } from 'mongoose';

export interface IRepayment extends Document {
  id: string;
  loan_id: string;
  borrower_id: string;
  investor_id: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED';
  due_date: Date;
  paid_date?: Date;
  created_at: Date;
  updated_at: Date;
}

const RepaymentSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  loan_id: { type: String, required: true, index: true },
  borrower_id: { type: String, required: true, index: true },
  investor_id: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'COMPLETED'], 
    default: 'PENDING' 
  },
  due_date: { type: Date, required: true },
  paid_date: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model<IRepayment>('Repayment', RepaymentSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificate extends Document {
  id: string;
  certificate_number: string;
  asset_id: string;
  user_id: string;
  loan_id?: string;
  certificate_type: 'LIEN' | 'CUSTODY';
  status: 'ACTIVE' | 'REVOKED';
  issued_at: Date;
  revoked_at?: Date;
  verification_hash: string;
  pdf_url?: string;
  metadata: {
    asset_type: string;
    asset_value: number;
    credit_limit: number;
    used_credit: number;
    lien_holder?: string;
    lien_holder_email?: string;
  };
  created_at: Date;
  updated_at: Date;
}

const CertificateSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  certificate_number: { type: String, required: true, unique: true, index: true },
  asset_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true, index: true },
  loan_id: { type: String },
  certificate_type: { 
    type: String, 
    enum: ['LIEN', 'CUSTODY'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'REVOKED'], 
    default: 'ACTIVE',
    index: true
  },
  issued_at: { type: Date, default: Date.now },
  revoked_at: { type: Date },
  verification_hash: { type: String, required: true, unique: true, index: true },
  pdf_url: { type: String },
  metadata: {
    asset_type: { type: String, required: true },
    asset_value: { type: Number, required: true },
    credit_limit: { type: Number, required: true },
    used_credit: { type: Number, default: 0 },
    lien_holder: { type: String },
    lien_holder_email: { type: String }
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Compound indexes for efficient queries
CertificateSchema.index({ user_id: 1, status: 1 });
CertificateSchema.index({ asset_id: 1, status: 1 });

// Update timestamp on save
CertificateSchema.pre('save', function(this: ICertificate) {
  this.updated_at = new Date();
});

export default mongoose.model<ICertificate>('Certificate', CertificateSchema);

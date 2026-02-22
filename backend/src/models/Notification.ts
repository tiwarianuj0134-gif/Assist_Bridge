import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  // Loan notifications
  | 'LOAN_APPLIED'
  | 'LOAN_APPROVED'
  | 'LOAN_REJECTED'
  | 'LOAN_FUNDED'
  | 'LOAN_REPAID'
  | 'LOAN_DEFAULTED'
  // Investment notifications
  | 'INVESTMENT_OPPORTUNITY'
  | 'INVESTMENT_FUNDED'
  | 'INVESTMENT_REPAYMENT'
  | 'INVESTMENT_COMPLETED'
  // Payment notifications
  | 'PAYMENT_DUE'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_RECEIVED'
  // Asset notifications
  | 'ASSET_LOCKED'
  | 'ASSET_UNLOCKED'
  | 'CERTIFICATE_GENERATED'
  | 'CERTIFICATE_REVOKED'
  // Trust score notifications
  | 'TRUST_SCORE_IMPROVED'
  | 'TRUST_SCORE_DECREASED'
  // System notifications
  | 'SYSTEM_ANNOUNCEMENT'
  | 'ACCOUNT_VERIFIED'
  | 'SECURITY_ALERT';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';
export type DeliveryChannel = 'IN_APP' | 'EMAIL' | 'PUSH';

export interface INotification extends Document {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority: NotificationPriority;
  status: NotificationStatus;
  delivery_channels: DeliveryChannel[];
  email_sent: boolean;
  email_sent_at?: Date;
  read_at?: Date;
  created_at: Date;
  expires_at?: Date;
}

const NotificationSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  user_id: { type: String, required: true, index: true },
  type: {
    type: String,
    required: true,
    enum: [
      'LOAN_APPLIED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_FUNDED', 'LOAN_REPAID', 'LOAN_DEFAULTED',
      'INVESTMENT_OPPORTUNITY', 'INVESTMENT_FUNDED', 'INVESTMENT_REPAYMENT', 'INVESTMENT_COMPLETED',
      'PAYMENT_DUE', 'PAYMENT_OVERDUE', 'PAYMENT_RECEIVED',
      'ASSET_LOCKED', 'ASSET_UNLOCKED', 'CERTIFICATE_GENERATED', 'CERTIFICATE_REVOKED',
      'TRUST_SCORE_IMPROVED', 'TRUST_SCORE_DECREASED',
      'SYSTEM_ANNOUNCEMENT', 'ACCOUNT_VERIFIED', 'SECURITY_ALERT'
    ]
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['UNREAD', 'READ', 'ARCHIVED'],
    default: 'UNREAD',
    index: true
  },
  delivery_channels: {
    type: [String],
    enum: ['IN_APP', 'EMAIL', 'PUSH'],
    default: ['IN_APP']
  },
  email_sent: { type: Boolean, default: false },
  email_sent_at: { type: Date },
  read_at: { type: Date },
  created_at: { type: Date, default: Date.now, index: true },
  expires_at: { type: Date }
});

// Compound indexes for efficient queries
NotificationSchema.index({ user_id: 1, status: 1, created_at: -1 });
NotificationSchema.index({ user_id: 1, type: 1 });
NotificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index

export default mongoose.model<INotification>('Notification', NotificationSchema);

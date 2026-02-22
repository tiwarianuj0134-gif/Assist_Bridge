import mongoose, { Schema, Document } from 'mongoose';
import { NotificationType, DeliveryChannel } from './Notification';

export type EmailFrequency = 'INSTANT' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';

export interface INotificationPreference extends Document {
  user_id: string;
  preferences: {
    [key in NotificationType]: {
      enabled: boolean;
      channels: DeliveryChannel[];
    }
  };
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
  };
  email_frequency: EmailFrequency;
  updated_at: Date;
}

const NotificationPreferenceSchema: Schema = new Schema({
  user_id: { type: String, required: true, unique: true, index: true },
  preferences: {
    type: Schema.Types.Mixed,
    default: () => {
      // Default preferences for all notification types
      const defaultPrefs: any = {};
      const types: NotificationType[] = [
        'LOAN_APPLIED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_FUNDED', 'LOAN_REPAID', 'LOAN_DEFAULTED',
        'INVESTMENT_OPPORTUNITY', 'INVESTMENT_FUNDED', 'INVESTMENT_REPAYMENT', 'INVESTMENT_COMPLETED',
        'PAYMENT_DUE', 'PAYMENT_OVERDUE', 'PAYMENT_RECEIVED',
        'ASSET_LOCKED', 'ASSET_UNLOCKED', 'CERTIFICATE_GENERATED', 'CERTIFICATE_REVOKED',
        'TRUST_SCORE_IMPROVED', 'TRUST_SCORE_DECREASED',
        'SYSTEM_ANNOUNCEMENT', 'ACCOUNT_VERIFIED', 'SECURITY_ALERT'
      ];
      
      types.forEach(type => {
        // High priority notifications enabled by default with email
        const isHighPriority = [
          'LOAN_APPROVED', 'LOAN_FUNDED', 'LOAN_DEFAULTED',
          'INVESTMENT_FUNDED', 'PAYMENT_OVERDUE',
          'SECURITY_ALERT'
        ].includes(type);
        
        defaultPrefs[type] = {
          enabled: true,
          channels: isHighPriority ? ['IN_APP', 'EMAIL'] : ['IN_APP']
        };
      });
      
      return defaultPrefs;
    }
  },
  quiet_hours: {
    enabled: { type: Boolean, default: false },
    start_time: { type: String, default: '22:00' },
    end_time: { type: String, default: '08:00' }
  },
  email_frequency: {
    type: String,
    enum: ['INSTANT', 'DAILY_DIGEST', 'WEEKLY_DIGEST'],
    default: 'INSTANT'
  },
  updated_at: { type: Date, default: Date.now }
});

// Update timestamp on save
NotificationPreferenceSchema.pre('save', function(this: INotificationPreference) {
  this.updated_at = new Date();
});

export default mongoose.model<INotificationPreference>('NotificationPreference', NotificationPreferenceSchema);

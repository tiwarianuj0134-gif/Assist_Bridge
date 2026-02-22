import { v4 as uuidv4 } from 'uuid';
import Notification, { NotificationType, NotificationPriority, DeliveryChannel } from '../models/Notification';
import NotificationPreference from '../models/NotificationPreference';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority?: NotificationPriority;
  expiresInDays?: number;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async create(params: CreateNotificationParams) {
    const {
      userId,
      type,
      title,
      message,
      data,
      priority = 'MEDIUM',
      expiresInDays
    } = params;

    // Get user preferences
    const shouldSend = await this.shouldSend(userId, type);
    if (!shouldSend) {
      console.log(`Notification ${type} disabled for user ${userId}`);
      return null;
    }

    // Get delivery channels from preferences
    const channels = await this.getDeliveryChannels(userId, type);

    // Calculate expiry date
    let expiresAt: Date | undefined;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Create notification
    const notification = await Notification.create({
      id: uuidv4(),
      user_id: userId,
      type,
      title,
      message,
      data,
      priority,
      status: 'UNREAD',
      delivery_channels: channels,
      email_sent: false,
      created_at: new Date(),
      expires_at: expiresAt
    });

    console.log(`✅ Notification created: ${type} for user ${userId}`);

    // Send via channels (async, don't wait)
    this.send(notification.id).catch(err => {
      console.error('Failed to send notification:', err);
    });

    return notification;
  }

  /**
   * Send notification via configured channels
   */
  static async send(notificationId: string) {
    const notification = await Notification.findOne({ id: notificationId });
    if (!notification) {
      throw new Error('Notification not found');
    }

    // Check quiet hours
    const inQuietHours = await this.isInQuietHours(notification.user_id);
    if (inQuietHours && notification.priority !== 'URGENT') {
      console.log(`Notification ${notificationId} delayed due to quiet hours`);
      return;
    }

    // Send via email if configured
    if (notification.delivery_channels.includes('EMAIL') && !notification.email_sent) {
      await this.sendEmail(notification);
    }

    // Push notifications would go here
    if (notification.delivery_channels.includes('PUSH')) {
      // await this.sendPush(notification);
    }
  }

  /**
   * Send email notification
   */
  static async sendEmail(notification: any) {
    try {
      // In production, integrate with email service (SendGrid, AWS SES, etc.)
      console.log(`📧 Sending email notification: ${notification.type}`);
      console.log(`   To: User ${notification.user_id}`);
      console.log(`   Subject: ${notification.title}`);
      console.log(`   Message: ${notification.message}`);

      // Mark as sent
      notification.email_sent = true;
      notification.email_sent_at = new Date();
      await notification.save();

      console.log(`✅ Email sent for notification ${notification.id}`);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  /**
   * Get user notification preferences
   */
  static async getUserPreferences(userId: string) {
    let prefs = await NotificationPreference.findOne({ user_id: userId });
    
    if (!prefs) {
      // Create default preferences
      prefs = await NotificationPreference.create({
        user_id: userId
      });
    }

    return prefs;
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  static async shouldSend(userId: string, type: NotificationType): Promise<boolean> {
    const prefs = await this.getUserPreferences(userId);
    
    if (!prefs.preferences[type]) {
      return true; // Default to enabled if not configured
    }

    return prefs.preferences[type].enabled;
  }

  /**
   * Get delivery channels for notification type
   */
  static async getDeliveryChannels(userId: string, type: NotificationType): Promise<DeliveryChannel[]> {
    const prefs = await this.getUserPreferences(userId);
    
    if (!prefs.preferences[type]) {
      return ['IN_APP']; // Default to in-app only
    }

    return prefs.preferences[type].channels;
  }

  /**
   * Check if current time is in user's quiet hours
   */
  static async isInQuietHours(userId: string): Promise<boolean> {
    const prefs = await this.getUserPreferences(userId);
    
    if (!prefs.quiet_hours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const startTime = prefs.quiet_hours.start_time;
    const endTime = prefs.quiet_hours.end_time;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    // Handle same-day quiet hours (e.g., 13:00 to 14:00)
    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    const notification = await Notification.findOne({ id: notificationId });
    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.status = 'READ';
    notification.read_at = new Date();
    await notification.save();

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    const result = await Notification.updateMany(
      { user_id: userId, status: 'UNREAD' },
      {
        $set: {
          status: 'READ',
          read_at: new Date()
        }
      }
    );

    return result.modifiedCount;
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return await Notification.countDocuments({
      user_id: userId,
      status: 'UNREAD'
    });
  }

  /**
   * Delete notification
   */
  static async delete(notificationId: string) {
    const notification = await Notification.findOne({ id: notificationId });
    if (!notification) {
      throw new Error('Notification not found');
    }

    await Notification.deleteOne({ id: notificationId });
    return true;
  }

  /**
   * Auto-cleanup old notifications (run as cron job)
   */
  static async cleanupOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Notification.deleteMany({
      created_at: { $lt: thirtyDaysAgo },
      status: { $in: ['READ', 'ARCHIVED'] }
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
    return result.deletedCount;
  }

  /**
   * Get notifications for a user
   */
  static async getNotifications(
    userId: string,
    options: {
      status?: 'UNREAD' | 'READ' | 'ARCHIVED' | 'ALL';
      type?: NotificationType;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const {
      status = 'ALL',
      type,
      limit = 50,
      offset = 0
    } = options;

    const query: any = { user_id: userId };

    if (status !== 'ALL') {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(offset);

    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await this.getUnreadCount(userId);

    return {
      notifications,
      unread_count: unreadCount,
      total_count: totalCount
    };
  }
}

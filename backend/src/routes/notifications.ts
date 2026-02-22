import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';
import NotificationPreference from '../models/NotificationPreference';
import { NotificationType } from '../models/Notification';

const router = Router();

// Get notifications
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { status, type, limit, offset } = req.query;

    const result = await NotificationService.getNotifications(userId, {
      status: status as any,
      type: type as NotificationType,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get notifications'
      }
    });
  }
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const count = await NotificationService.getUnreadCount(userId);

    res.json({
      status: 'success',
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get unread count'
      }
    });
  }
});

// Mark notification as read
router.post('/:id/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const notification = await NotificationService.markAsRead(id);

    // Verify ownership
    if (notification.user_id !== userId) {
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify this notification'
        }
      });
    }

    res.json({
      status: 'success',
      data: {
        message: 'Notification marked as read'
      }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark notification as read'
      }
    });
  }
});

// Mark all as read
router.post('/read-all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const count = await NotificationService.markAllAsRead(userId);

    res.json({
      status: 'success',
      data: {
        message: 'All notifications marked as read',
        count
      }
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark all notifications as read'
      }
    });
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await NotificationService.delete(id);

    res.json({
      status: 'success',
      data: {
        message: 'Notification deleted'
      }
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete notification'
      }
    });
  }
});

// Get notification preferences
router.get('/preferences', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const prefs = await NotificationService.getUserPreferences(userId);

    res.json({
      status: 'success',
      data: {
        preferences: prefs.preferences,
        quiet_hours: prefs.quiet_hours,
        email_frequency: prefs.email_frequency
      }
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get notification preferences'
      }
    });
  }
});

// Update notification preferences
router.put('/preferences', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { preferences, quiet_hours, email_frequency } = req.body;

    let prefs = await NotificationPreference.findOne({ user_id: userId });

    if (!prefs) {
      prefs = await NotificationPreference.create({
        user_id: userId,
        preferences,
        quiet_hours,
        email_frequency
      });
    } else {
      if (preferences) prefs.preferences = preferences;
      if (quiet_hours) prefs.quiet_hours = quiet_hours;
      if (email_frequency) prefs.email_frequency = email_frequency;
      await prefs.save();
    }

    res.json({
      status: 'success',
      data: {
        message: 'Preferences updated successfully'
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update notification preferences'
      }
    });
  }
});

export default router;

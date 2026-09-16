import { Elysia, t } from 'elysia';
import { NotificationService } from '../services/notification.service';
import { authContext, requireAuth } from '../middleware/auth';

export const notificationRoute = new Elysia({ prefix: '/notifications' })
  .use(authContext)
  .use(requireAuth)
  .get('/', async ({ user }) => {
    try {
      const data = await NotificationService.getUserNotifications(user!.id);
      const unreadCount = await NotificationService.getUnreadCount(user!.id);
      return {
        success: true,
        data,
        unreadCount
      };
    } catch (err: any) {
      return {
        success: false,
        data: [],
        unreadCount: 0,
        message: err.message ?? 'Gagal mengambil notifikasi'
      };
    }
  })
  .patch(
    '/:id/read',
    async ({ params: { id }, user, set }) => {
      try {
        await NotificationService.markAsRead(Number(id), user!.id);
        return {
          success: true,
          message: 'Notifikasi telah ditandai dibaca'
        };
      } catch (err: any) {
        set.status = 500;
        return {
          success: false,
          message: err.message ?? 'Gagal memperbarui status notifikasi'
        };
      }
    },
    {
      params: t.Object({
        id: t.Numeric()
      })
    }
  )
  .patch('/read-all', async ({ user, set }) => {
    try {
      await NotificationService.markAllAsRead(user!.id);
      return {
        success: true,
        message: 'Semua notifikasi telah ditandai dibaca'
      };
    } catch (err: any) {
      set.status = 500;
      return {
        success: false,
        message: err.message ?? 'Gagal memperbarui status notifikasi'
      };
    }
  });

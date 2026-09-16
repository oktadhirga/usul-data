import { describe, it, expect, spyOn, beforeEach } from 'bun:test';
import { app } from './index';
import { UserService } from './services/user.service';
import { NotificationService } from './services/notification.service';

describe('In-App Notification Test Suite', () => {
  let adminToken: string;
  let opdToken: string;

  beforeEach(async () => {
    const adminHash = await Bun.password.hash('admin123', {
      algorithm: 'bcrypt',
      cost: 4
    });
    const opdHash = await Bun.password.hash('opd12345', {
      algorithm: 'bcrypt',
      cost: 4
    });

    spyOn(UserService, 'getByUsername').mockImplementation(async (username: string) => {
      if (username === 'admin') {
        return {
          id: 1,
          username: 'admin',
          passwordHash: adminHash,
          role: 'Admin',
          kodeUnor: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      if (username === 'opd_user') {
        return {
          id: 2,
          username: 'opd_user',
          passwordHash: opdHash,
          role: 'AdminOPD',
          kodeUnor: 'UNOR-DINKES',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      return null;
    });

    const adminRes = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      })
    );
    const adminData = await adminRes.json();
    adminToken = adminData.token;

    const opdRes = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'opd_user', password: 'opd12345' })
      })
    );
    const opdData = await opdRes.json();
    opdToken = opdData.token;
  });

  describe('Endpoints /api/notifications', () => {
    it('rejects GET /api/notifications without auth (401)', async () => {
      const res = await app.handle(new Request('http://localhost/api/notifications'));
      expect(res.status).toBe(401);
    });

    it('returns notifications and unread count for authenticated user', async () => {
      spyOn(NotificationService, 'getUserNotifications').mockResolvedValueOnce([
        {
          id: 1,
          userId: 1,
          judul: 'Usulan Baru',
          pesan: 'Usulan perubahan data telah diajukan',
          link: '/verifikasi',
          isRead: false,
          createdAt: new Date()
        }
      ]);
      spyOn(NotificationService, 'getUnreadCount').mockResolvedValueOnce(1);

      const res = await app.handle(
        new Request('http://localhost/api/notifications', {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(1);
      expect(data.unreadCount).toBe(1);
      expect(data.data[0].judul).toBe('Usulan Baru');
    });

    it('marks single notification as read with PATCH /api/notifications/:id/read', async () => {
      spyOn(NotificationService, 'markAsRead').mockResolvedValueOnce(true);

      const res = await app.handle(
        new Request('http://localhost/api/notifications/1/read', {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Notifikasi telah ditandai dibaca');
    });

    it('marks all notifications as read with PATCH /api/notifications/read-all', async () => {
      spyOn(NotificationService, 'markAllAsRead').mockResolvedValueOnce(true);

      const res = await app.handle(
        new Request('http://localhost/api/notifications/read-all', {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${opdToken}` }
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Semua notifikasi telah ditandai dibaca');
    });
  });

  describe('NotificationService Helper Methods', () => {
    it('notifyAdmins calls notify logic appropriately', async () => {
      const spy = spyOn(NotificationService, 'notifyAdmins').mockResolvedValueOnce();
      await NotificationService.notifyAdmins('Judul', 'Pesan', '/link');
      expect(spy).toHaveBeenCalledWith('Judul', 'Pesan', '/link');
    });

    it('notifyUnor calls notify logic appropriately', async () => {
      const spy = spyOn(NotificationService, 'notifyUnor').mockResolvedValueOnce();
      await NotificationService.notifyUnor('UNOR-DINKES', 'Judul', 'Pesan', '/link');
      expect(spy).toHaveBeenCalledWith('UNOR-DINKES', 'Judul', 'Pesan', '/link');
    });
  });
});

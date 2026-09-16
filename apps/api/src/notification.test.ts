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

  describe('NotificationService Methods', () => {
    it('creates notification and reads correctly', async () => {
      // test creation
      await NotificationService.createNotification(
        1,
        'Test Notifikasi',
        'Isi pesan test',
        '/test-link'
      );
      const notifs = await NotificationService.getUserNotifications(1);
      expect(notifs.length).toBeGreaterThan(0);
      const latest = notifs[0];
      expect(latest.judul).toBe('Test Notifikasi');
      expect(latest.pesan).toBe('Isi pesan test');
      expect(latest.link).toBe('/test-link');
      expect(latest.isRead).toBe(false);

      // mark read
      await NotificationService.markAsRead(latest.id, 1);
      const updatedNotifs = await NotificationService.getUserNotifications(1);
      const updatedLatest = updatedNotifs.find((n) => n.id === latest.id);
      expect(updatedLatest?.isRead).toBe(true);
    });
  });
});

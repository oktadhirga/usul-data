import { describe, it, expect, spyOn, beforeEach, mock } from 'bun:test';
import { app } from './index';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';

describe('Auth & RBAC Test Suite', () => {
  let mockAdminPasswordHash: string;
  let mockOpdPasswordHash: string;

  beforeEach(async () => {
    mockAdminPasswordHash = await Bun.password.hash('admin123', {
      algorithm: 'bcrypt',
      cost: 4
    });
    mockOpdPasswordHash = await Bun.password.hash('opd12345', {
      algorithm: 'bcrypt',
      cost: 4
    });
  });

  describe('AuthService', () => {
    it('successfully logs in with valid credentials', async () => {
      spyOn(UserService, 'getByUsername').mockResolvedValueOnce({
        id: 1,
        username: 'admin',
        passwordHash: mockAdminPasswordHash,
        role: 'Admin',
        kodeUnor: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const res = await AuthService.login('admin', 'admin123');
      expect(res.success).toBe(true);
      expect(res.user?.username).toBe('admin');
      expect(res.user?.role).toBe('Admin');
    });

    it('rejects login with wrong password', async () => {
      spyOn(UserService, 'getByUsername').mockResolvedValueOnce({
        id: 1,
        username: 'admin',
        passwordHash: mockAdminPasswordHash,
        role: 'Admin',
        kodeUnor: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const res = await AuthService.login('admin', 'wrongpassword');
      expect(res.success).toBe(false);
      expect(res.message).toBe('Username atau password salah');
    });

    it('rejects login if user does not exist', async () => {
      spyOn(UserService, 'getByUsername').mockResolvedValueOnce(null);

      const res = await AuthService.login('unknown', 'anypassword');
      expect(res.success).toBe(false);
    });

    it('changes password successfully when old password matches', async () => {
      spyOn(UserService, 'getInternalById').mockResolvedValueOnce({
        id: 1,
        username: 'admin',
        passwordHash: mockAdminPasswordHash,
        role: 'Admin',
        kodeUnor: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      spyOn(UserService, 'updatePassword').mockResolvedValueOnce({
        success: true,
        message: 'Password berhasil diubah'
      });

      const res = await AuthService.changePassword(1, 'admin123', 'newadminpassword');
      expect(res.success).toBe(true);
      expect(res.message).toBe('Password berhasil diperbarui');
    });

    it('fails to change password if old password does not match', async () => {
      spyOn(UserService, 'getInternalById').mockResolvedValueOnce({
        id: 1,
        username: 'admin',
        passwordHash: mockAdminPasswordHash,
        role: 'Admin',
        kodeUnor: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const res = await AuthService.changePassword(1, 'wrongold', 'newadminpassword');
      expect(res.success).toBe(false);
      expect(res.message).toBe('Password lama tidak sesuai');
    });
  });

  describe('HTTP Endpoints & Middleware Flow', () => {
    let adminToken: string;
    let opdToken: string;

    it('POST /api/auth/login returns JWT token for Admin', async () => {
      spyOn(UserService, 'getByUsername').mockResolvedValueOnce({
        id: 1,
        username: 'admin',
        passwordHash: mockAdminPasswordHash,
        role: 'Admin',
        kodeUnor: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const res = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'admin123' })
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.user.role).toBe('Admin');
      adminToken = data.token;
    });

    it('POST /api/auth/login returns JWT token for AdminOPD with kode_unor', async () => {
      spyOn(UserService, 'getByUsername').mockResolvedValueOnce({
        id: 2,
        username: 'opd_dinkes',
        passwordHash: mockOpdPasswordHash,
        role: 'AdminOPD',
        kodeUnor: 'UNOR-DINKES-01',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const res = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'opd_dinkes', password: 'opd12345' })
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.role).toBe('AdminOPD');
      expect(data.user.kodeUnor).toBe('UNOR-DINKES-01');
      opdToken = data.token;
    });

    it('GET /api/auth/me returns authenticated user profile', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/auth/me', {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.username).toBe('admin');
      expect(data.user.role).toBe('Admin');
    });

    it('GET /api/auth/me rejects unauthorized request without token (401)', async () => {
      const res = await app.handle(new Request('http://localhost/api/auth/me'));
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('POST /api/auth/logout succeeds', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/auth/logout', { method: 'POST' })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('resolveUnorScope scopes data for AdminOPD', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/scoped-data', {
          headers: { Authorization: `Bearer ${opdToken}` }
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.userRole).toBe('AdminOPD');
      expect(data.scopeUnor).toBe('UNOR-DINKES-01');
      expect(data.isRestricted).toBe(true);
    });

    it('resolveUnorScope allows unrestricted data access for Admin', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/scoped-data', {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.userRole).toBe('Admin');
      expect(data.scopeUnor).toBeNull();
      expect(data.isRestricted).toBe(false);
    });

    it('Role Guard: Admin can access /api/users', async () => {
      spyOn(UserService, 'getAll').mockResolvedValueOnce([
        {
          id: 1,
          username: 'admin',
          role: 'Admin',
          kodeUnor: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      const res = await app.handle(
        new Request('http://localhost/api/users', {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(1);
    });

    it('Role Guard: AdminOPD is forbidden from accessing /api/users (403)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/users', {
          headers: { Authorization: `Bearer ${opdToken}` }
        })
      );
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Forbidden');
    });

    it('Admin can create AdminOPD with assigned kode_unor', async () => {
      spyOn(UserService, 'create').mockResolvedValueOnce({
        success: true,
        message: 'User berhasil dibuat'
      });

      const res = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            username: 'opd_disdik',
            password: 'disdikpassword',
            role: 'AdminOPD',
            kodeUnor: 'UNOR-DISDIK-02'
          })
        })
      );

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('Admin can update user kode_unor and role', async () => {
      spyOn(UserService, 'update').mockResolvedValueOnce({
        success: true,
        message: 'User berhasil diperbarui'
      });

      const res = await app.handle(
        new Request('http://localhost/api/users/2', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            kodeUnor: 'UNOR-NEW-03'
          })
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('Admin can delete user', async () => {
      spyOn(UserService, 'delete').mockResolvedValueOnce({
        success: true,
        message: 'User berhasil dihapus'
      });

      const res = await app.handle(
        new Request('http://localhost/api/users/2', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('User can change their own password via POST /api/auth/change-password', async () => {
      spyOn(AuthService, 'changePassword').mockResolvedValueOnce({
        success: true,
        message: 'Password berhasil diperbarui'
      });

      const res = await app.handle(
        new Request('http://localhost/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            oldPassword: 'admin123',
            newPassword: 'newAdminPassword123'
          })
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});


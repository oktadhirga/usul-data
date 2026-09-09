import { describe, it, expect, spyOn, beforeEach } from 'bun:test';
import { app } from './index';
import { UnorService } from './services/unor.service';
import { PegawaiService } from './services/pegawai.service';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import type { Unor, PegawaiWithUnor } from '@usul-data/shared';

describe('Fitur Kepegawaian (UNOR & Pegawai) Test Suite', () => {
  let adminToken: string;
  let opdDinkesToken: string;
  let opdBappedaToken: string;

  const mockUnorDinkes: Unor = {
    id: 1,
    kodeUnor: 'UNOR-DINKES',
    namaUnor: 'Dinas Kesehatan'
  };

  const mockUnorBappeda: Unor = {
    id: 2,
    kodeUnor: 'UNOR-BAPPEDA',
    namaUnor: 'Badan Perencanaan Pembangunan Daerah'
  };

  const mockPegawaiDinkes: PegawaiWithUnor = {
    id: 10,
    nip: '198501012010011001',
    nama: 'Dr. Ahmad Fauzi',
    jabatan: 'Kepala Bidang Pelayanan Medis',
    kodeUnor: 'UNOR-DINKES',
    namaUnor: 'Dinas Kesehatan'
  };

  const mockPegawaiBappeda: PegawaiWithUnor = {
    id: 20,
    nip: '198802022011011002',
    nama: 'Siti Nurhaliza, M.Si',
    jabatan: 'Analis Perencanaan Anggaran',
    kodeUnor: 'UNOR-BAPPEDA',
    namaUnor: 'Badan Perencanaan Pembangunan Daerah'
  };

  beforeEach(async () => {
    // Generate JWT tokens for testing
    const passwordHash = await Bun.password.hash('testpass', { algorithm: 'bcrypt', cost: 4 });

    // Mock Admin user login
    spyOn(UserService, 'getByUsername').mockImplementation(async (username: string) => {
      if (username === 'admin') {
        return {
          id: 1,
          username: 'admin',
          passwordHash,
          role: 'Admin',
          kodeUnor: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } else if (username === 'opd_dinkes') {
        return {
          id: 2,
          username: 'opd_dinkes',
          passwordHash,
          role: 'AdminOPD',
          kodeUnor: 'UNOR-DINKES',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } else if (username === 'opd_bappeda') {
        return {
          id: 3,
          username: 'opd_bappeda',
          passwordHash,
          role: 'AdminOPD',
          kodeUnor: 'UNOR-BAPPEDA',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      return null;
    });

    const loginUser = async (username: string) => {
      const res = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password: 'testpass' })
        })
      );
      const data = await res.json();
      return data.token as string;
    };

    adminToken = await loginUser('admin');
    opdDinkesToken = await loginUser('opd_dinkes');
    opdBappedaToken = await loginUser('opd_bappeda');
  });

  describe('UnorService & Endpoints', () => {
    it('Admin can view all UNOR via GET /api/unor', async () => {
      spyOn(UnorService, 'getAll').mockResolvedValueOnce([mockUnorDinkes, mockUnorBappeda]);

      const res = await app.handle(
        new Request('http://localhost/api/unor', {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(2);
    });

    it('AdminOPD is scoped to only their assigned UNOR via GET /api/unor', async () => {
      spyOn(UnorService, 'getAll').mockImplementation(async (scopeUnor) => {
        expect(scopeUnor).toBe('UNOR-DINKES');
        return [mockUnorDinkes];
      });

      const res = await app.handle(
        new Request('http://localhost/api/unor', {
          headers: { Authorization: `Bearer ${opdDinkesToken}` }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(1);
      expect(body.data[0].kodeUnor).toBe('UNOR-DINKES');
    });

    it('Admin can create new UNOR via POST /api/unor', async () => {
      spyOn(UnorService, 'create').mockResolvedValueOnce({
        success: true,
        message: 'Unit Organisasi berhasil ditambahkan'
      });

      const res = await app.handle(
        new Request('http://localhost/api/unor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            kodeUnor: 'UNOR-DISDIK',
            namaUnor: 'Dinas Pendidikan'
          })
        })
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('AdminOPD is forbidden from creating UNOR (403)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/unor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opdDinkesToken}`
          },
          body: JSON.stringify({
            kodeUnor: 'UNOR-DISDIK',
            namaUnor: 'Dinas Pendidikan'
          })
        })
      );

      expect(res.status).toBe(403);
    });
  });

  describe('PegawaiService & Endpoints with RBAC Scoping', () => {
    it('Admin can query Pegawai from any UNOR with optional filter', async () => {
      spyOn(PegawaiService, 'getAll').mockImplementation(async (params) => {
        expect(params.scopeUnor).toBeNull();
        if (params.kodeUnor === 'UNOR-BAPPEDA') {
          return [mockPegawaiBappeda];
        }
        return [mockPegawaiDinkes, mockPegawaiBappeda];
      });

      const res = await app.handle(
        new Request('http://localhost/api/pegawai?kode_unor=UNOR-BAPPEDA', {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(1);
      expect(body.data[0].kodeUnor).toBe('UNOR-BAPPEDA');
    });

    it('AdminOPD is strictly scoped to their assigned UNOR on GET /api/pegawai', async () => {
      spyOn(PegawaiService, 'getAll').mockImplementation(async (params) => {
        // Harus mendeteksi scopeUnor dari token AdminOPD Dinkes
        expect(params.scopeUnor).toBe('UNOR-DINKES');
        return [mockPegawaiDinkes];
      });

      const res = await app.handle(
        new Request('http://localhost/api/pegawai', {
          headers: { Authorization: `Bearer ${opdDinkesToken}` }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data[0].kodeUnor).toBe('UNOR-DINKES');
    });

    it('GET /api/pegawai/:id returns employee detail with nama_unor', async () => {
      spyOn(PegawaiService, 'getById').mockResolvedValueOnce(mockPegawaiDinkes);

      const res = await app.handle(
        new Request('http://localhost/api/pegawai/10', {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.nip).toBe(mockPegawaiDinkes.nip);
      expect(body.data.namaUnor).toBe('Dinas Kesehatan');
    });

    it('AdminOPD gets 403 Forbidden when trying to access employee detail from another UNOR', async () => {
      spyOn(PegawaiService, 'getById').mockImplementation(async (id, scopeUnor) => {
        expect(scopeUnor).toBe('UNOR-DINKES');
        throw new Error('Forbidden: Anda tidak memiliki hak akses untuk melihat data pegawai unit lain');
      });

      const res = await app.handle(
        new Request('http://localhost/api/pegawai/20', {
          headers: { Authorization: `Bearer ${opdDinkesToken}` }
        })
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.message).toContain('Forbidden');
    });

    it('AdminOPD cannot create employee for another UNOR', async () => {
      spyOn(PegawaiService, 'create').mockImplementation(async (data, user) => {
        if (user.role === 'AdminOPD' && data.kodeUnor !== user.kodeUnor) {
          throw new Error('Forbidden: Anda hanya dapat menambahkan pegawai ke Unit Organisasi Anda');
        }
        return { success: true, message: 'Data pegawai berhasil ditambahkan' };
      });

      const res = await app.handle(
        new Request('http://localhost/api/pegawai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opdDinkesToken}`
          },
          body: JSON.stringify({
            nip: '199001012020011005',
            nama: 'Budi Santoso',
            jabatan: 'Staff IT',
            kodeUnor: 'UNOR-BAPPEDA' // Beda dengan UNOR-DINKES
          })
        })
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('AdminOPD can successfully create employee for their own UNOR', async () => {
      spyOn(PegawaiService, 'create').mockResolvedValueOnce({
        success: true,
        message: 'Data pegawai berhasil ditambahkan'
      });

      const res = await app.handle(
        new Request('http://localhost/api/pegawai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opdDinkesToken}`
          },
          body: JSON.stringify({
            nip: '199001012020011005',
            nama: 'Budi Santoso',
            jabatan: 'Staff IT',
            kodeUnor: 'UNOR-DINKES'
          })
        })
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('Admin can delete employee via DELETE /api/pegawai/:id', async () => {
      spyOn(PegawaiService, 'delete').mockResolvedValueOnce({
        success: true,
        message: 'Data pegawai berhasil dihapus'
      });

      const res = await app.handle(
        new Request('http://localhost/api/pegawai/10', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });
});

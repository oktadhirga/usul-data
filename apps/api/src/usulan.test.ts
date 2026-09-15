import { describe, it, expect, spyOn, beforeEach } from 'bun:test';
import { app } from './index';
import { UserService } from './services/user.service';
import { PegawaiService } from './services/pegawai.service';
import { UsulanService } from './services/usulan.service';
import type { PegawaiWithUnor, UsulanStatus } from '@usul-data/shared';

describe('Fitur Usulan Ubah Data Pegawai Test Suite', () => {
  let adminToken: string;
  let opdDinkesToken: string;
  let opdBappedaToken: string;

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
    const passwordHash = await Bun.password.hash('testpass', { algorithm: 'bcrypt', cost: 4 });

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

  describe('Create Usulan (Draft)', () => {
    it('Requires authentication (returns 401 if unauthenticated)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/usulan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pegawaiId: 10,
            details: [
              {
                jenisUsulan: 'ubah',
                kategoriUbah: 'Jabatan',
                fieldName: 'jabatan',
                nilaiLama: 'Staf',
                nilaiBaru: 'Kepala Seksi'
              }
            ]
          })
        })
      );

      expect(res.status).toBe(401);
    });

    it('AdminOPD cannot create draft for employee from another UNOR (Forbidden 403)', async () => {
      spyOn(PegawaiService, 'getById').mockResolvedValueOnce(mockPegawaiBappeda);

      const res = await app.handle(
        new Request('http://localhost/api/usulan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opdDinkesToken}`
          },
          body: JSON.stringify({
            pegawaiId: 20, // Pegawai milik BAPPEDA
            details: [
              {
                jenisUsulan: 'ubah',
                kategoriUbah: 'Jabatan',
                fieldName: 'jabatan',
                nilaiLama: 'Analis',
                nilaiBaru: 'Sekretaris'
              }
            ]
          })
        })
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.message).toContain('Forbidden');
    });

    it('AdminOPD can create draft for employee within their UNOR (201 Created)', async () => {
      spyOn(UsulanService, 'createDraft').mockResolvedValueOnce({
        success: true,
        message: 'Draft usulan berhasil dibuat',
        data: { id: 101 }
      });

      const res = await app.handle(
        new Request('http://localhost/api/usulan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opdDinkesToken}`
          },
          body: JSON.stringify({
            pegawaiId: 10,
            details: [
              {
                jenisUsulan: 'ubah',
                kategoriUbah: 'Data Pribadi',
                fieldName: 'nama',
                nilaiLama: 'Dr. Ahmad Fauzi',
                nilaiBaru: 'Dr. Ahmad Fauzi, Sp.A'
              }
            ]
          })
        })
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(101);
    });
  });

  describe('Document Upload Validation', () => {
    it('Rejects non-PDF files with 400 Bad Request', async () => {
      spyOn(UsulanService, 'getById').mockResolvedValueOnce({
        id: 101,
        pegawaiId: 10,
        kodeUnor: 'UNOR-DINKES',
        status: 'draft',
        catatan: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        details: [],
        dokumen: []
      });

      const formData = new FormData();
      const txtFile = new File(['Dummy text file content'], 'dokumen.txt', {
        type: 'text/plain'
      });
      formData.append('file', txtFile);

      const res = await app.handle(
        new Request('http://localhost/api/usulan/101/dokumen', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${opdDinkesToken}`
          },
          body: formData
        })
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.message).toContain('PDF');
    });

    it('Rejects files exceeding 1 MB with 400 Bad Request', async () => {
      spyOn(UsulanService, 'getById').mockResolvedValueOnce({
        id: 101,
        pegawaiId: 10,
        kodeUnor: 'UNOR-DINKES',
        status: 'draft',
        catatan: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        details: [],
        dokumen: []
      });

      const formData = new FormData();
      // Buat file PDF dummy berukuran 1.2 MB
      const largeContent = new Uint8Array(1.2 * 1024 * 1024);
      const largePdf = new File([largeContent], 'besar.pdf', {
        type: 'application/pdf'
      });
      formData.append('file', largePdf);

      const res = await app.handle(
        new Request('http://localhost/api/usulan/101/dokumen', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${opdDinkesToken}`
          },
          body: formData
        })
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.message).toContain('1 MB');
    });

    it('Accepts valid PDF file <= 1 MB', async () => {
      spyOn(UsulanService, 'uploadDokumen').mockResolvedValueOnce({
        success: true,
        message: 'Dokumen pendukung berhasil diunggah',
        data: {
          id: 5,
          namaDokumen: 'sk_jabatan.pdf',
          pathFile: '/uploads/101_sk_jabatan.pdf',
          ukuranBytes: 20480
        }
      });

      const formData = new FormData();
      const validPdf = new File(['%PDF-1.4 dummy content'], 'sk_jabatan.pdf', {
        type: 'application/pdf'
      });
      formData.append('file', validPdf);

      const res = await app.handle(
        new Request('http://localhost/api/usulan/101/dokumen', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${opdDinkesToken}`
          },
          body: formData
        })
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.namaDokumen).toBe('sk_jabatan.pdf');
    });
  });

  describe('Submit Usulan Validation', () => {
    it('Requires document when jenisUsulan is tambah or ubah', async () => {
      spyOn(UsulanService, 'submitUsulan').mockImplementationOnce(async () => {
        throw new Error(
          'Usulan dengan jenis usulan tambah atau ubah wajib melampirkan minimal 1 dokumen pendukung PDF'
        );
      });

      const res = await app.handle(
        new Request('http://localhost/api/usulan/101/submit', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${opdDinkesToken}`
          }
        })
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.message).toContain('wajib melampirkan minimal 1 dokumen pendukung PDF');
    });

    it('Submits successfully when document is present for tambah/ubah', async () => {
      spyOn(UsulanService, 'submitUsulan').mockResolvedValueOnce({
        success: true,
        message: 'Usulan perubahan data berhasil diajukan'
      });

      const res = await app.handle(
        new Request('http://localhost/api/usulan/101/submit', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${opdDinkesToken}`
          }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain('berhasil diajukan');
    });
  });

  describe('Cancel Usulan Validation', () => {
    it('Cannot cancel draft usulan (only diajukan can be cancelled)', async () => {
      spyOn(UsulanService, 'cancelUsulan').mockImplementationOnce(async () => {
        throw new Error('Hanya usulan berstatus diajukan yang dapat dibatalkan');
      });

      const res = await app.handle(
        new Request('http://localhost/api/usulan/101/cancel', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${opdDinkesToken}`
          }
        })
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.message).toContain('Hanya usulan berstatus diajukan');
    });

    it('Can cancel usulan if currently in diajukan status', async () => {
      spyOn(UsulanService, 'cancelUsulan').mockResolvedValueOnce({
        success: true,
        message: 'Usulan perubahan data berhasil dibatalkan'
      });

      const res = await app.handle(
        new Request('http://localhost/api/usulan/101/cancel', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${opdDinkesToken}`
          }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain('berhasil dibatalkan');
    });
  });

  describe('List & Scoping Usulan', () => {
    it('AdminOPD is automatically scoped to their UNOR', async () => {
      spyOn(UsulanService, 'getAll').mockImplementationOnce(async ({ scopeUnor }) => {
        expect(scopeUnor).toBe('UNOR-DINKES');
        return [];
      });

      const res = await app.handle(
        new Request('http://localhost/api/usulan', {
          headers: {
            Authorization: `Bearer ${opdDinkesToken}`
          }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('Admin can filter by status and query all UNOR', async () => {
      spyOn(UsulanService, 'getAll').mockImplementationOnce(async ({ status, scopeUnor }) => {
        expect(scopeUnor).toBeNull();
        expect(status).toBe('diajukan');
        return [];
      });

      const res = await app.handle(
        new Request('http://localhost/api/usulan?status=diajukan', {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });

  describe('Update & Resubmit Usulan (draft & dibatalkan)', () => {
    it('Admin can update usulan when in draft or dibatalkan status', async () => {
      spyOn(UsulanService, 'updateUsulan').mockResolvedValueOnce({
        success: true,
        message: 'Usulan berhasil diperbarui'
      });

      const res = await app.handle(
        new Request('http://localhost/api/usulan/101', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opdDinkesToken}`
          },
          body: JSON.stringify({
            catatan: 'Revisi catatan',
            details: [
              {
                jenisUsulan: 'ubah',
                kategoriUbah: 'Data Pribadi',
                fieldName: 'alamat',
                nilaiLama: 'Jl. A',
                nilaiBaru: 'Jl. B'
              }
            ]
          })
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain('berhasil diperbarui');
    });

    it('Allows resubmitting usulan from dibatalkan status', async () => {
      spyOn(UsulanService, 'submitUsulan').mockResolvedValueOnce({
        success: true,
        message: 'Usulan perubahan data berhasil diajukan'
      });

      const res = await app.handle(
        new Request('http://localhost/api/usulan/101/submit', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${opdDinkesToken}`
          }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });

  describe('Delete Usulan Permanently', () => {
    it('Admin can permanently delete usulan via DELETE /api/usulan/:id', async () => {
      spyOn(UsulanService, 'deleteUsulan').mockResolvedValueOnce({
        success: true,
        message: 'Usulan berhasil dihapus secara permanen'
      });

      const res = await app.handle(
        new Request('http://localhost/api/usulan/101', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain('berhasil dihapus');
    });
  });

  describe('Verifikasi Usulan (Approval & Rejection)', () => {
    it('AdminOPD is forbidden from approving usulan (403)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/usulan/101/approve', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${opdDinkesToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ catatan: 'Disetujui' })
        })
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.message).toContain('Forbidden');
    });

    it('AdminOPD is forbidden from rejecting usulan (403)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/usulan/101/reject', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${opdDinkesToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ catatan: 'Berkas tidak lengkap' })
        })
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.message).toContain('Forbidden');
    });

    it('Admin can approve usulan with status diajukan (200)', async () => {
      spyOn(UsulanService, 'approveUsulan').mockResolvedValueOnce({
        success: true,
        message: 'Usulan berhasil disetujui dan data pegawai telah diperbarui'
      });

      const res = await app.handle(
        new Request('http://localhost/api/usulan/101/approve', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ catatan: 'Data terverifikasi dan sesuai' })
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain('berhasil disetujui');
    });

    it('Admin cannot reject usulan without catatan (422 Unprocessable Entity)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/usulan/101/reject', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        })
      );

      expect(res.status).toBe(422);
    });

    it('Admin can reject usulan with valid catatan (200)', async () => {
      spyOn(UsulanService, 'rejectUsulan').mockResolvedValueOnce({
        success: true,
        message: 'Usulan berhasil ditolak'
      });

      const res = await app.handle(
        new Request('http://localhost/api/usulan/101/reject', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ catatan: 'SK Pengangkatan belum dilampirkan' })
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain('berhasil ditolak');
    });

    it('Admin can query usulan list with kategori_ubah filter', async () => {
      const mockList: any[] = [
        {
          id: 101,
          pegawaiId: 10,
          kodeUnor: 'UNOR-DINKES',
          status: 'diajukan',
          catatan: 'Pengajuan jabatan baru'
        }
      ];
      spyOn(UsulanService, 'getAll').mockResolvedValueOnce(mockList);

      const res = await app.handle(
        new Request('http://localhost/api/usulan?kategori_ubah=Jabatan', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });
  });
});

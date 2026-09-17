import { describe, it, expect, spyOn, beforeEach } from 'bun:test';
import { app } from './index';
import { UserService } from './services/user.service';
import { DashboardService } from './services/dashboard.service';

describe('Dashboard and Reporting Feature Test Suite', () => {
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

  describe('Endpoints /api/dashboard/stats', () => {
    it('rejects GET /api/dashboard/stats without auth (401)', async () => {
      const res = await app.handle(new Request('http://localhost/api/dashboard/stats'));
      expect(res.status).toBe(401);
    });

    it('returns statistics successfully for Admin', async () => {
      const mockStats = {
        summary: {
          total: 10,
          diajukan: 4,
          disetujui: 3,
          ditolak: 2,
          draft: 1,
          dibatalkan: 0
        },
        byStatus: [
          { status: 'diajukan', count: 4 },
          { status: 'disetujui', count: 3 }
        ],
        byUnor: [
          {
            kodeUnor: 'UNOR-DINKES',
            namaUnor: 'Dinas Kesehatan',
            total: 6,
            diajukan: 2,
            disetujui: 2,
            ditolak: 1,
            draft: 1,
            dibatalkan: 0
          }
        ],
        byKategori: [{ kategori: 'Data Pribadi', count: 5 }],
        monthlyTrend: [
          { bulan: 1, namaBulan: 'Januari', total: 2, diajukan: 1, disetujui: 1, ditolak: 0 }
        ],
        filteredPeriod: { tahun: 2026, bulan: null }
      };

      const spy = spyOn(DashboardService, 'getStats').mockResolvedValueOnce(mockStats as any);

      const res = await app.handle(
        new Request('http://localhost/api/dashboard/stats?tahun=2026', {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.summary.total).toBe(10);
      expect(spy).toHaveBeenCalledWith({
        tahun: 2026,
        bulan: null,
        kodeUnor: null,
        status: null,
        scopeUnor: null
      });
    });

    it('automatically restricts scope for AdminOPD to their UNOR', async () => {
      const spy = spyOn(DashboardService, 'getStats').mockResolvedValueOnce({
        summary: { total: 3, diajukan: 1, disetujui: 1, ditolak: 1, draft: 0, dibatalkan: 0 },
        byStatus: [],
        byUnor: [],
        byKategori: [],
        monthlyTrend: [],
        filteredPeriod: { tahun: null, bulan: null }
      } as any);

      const res = await app.handle(
        new Request('http://localhost/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${opdToken}` }
        })
      );

      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          scopeUnor: 'UNOR-DINKES'
        })
      );
    });
  });

  describe('Endpoints /api/dashboard/export', () => {
    it('rejects GET /api/dashboard/export without auth (401)', async () => {
      const res = await app.handle(new Request('http://localhost/api/dashboard/export'));
      expect(res.status).toBe(401);
    });

    it('returns an Excel file with correct content-type header for Admin', async () => {
      const dummyBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // PK zip header
      const spy = spyOn(DashboardService, 'generateExcelReport').mockResolvedValueOnce(dummyBuffer);

      const res = await app.handle(
        new Request('http://localhost/api/dashboard/export?tahun=2026&status=disetujui', {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="laporan-usulan-');
      const arrayBuffer = await res.arrayBuffer();
      expect(arrayBuffer.byteLength).toBe(4);
      expect(spy).toHaveBeenCalledWith({
        tahun: 2026,
        bulan: null,
        kodeUnor: null,
        status: 'disetujui',
        scopeUnor: null
      });
    });

    it('passes scopeUnor for AdminOPD when exporting Excel', async () => {
      const dummyBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      const spy = spyOn(DashboardService, 'generateExcelReport').mockResolvedValueOnce(dummyBuffer);

      const res = await app.handle(
        new Request('http://localhost/api/dashboard/export', {
          headers: { Authorization: `Bearer ${opdToken}` }
        })
      );

      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          scopeUnor: 'UNOR-DINKES'
        })
      );
    });
  });

  describe('DashboardService.generateWorkbookFromData direct generation', () => {
    it('generates a valid excel binary buffer with ZIP/XLSX header', async () => {
      const mockRows = [
        {
          id: 1,
          createdAt: new Date(),
          nipPegawai: '198501012010011001',
          namaPegawai: 'Dr. Ahmad Fauzi',
          jabatanPegawai: 'Kepala Bidang',
          namaUnor: 'Dinas Kesehatan',
          status: 'disetujui',
          catatan: 'Catatan usulan',
          verifiedBy: 'admin',
          verifiedAt: new Date(),
          catatanVerifikasi: 'Disetujui lengkap'
        }
      ];
      const mockDetails = new Map<number, string[]>([
        [1, ['Data Pribadi (ubah: nama)']]
      ]);

      const buffer = await DashboardService.generateWorkbookFromData(mockRows, mockDetails, {
        unorLabel: 'Unit: Dinas Kesehatan',
        periodLabel: 'Periode: 2026'
      });
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(100);
      // Valid XLSX file begins with ZIP local file header bytes [0x50, 0x4B] ('PK')
      expect(buffer[0]).toBe(0x50);
      expect(buffer[1]).toBe(0x4b);
    });
  });
});

/**
 * TDD: Integrasi API SIMPEG Terpisah (UNOR & Pegawai)
 *
 * Spesifikasi Arsitektur yang Diuji:
 *   1. UNOR:
 *      - Ditarik HANYA secara manual via tombol di Admin UI (/unor).
 *      - Full overwrite dengan validasi (upsert nama/kode, cek relasi jika ada penghapusan).
 *      - Endpoint: POST /api/simpeg/unor/sync & GET /api/simpeg/unor/status
 *
 *   2. PEGAWAI:
 *      - Ditarik manual via tombol (/pegawai) atau otomatis via background Cron Job.
 *      - Full overwrite upsert berdasarkan NIP.
 *      - STRICT UNOR DEPENDENCY: Jika kode UNOR dari SIMPEG belum ada di lokal,
 *        pegawai tersebut di-SKIP dan dicatat di errors (tanpa auto-provisioning UNOR).
 *      - Endpoint: POST /api/simpeg/pegawai/sync & GET /api/simpeg/pegawai/status
 *
 *   3. PROVIDER:
 *      - Interface SimpegProvider menyediakan method fetchUnor() dan fetchPegawai().
 *      - Konfigurasi: SIMPEG_API_URL, SIMPEG_API_TOKEN, serta flag MOCK_SIMPEG=true.
 */

import { describe, it, expect, spyOn, beforeEach, mock } from 'bun:test';
import { app } from './index';
import { UserService } from './services/user.service';
import { UnorService } from './services/unor.service';
import { PegawaiService } from './services/pegawai.service';
import { SimpegSyncService } from './services/simpeg-sync.service';
import type { SimpegPegawaiItem, SimpegUnorItem, SyncResult } from './services/simpeg-sync.service';

// ---------------------------------------------------------------------------
// Fixtures & Helpers
// ---------------------------------------------------------------------------

const makePwdHash = async (pw: string) =>
  Bun.password.hash(pw, { algorithm: 'bcrypt', cost: 4 });

const setupUserMocks = async () => {
  const adminHash = await makePwdHash('admin123');
  const opdHash = await makePwdHash('opd12345');

  spyOn(UserService, 'getByUsername').mockImplementation(async (username: string) => {
    if (username === 'admin')
      return {
        id: 1,
        username: 'admin',
        passwordHash: adminHash,
        role: 'Admin' as const,
        kodeUnor: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    if (username === 'opd_user')
      return {
        id: 2,
        username: 'opd_user',
        passwordHash: opdHash,
        role: 'AdminOPD' as const,
        kodeUnor: 'UNOR-DINKES',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    return null;
  });
};

const loginAs = async (username: string, password: string): Promise<string> => {
  const res = await app.handle(
    new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
  );
  const data = await res.json();
  return data.token as string;
};

// Fixture Data SIMPEG
const simpegUnorList: SimpegUnorItem[] = [
  { kodeUnor: 'UNOR-DINKES', namaUnor: 'Dinas Kesehatan' },
  { kodeUnor: 'UNOR-BKPSDM', namaUnor: 'Badan Kepegawaian dan Pengembangan SDM' }
];

const simpegPegawaiList: SimpegPegawaiItem[] = [
  {
    nip: '198501012010011001',
    nama: 'Dr. Ahmad Fauzi, M.Kes',
    jabatan: 'Kepala Bidang Pelayanan Medis',
    kodeUnor: 'UNOR-DINKES',
    namaUnor: 'Dinas Kesehatan'
  },
  {
    nip: '199003032015031003',
    nama: 'Siti Rahmawati, S.AP',
    jabatan: 'Analis Kepegawaian',
    kodeUnor: 'UNOR-BKPSDM',
    namaUnor: 'Badan Kepegawaian dan Pengembangan SDM'
  }
];

// ---------------------------------------------------------------------------
// 1. UNIT TESTS: Sinkronisasi UNOR (SimpegSyncService.syncUnor)
// ---------------------------------------------------------------------------

describe('SimpegSyncService — Sinkronisasi UNOR', () => {
  it('berhasil melakukan upsert UNOR dari SIMPEG (update jika ada, insert jika baru)', async () => {
    // Arrange
    SimpegSyncService.setProvider({
      fetchUnor: mock(async () => [
        { kodeUnor: 'UNOR-DINKES', namaUnor: 'Dinas Kesehatan Baru' }, // update
        { kodeUnor: 'UNOR-BARU', namaUnor: 'Dinas Pendidikan' }        // insert
      ]),
      fetchPegawai: mock(async () => [])
    });

    spyOn(UnorService, 'getByKode').mockImplementation(async (kode: string) => {
      if (kode === 'UNOR-DINKES') {
        return { id: 1, kodeUnor: 'UNOR-DINKES', namaUnor: 'Dinas Kesehatan Lama' };
      }
      return null;
    });

    const updateSpy = spyOn(UnorService, 'update').mockResolvedValue({ success: true, message: 'OK' });
    updateSpy.mockClear();
    const createSpy = spyOn(UnorService, 'create').mockResolvedValue({ success: true, message: 'OK' });
    createSpy.mockClear();

    // Act
    const result: SyncResult = await SimpegSyncService.syncUnor();

    // Assert
    expect(result.success).toBe(true);
    expect(result.totalFetched).toBe(2);
    expect(result.totalUpserted).toBe(2);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith({
      kodeUnor: 'UNOR-BARU',
      namaUnor: 'Dinas Pendidikan'
    });
  });

  it('mencatat error bila data UNOR dari SIMPEG tidak memiliki kodeUnor atau namaUnor', async () => {
    // Arrange
    SimpegSyncService.setProvider({
      fetchUnor: mock(async () => [
        { kodeUnor: '', namaUnor: 'Dinas Tanpa Kode' },
        { kodeUnor: 'UNOR-VALID', namaUnor: '' }
      ]),
      fetchPegawai: mock(async () => [])
    });

    // Act
    const result = await SimpegSyncService.syncUnor();

    // Assert
    expect(result.success).toBe(false);
    expect(result.totalUpserted).toBe(0);
    expect(result.errors.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 2. UNIT TESTS: Sinkronisasi Pegawai (SimpegSyncService.syncPegawai)
// ---------------------------------------------------------------------------

describe('SimpegSyncService — Sinkronisasi Pegawai', () => {
  let updateSpy: any;
  let insertSpy: any;

  beforeEach(() => {
    updateSpy = spyOn(SimpegSyncService, 'updatePegawaiByNip').mockResolvedValue(undefined);
    updateSpy.mockClear();
    insertSpy = spyOn(SimpegSyncService, 'insertPegawai').mockResolvedValue(undefined);
    insertSpy.mockClear();
  });

  it('berhasil mengupdate pegawai jika UNOR sudah ada di lokal (Full Overwrite)', async () => {
    // Arrange
    SimpegSyncService.setProvider({
      fetchUnor: mock(async () => []),
      fetchPegawai: mock(async () => [simpegPegawaiList[0]])
    });

    // UNOR sudah terdaftar
    spyOn(UnorService, 'getByKode').mockResolvedValue({
      id: 1,
      kodeUnor: 'UNOR-DINKES',
      namaUnor: 'Dinas Kesehatan'
    });

    // Pegawai sudah ada (lakukan update)
    spyOn(PegawaiService, 'getByNip').mockResolvedValue({
      id: 10,
      nip: '198501012010011001',
      nama: 'Ahmad Fauzi Lama',
      jabatan: 'Staf',
      kodeUnor: 'UNOR-DINKES'
    });

    // Act
    const result = await SimpegSyncService.syncPegawai();

    // Assert
    expect(result.success).toBe(true);
    expect(result.totalFetched).toBe(1);
    expect(result.totalUpserted).toBe(1);
    expect(updateSpy).toHaveBeenCalledWith('198501012010011001', {
      nama: 'Dr. Ahmad Fauzi, M.Kes',
      jabatan: 'Kepala Bidang Pelayanan Medis',
      kodeUnor: 'UNOR-DINKES'
    });
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('SKIP pegawai bila kode UNOR belum ada di lokal & catat pesan informatif', async () => {
    // Arrange
    SimpegSyncService.setProvider({
      fetchUnor: mock(async () => []),
      fetchPegawai: mock(async () => [
        {
          nip: '199999999999999999',
          nama: 'Budi Tanpa Unor',
          jabatan: 'Staf',
          kodeUnor: 'UNOR-BELUM-ADA',
          namaUnor: 'Dinas Baru'
        }
      ])
    });

    // UNOR TIDAK ADA di database lokal
    spyOn(UnorService, 'getByKode').mockResolvedValue(null);

    // Act
    const result = await SimpegSyncService.syncPegawai();

    // Assert
    expect(result.totalFetched).toBe(1);
    expect(result.totalUpserted).toBe(0);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].identifier).toBe('199999999999999999');
    expect(result.errors[0].message).toMatch(/kode unor.*belum terdaftar|sinkronisasi unor/i);
    // Pastikan tidak ada insert/update pegawai yang dipanggil
    expect(updateSpy).not.toHaveBeenCalled();
    expect(insertSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 3. INTEGRATION TESTS: HTTP Endpoints Terpisah
// ---------------------------------------------------------------------------

describe('Simpeg Sync — HTTP Endpoints Terpisah', () => {
  let adminToken: string;
  let opdToken: string;

  beforeEach(async () => {
    await setupUserMocks();
    adminToken = await loginAs('admin', 'admin123');
    opdToken = await loginAs('opd_user', 'opd12345');
  });

  // ---- UNOR ENDPOINTS ----
  describe('UNOR Endpoints (/api/simpeg/unor/*)', () => {
    it('menolak akses AdminOPD pada trigger sinkronisasi UNOR (403)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/simpeg/unor/sync', {
          method: 'POST',
          headers: { Authorization: `Bearer ${opdToken}` }
        })
      );
      expect(res.status).toBe(403);
    });

    it('Admin Pusat berhasil memicu sinkronisasi UNOR (200)', async () => {
      spyOn(SimpegSyncService, 'syncUnor').mockResolvedValueOnce({
        success: true,
        target: 'unor',
        totalFetched: 5,
        totalUpserted: 5,
        errors: [],
        syncedAt: new Date()
      });

      const res = await app.handle(
        new Request('http://localhost/api/simpeg/unor/sync', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.target).toBe('unor');
      expect(body.data.totalUpserted).toBe(5);
    });

    it('Admin Pusat dapat mengambil status sinkronisasi UNOR terakhir (200)', async () => {
      spyOn(SimpegSyncService, 'getLastUnorSyncStatus').mockResolvedValueOnce({
        success: true,
        target: 'unor',
        totalFetched: 10,
        totalUpserted: 10,
        errors: [],
        syncedAt: new Date()
      });

      const res = await app.handle(
        new Request('http://localhost/api/simpeg/unor/status', {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.target).toBe('unor');
    });
  });

  // ---- PEGAWAI ENDPOINTS ----
  describe('Pegawai Endpoints (/api/simpeg/pegawai/*)', () => {
    it('menolak akses AdminOPD pada trigger sinkronisasi Pegawai (403)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/simpeg/pegawai/sync', {
          method: 'POST',
          headers: { Authorization: `Bearer ${opdToken}` }
        })
      );
      expect(res.status).toBe(403);
    });

    it('Admin Pusat berhasil memicu sinkronisasi Pegawai (200)', async () => {
      spyOn(SimpegSyncService, 'syncPegawai').mockResolvedValueOnce({
        success: true,
        target: 'pegawai',
        totalFetched: 15,
        totalUpserted: 15,
        errors: [],
        syncedAt: new Date()
      });

      const res = await app.handle(
        new Request('http://localhost/api/simpeg/pegawai/sync', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.target).toBe('pegawai');
      expect(body.data.totalUpserted).toBe(15);
    });

    it('Admin Pusat dapat mengambil status sinkronisasi Pegawai terakhir (200)', async () => {
      spyOn(SimpegSyncService, 'getLastPegawaiSyncStatus').mockResolvedValueOnce({
        success: true,
        target: 'pegawai',
        totalFetched: 20,
        totalUpserted: 20,
        errors: [],
        syncedAt: new Date()
      });

      const res = await app.handle(
        new Request('http://localhost/api/simpeg/pegawai/status', {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.target).toBe('pegawai');
    });
  });
});

// ---------------------------------------------------------------------------
// 4. UNIT TESTS: SimpegProvider (Mock vs HTTP)
// ---------------------------------------------------------------------------

describe('SimpegProvider — Mock vs HTTP', () => {
  it('MockSimpegProvider menyediakan data mock untuk UNOR dan Pegawai', async () => {
    const { MockSimpegProvider } = await import('./services/simpeg-providers/mock.provider');
    const provider = new MockSimpegProvider();

    const unorData = await provider.fetchUnor();
    const pegawaiData = await provider.fetchPegawai();

    expect(unorData.length).toBeGreaterThan(0);
    expect(pegawaiData.length).toBeGreaterThan(0);
    expect(unorData[0]).toHaveProperty('kodeUnor');
    expect(unorData[0]).toHaveProperty('namaUnor');
    expect(pegawaiData[0]).toHaveProperty('nip');
  });

  it('HttpSimpegProvider memanggil endpoint yang sesuai (/unor dan /pegawai)', async () => {
    const { HttpSimpegProvider } = await import('./services/simpeg-providers/http.provider');

    const urlsCalled: string[] = [];
    global.fetch = mock(async (url: string | URL | Request) => {
      urlsCalled.push(String(url));
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as any;

    const provider = new HttpSimpegProvider({
      baseUrl: 'https://simpeg.example.go.id/api',
      apiToken: 'Bearer token-123'
    });

    await provider.fetchUnor();
    await provider.fetchPegawai();

    expect(urlsCalled).toHaveLength(2);
    expect(urlsCalled[0]).toBe('https://simpeg.example.go.id/api/unor');
    expect(urlsCalled[1]).toContain('https://simpeg.example.go.id/api/pegawai');
  });
});


// ---------------------------------------------------------------------------
// 5. UNIT TESTS: Trenggalek SIMPEG Real API Schema & Basic Auth Mapping
// ---------------------------------------------------------------------------

describe('HttpSimpegProvider — Trenggalek API Schema & Basic Auth', () => {
  it('menghasilkan header Basic Auth yang valid untuk user_tes:password_tes', async () => {
    const { HttpSimpegProvider } = await import('./services/simpeg-providers/http.provider');

    let capturedHeaders: any = null;
    global.fetch = mock(async (_url, init) => {
      capturedHeaders = init?.headers;
      return new Response(JSON.stringify({ count: 0, result: [] }), { status: 200 });
    }) as any;

    const provider = new HttpSimpegProvider({
      unorUrl: 'https://bkdtrenggalek.net/api_tes/unit_kerja',
      authUser: 'user_tes',
      authPass: 'password_tes'
    });

    await provider.fetchUnor();

    const expectedBasic = 'Basic ' + Buffer.from('user_tes:password_tes').toString('base64');
    expect(capturedHeaders.Authorization).toBe(expectedBasic);
  });

  it('memetakan format response unit_kerja (id & nama) ke SimpegUnorItem', async () => {
    const { HttpSimpegProvider } = await import('./services/simpeg-providers/http.provider');

    global.fetch = mock(async () => {
      return new Response(
        JSON.stringify({
          count: 2,
          result: [
            { id: '0100000000', nama: 'SEKRETARIAT DAERAH' },
            { id: '1000000000', nama: 'DINAS PENDIDIKAN' }
          ]
        }),
        { status: 200 }
      );
    }) as any;

    const provider = new HttpSimpegProvider({
      unorUrl: 'https://bkdtrenggalek.net/api_tes/unit_kerja'
    });

    const items = await provider.fetchUnor();
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      kodeUnor: '0100000000',
      namaUnor: 'SEKRETARIAT DAERAH'
    });
    expect(items[1]).toEqual({
      kodeUnor: '1000000000',
      namaUnor: 'DINAS PENDIDIKAN'
    });
  });

  it('memetakan format response pegawai (nip, nama_lengkap, gelar, unit_kerja_id) ke SimpegPegawaiItem', async () => {
    const { HttpSimpegProvider } = await import('./services/simpeg-providers/http.provider');

    global.fetch = mock(async () => {
      return new Response(
        JSON.stringify({
          count: 1,
          result: [
            {
              id: '1010151800',
              nip: '196809211997022002',
              nama_lengkap: 'NANIK SUPRAPTI',
              gelar_depan: 'Dra.',
              gelar_belakang: 'M.Pd',
              unit_kerja_id: '1000000000',
              jabatan: 'Guru Mapel Bahasa Inggris...',
              jabatan_nama: 'Guru Madya'
            }
          ]
        }),
        { status: 200 }
      );
    }) as any;

    const provider = new HttpSimpegProvider({
      pegawaiUrl: 'https://bkdtrenggalek.net/api_tes/pegawai'
    });

    const items = await provider.fetchPegawai();
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      nip: '196809211997022002',
      nama: 'Dra. NANIK SUPRAPTI M.Pd',
      jabatan: 'Guru Madya',
      kodeUnor: '1000000000'
    });
  });
});

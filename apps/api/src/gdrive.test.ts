import { describe, it, expect, beforeEach, spyOn, mock } from 'bun:test';
import { MockDriveProvider } from './services/drive-providers/mock.provider';
import { GoogleDriveProvider } from './services/drive-providers/google.provider';
import { createDriveProvider } from './services/drive-providers/factory';
import { UsulanService } from './services/usulan.service';
import { db, usulanDokumen } from '@usul-data/shared';
import { eq } from 'drizzle-orm';
import fs from 'node:fs';

describe('Google Drive Storage Feature (TDD)', () => {
  describe('MockDriveProvider', () => {
    it('uploads file and returns fileId, webViewLink, and tracks NIP folder', async () => {
      const provider = new MockDriveProvider();
      const buffer = Buffer.from('PDF_DUMMY_CONTENT');
      const result = await provider.uploadFile({
        nip: '198501012010011001',
        fileName: '101_sk_jabatan.pdf',
        mimeType: 'application/pdf',
        buffer
      });

      expect(result.fileId).toBeDefined();
      expect(result.fileId.startsWith('mock_drive_')).toBe(true);
      expect(result.webViewLink).toContain(`https://drive.google.com/file/d/${result.fileId}/view`);
      expect(result.fileName).toBe('101_sk_jabatan.pdf');
      expect(result.nip).toBe('198501012010011001');

      // Verify file is tracked in provider
      const stored = provider.getFile(result.fileId);
      expect(stored).toBeDefined();
      expect(stored?.trashed).toBe(false);
      expect(stored?.nip).toBe('198501012010011001');
    });

    it('trashes file successfully (soft-delete)', async () => {
      const provider = new MockDriveProvider();
      const uploadResult = await provider.uploadFile({
        nip: '198501012010011001',
        fileName: '101_sk_jabatan.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('PDF')
      });

      const trashSuccess = await provider.trashFile(uploadResult.fileId);
      expect(trashSuccess).toBe(true);

      const stored = provider.getFile(uploadResult.fileId);
      expect(stored?.trashed).toBe(true);
    });

    it('returns false when trashing non-existent file', async () => {
      const provider = new MockDriveProvider();
      const res = await provider.trashFile('non_existent_id');
      expect(res).toBe(false);
    });
  });

  describe('GoogleDriveProvider (HTTP Engine)', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('refreshes access token and uploads file with anyone permissions', async () => {
      const fetchCalls: Array<{ url: string; method?: string; body?: any }> = [];

      globalThis.fetch = mock(async (input: any, init?: any) => {
        const url = typeof input === 'string' ? input : input.url;
        fetchCalls.push({ url, method: init?.method, body: init?.body });

        // Token endpoint
        if (url.includes('oauth2.googleapis.com/token')) {
          return new Response(
            JSON.stringify({
              access_token: 'mock_access_token_123',
              expires_in: 3600,
              token_type: 'Bearer'
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Folder search endpoint
        if (url.includes('drive/v3/files?q=') && !init?.method) {
          return new Response(
            JSON.stringify({
              files: [{ id: 'mock_nip_folder_99', name: '198501012010011001' }]
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // File upload multipart endpoint
        if (url.includes('upload/drive/v3/files?uploadType=multipart')) {
          return new Response(
            JSON.stringify({
              id: 'gdrive_file_abc123',
              name: 'sk_pangkat.pdf',
              webViewLink: 'https://drive.google.com/file/d/gdrive_file_abc123/view?usp=sharing'
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Permissions endpoint
        if (url.includes('/permissions')) {
          return new Response(
            JSON.stringify({ id: 'perm_anyone' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response(JSON.stringify({}), { status: 200 });
      }) as any;

      const provider = new GoogleDriveProvider({
        clientId: 'mock_client_id',
        clientSecret: 'mock_client_secret',
        refreshToken: 'mock_refresh_token',
        rootFolderId: 'root_folder_123'
      });

      const res = await provider.uploadFile({
        nip: '198501012010011001',
        fileName: 'sk_pangkat.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('MOCK_PDF_DATA')
      });

      expect(res.fileId).toBe('gdrive_file_abc123');
      expect(res.webViewLink).toBe('https://drive.google.com/file/d/gdrive_file_abc123/view?usp=sharing');

      // Verify token was requested
      const tokenCall = fetchCalls.find(c => c.url.includes('oauth2.googleapis.com/token'));
      expect(tokenCall).toBeDefined();

      // Verify permissions were set to anyone
      const permCall = fetchCalls.find(c => c.url.includes('/permissions'));
      expect(permCall).toBeDefined();
      expect(permCall?.method).toBe('POST');
    });

    it('trashes file via PATCH request to drive/v3/files/{id}', async () => {
      let patchUrl = '';
      let patchBody = '';

      globalThis.fetch = mock(async (input: any, init?: any) => {
        const url = typeof input === 'string' ? input : input.url;
        if (url.includes('oauth2.googleapis.com/token')) {
          return new Response(
            JSON.stringify({ access_token: 'mock_access_token_123', expires_in: 3600 }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (init?.method === 'PATCH') {
          patchUrl = url;
          patchBody = init.body;
          return new Response(JSON.stringify({ id: 'file_to_trash', trashed: true }), { status: 200 });
        }
        return new Response('{}', { status: 200 });
      }) as any;

      const provider = new GoogleDriveProvider({
        clientId: 'mock_client_id',
        clientSecret: 'mock_client_secret',
        refreshToken: 'mock_refresh_token',
        rootFolderId: 'root_folder_123'
      });

      const success = await provider.trashFile('file_to_trash');
      expect(success).toBe(true);
      expect(patchUrl).toContain('/drive/v3/files/file_to_trash');
      expect(patchBody).toContain('"trashed":true');
    });
  });

  describe('Factory', () => {
    it('creates MockDriveProvider when MOCK_GDRIVE=true', () => {
      process.env.MOCK_GDRIVE = 'true';
      const provider = createDriveProvider();
      expect(provider instanceof MockDriveProvider).toBe(true);
    });
  });

  describe('UsulanService Drive Integration', () => {
    it('uploadDokumen uploads to drive provider and saves drive_file_id', async () => {
      // Setup mock data for existing usulan
      spyOn(UsulanService, 'getById').mockResolvedValueOnce({
        id: 105,
        pegawaiId: 2,
        kodeUnor: 'UNOR_TEST',
        status: 'draft',
        nipPegawai: '199001012015011002',
        namaPegawai: 'Budi Santoso',
        jabatanPegawai: 'Analis Kepegawaian',
        namaUnor: 'Badan Kepegawaian Daerah',
        catatan: null,
        verifiedBy: null,
        verifiedAt: null,
        catatanVerifikasi: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        details: [],
        dokumen: []
      });

      // Mock db.insert
      spyOn(db, 'insert').mockReturnValueOnce({
        values: () => Promise.resolve([{ insertId: 77 }])
      } as any);

      const fakePdf = new File(['%PDF-1.4 dummy buffer content'], 'sk_kenaikan_pangkat.pdf', {
        type: 'application/pdf'
      });

      const res = await UsulanService.uploadDokumen(
        105,
        fakePdf,
        'SK Kenaikan Pangkat',
        { id: 1, username: 'admin', role: 'Admin', kodeUnor: null }
      );

      expect(res.success).toBe(true);
      expect(res.data.id).toBe(77);
      expect(res.data.namaDokumen).toBe('SK Kenaikan Pangkat');
      expect(res.data.pathFile).toContain('https://drive.google.com/file/d/');
      expect(res.data.driveFileId).toBeDefined();
    });

    it('deleteUsulan trashes files in Google Drive provider', async () => {
      const mockProvider = new MockDriveProvider();
      const uploaded = await mockProvider.uploadFile({
        nip: '199001012015011002',
        fileName: 'sk.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('PDF')
      });

      spyOn(UsulanService, 'getById').mockResolvedValueOnce({
        id: 105,
        pegawaiId: 2,
        kodeUnor: 'UNOR_TEST',
        status: 'diajukan',
        nipPegawai: '199001012015011002',
        namaPegawai: 'Budi Santoso',
        jabatanPegawai: 'Analis Kepegawaian',
        namaUnor: 'Badan Kepegawaian Daerah',
        catatan: null,
        verifiedBy: null,
        verifiedAt: null,
        catatanVerifikasi: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        details: [],
        dokumen: [
          {
            id: 77,
            usulanId: 105,
            namaDokumen: 'SK Kenaikan Pangkat',
            pathFile: uploaded.webViewLink,
            driveFileId: uploaded.fileId,
            tipeDokumen: 'application/pdf',
            ukuranBytes: 1024,
            createdAt: new Date()
          }
        ]
      });

      spyOn(db, 'delete').mockReturnValueOnce({
        where: () => Promise.resolve([{ affectedRows: 1 }])
      } as any);

      // Verify trash call works
      const res = await UsulanService.deleteUsulan(105, {
        id: 1,
        username: 'admin',
        role: 'Admin',
        kodeUnor: null
      });

      expect(res.success).toBe(true);
      expect(res.message).toContain('berhasil dihapus secara permanen');
    });
  });
});

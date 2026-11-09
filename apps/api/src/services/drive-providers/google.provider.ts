import type { DriveStorageProvider, UploadFileOptions, UploadFileResult } from './provider.interface';

export interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  rootFolderId: string;
}

export class GoogleDriveProvider implements DriveStorageProvider {
  private config: GoogleDriveConfig;
  private cachedAccessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private folderCache: Map<string, string> = new Map();

  constructor(config: GoogleDriveConfig) {
    this.config = config;
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedAccessToken && this.tokenExpiresAt > now) {
      return this.cachedAccessToken;
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gagal memperbarui token Google Drive: ${res.status} ${errText}`);
    }

    const data = (await res.json()) as { access_token: string; expires_in?: number };
    this.cachedAccessToken = data.access_token;
    const expiresInSec = data.expires_in ?? 3600;
    this.tokenExpiresAt = now + (expiresInSec - 60) * 1000;

    return this.cachedAccessToken;
  }

  async getOrCreateNipFolder(nip: string, accessToken: string): Promise<string> {
    if (this.folderCache.has(nip)) {
      return this.folderCache.get(nip)!;
    }

    const rootParent = this.config.rootFolderId || 'root';
    const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${nip}' and '${rootParent}' in parents and trashed = false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;

    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (searchRes.ok) {
      const data = (await searchRes.json()) as { files?: Array<{ id: string; name: string }> };
      if (data.files && data.files.length > 0) {
        const folderId = data.files[0].id;
        this.folderCache.set(nip, folderId);
        return folderId;
      }
    }

    // Jika belum ada, buat folder baru untuk NIP pegawai
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: nip,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootParent]
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Gagal membuat folder NIP di Google Drive: ${createRes.status} ${errText}`);
    }

    const newFolder = (await createRes.json()) as { id: string };
    this.folderCache.set(nip, newFolder.id);
    return newFolder.id;
  }

  async uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
    const accessToken = await this.getAccessToken();
    const folderId = await this.getOrCreateNipFolder(options.nip, accessToken);

    const boundary = `-------GoogleDriveMultipartBoundary${Date.now()}`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: options.fileName,
      parents: [folderId]
    };

    const multipartHeader =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${options.mimeType}\r\n\r\n`;

    const headerBuffer = Buffer.from(multipartHeader, 'utf-8');
    const footerBuffer = Buffer.from(closeDelimiter, 'utf-8');
    const multipartBody = Buffer.concat([headerBuffer, options.buffer, footerBuffer]);

    const uploadUrl =
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink';

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': multipartBody.length.toString()
      },
      body: multipartBody
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Gagal mengunggah berkas ke Google Drive: ${uploadRes.status} ${errText}`);
    }

    const uploaded = (await uploadRes.json()) as { id: string; name?: string; webViewLink?: string };
    const fileId = uploaded.id;
    const webViewLink =
      uploaded.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

    // Berikan izin Anyone with link can view (public read)
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });
    } catch (e) {
      console.warn(`Peringatan: Gagal menyetel izin publik berkas Drive ${fileId}:`, e);
    }

    return {
      fileId,
      webViewLink,
      fileName: options.fileName,
      nip: options.nip
    };
  }

  async trashFile(fileId: string): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trashed: true
      })
    });

    if (!res.ok) {
      console.error(`Gagal memindahkan berkas Google Drive ${fileId} ke sampah:`, await res.text());
      return false;
    }

    return true;
  }
}

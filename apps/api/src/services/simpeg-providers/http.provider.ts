import type { SimpegProvider, SimpegUnorItem, SimpegPegawaiItem } from './provider.interface';

export interface HttpSimpegProviderOptions {
  baseUrl?: string;
  unorUrl?: string;
  pegawaiUrl?: string;
  authUser?: string;
  authPass?: string;
  apiToken?: string;
}

export class HttpSimpegProvider implements SimpegProvider {
  private unorUrl: string;
  private pegawaiUrl: string;
  private authHeader: string;

  constructor(options?: HttpSimpegProviderOptions) {
    const baseUrl = options?.baseUrl?.replace(/\/$/, '');
    
    this.unorUrl =
      options?.unorUrl ||
      (baseUrl ? `${baseUrl}/unor` : process.env.SIMPEG_UNOR_URL || 'https://bkdtrenggalek.net/api_tes/unit_kerja');

    this.pegawaiUrl =
      options?.pegawaiUrl ||
      (baseUrl ? `${baseUrl}/pegawai` : process.env.SIMPEG_PEGAWAI_URL || 'https://bkdtrenggalek.net/api_tes/pegawai');

    const authUser = options?.authUser || process.env.SIMPEG_AUTH_USER;
    const authPass = options?.authPass || process.env.SIMPEG_AUTH_PASS;

    if (authUser && authPass) {
      this.authHeader = `Basic ${Buffer.from(`${authUser}:${authPass}`).toString('base64')}`;
    } else if (options?.apiToken) {
      const token = options.apiToken;
      this.authHeader = token.startsWith('Bearer ') || token.startsWith('Basic ') ? token : `Bearer ${token}`;
    } else {
      // Default fallback jika tidak ada config env: user_tes & password_tes
      this.authHeader = `Basic ${Buffer.from('user_tes:password_tes').toString('base64')}`;
    }
  }

  async fetchUnor(): Promise<SimpegUnorItem[]> {
    const res = await fetch(this.unorUrl, {
      method: 'GET',
      headers: {
        Authorization: this.authHeader,
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Gagal mengambil data UNOR dari SIMPEG: HTTP ${res.status} ${res.statusText}`);
    }

    const json: any = await res.json();
    const rawList: any[] = Array.isArray(json) ? json : (json.result ?? json.data ?? []);

    return rawList.map((item) => ({
      kodeUnor: String(item.id ?? item.kodeUnor ?? item.kode ?? '').trim(),
      namaUnor: String(item.nama ?? item.namaUnor ?? item.nama_unor ?? '').trim()
    }));
  }

  async fetchPegawai(options?: { offset?: number; limit?: number }): Promise<SimpegPegawaiItem[]> {
    let url = this.pegawaiUrl;
    const params = new URLSearchParams();
    if (options?.offset !== undefined) params.set('offset', String(options.offset));
    if (options?.limit !== undefined) params.set('limit', String(options.limit));

    const queryString = params.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: this.authHeader,
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Gagal mengambil data Pegawai dari SIMPEG: HTTP ${res.status} ${res.statusText}`);
    }

    const json: any = await res.json();
    const rawList: any[] = Array.isArray(json) ? json : (json.result ?? json.data ?? []);

    return rawList.map((item) => {
      // Format nama lengkap dengan gelar jika tersedia
      let nama = item.nama ?? item.nama_lengkap ?? '';
      if (item.nama_lengkap) {
        const parts = [item.gelar_depan, item.nama_lengkap, item.gelar_belakang]
          .filter(Boolean)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
        if (parts.length > 0) {
          nama = parts.join(' ');
        }
      }

      const jabatan = String(item.jabatan_nama || item.jabatan || '').trim();
      const kodeUnor = String(item.unit_kerja_id || item.kodeUnor || item.kode_unor || '').trim();
      const namaUnor = item.unit_kerja_nama || item.namaUnor || item.nama_unor;

      return {
        nip: String(item.nip ?? '').trim(),
        nama: String(nama).trim(),
        jabatan,
        kodeUnor,
        ...(namaUnor ? { namaUnor: String(namaUnor).trim() } : {})
      };
    });
  }
}


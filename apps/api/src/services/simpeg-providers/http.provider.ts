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

    const mapped = rawList.map((item) => ({
      kodeUnor: String(item.id ?? item.kodeUnor ?? item.kode ?? '').trim(),
      namaUnor: String(item.nama ?? item.namaUnor ?? item.nama_unor ?? '').trim()
    }));

    // Filter khusus: jika kode 10 digit (skema SIMPEG), hanya ambil unit induk (akhiran 00000000)
    return mapped.filter((item) => {
      if (!item.kodeUnor) return false;
      if (item.kodeUnor.length === 10) {
        return item.kodeUnor.endsWith('00000000');
      }
      return true;
    });
  }

  private mapPegawaiItems(rawList: any[]): SimpegPegawaiItem[] {
    return rawList.map((item) => {
      let nama = item.nama ?? item.nama_lengkap ?? '';
      if (item.nama_lengkap) {
        const parts = [item.gelar_depan, item.nama_lengkap, item.gelar_belakang]
          .filter(Boolean)
          .map((s: string) => String(s).trim())
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

  async fetchPegawai(options?: { offset?: number; limit?: number }): Promise<SimpegPegawaiItem[]> {
    // 1. Single Page Fetch jika limit ditentukan secara eksplisit
    if (options?.limit !== undefined) {
      let url = this.pegawaiUrl;
      const params = new URLSearchParams();
      if (options?.offset !== undefined) params.set('offset', String(options.offset));
      params.set('limit', String(options.limit));

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
      return this.mapPegawaiItems(rawList);
    }

    // 2. Auto-Pagination Loop jika limit tidak ditentukan (Tarik seluruh data secara tuntas)
    const batchSize = 2000;
    let offset = options?.offset ?? 0;
    const allRawItems: any[] = [];

    while (true) {
      let url = this.pegawaiUrl;
      const params = new URLSearchParams();
      params.set('offset', String(offset));
      params.set('limit', String(batchSize));
      url += (url.includes('?') ? '&' : '?') + params.toString();

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
      allRawItems.push(...rawList);

      const totalCount = typeof json.count === 'number' ? json.count : rawList.length;
      if (rawList.length === 0 || allRawItems.length >= totalCount || !json.count) {
        break;
      }
      offset += batchSize;
    }

    return this.mapPegawaiItems(allRawItems);
  }
}

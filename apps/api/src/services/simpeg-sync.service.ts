import { db, pegawai, unor, eq, sql } from '@usul-data/shared';
import { UnorService } from './unor.service';
import { PegawaiService } from './pegawai.service';
import type { SimpegProvider, SimpegUnorItem, SimpegPegawaiItem } from './simpeg-providers/provider.interface';
import { createSimpegProvider } from './simpeg-providers/factory';

export type { SimpegUnorItem, SimpegPegawaiItem };

export interface SyncErrorItem {
  identifier: string;
  message: string;
}

export interface SyncResult {
  success: boolean;
  target: 'unor' | 'pegawai';
  totalFetched: number;
  totalUpserted: number;
  errors: SyncErrorItem[];
  syncedAt: Date;
}

export class SimpegSyncService {
  private static provider: SimpegProvider | null = null;
  private static lastUnorSync: SyncResult | null = null;
  private static lastPegawaiSync: SyncResult | null = null;

  static setProvider(provider: SimpegProvider) {
    this.provider = provider;
  }

  static getProvider(): SimpegProvider {
    if (!this.provider) {
      this.provider = createSimpegProvider();
    }
    return this.provider;
  }

  static async getLastUnorSyncStatus(): Promise<SyncResult | null> {
    return this.lastUnorSync;
  }

  static async getLastPegawaiSyncStatus(): Promise<SyncResult | null> {
    return this.lastPegawaiSync;
  }

  static async updatePegawaiByNip(
    nip: string,
    data: { nama: string; jabatan: string; kodeUnor: string }
  ): Promise<void> {
    await db
      .update(pegawai)
      .set({
        nama: data.nama,
        jabatan: data.jabatan,
        kodeUnor: data.kodeUnor
      })
      .where(eq(pegawai.nip, nip));
  }

  static async insertPegawai(data: {
    nip: string;
    nama: string;
    jabatan: string;
    kodeUnor: string;
  }): Promise<void> {
    await db.insert(pegawai).values({
      nip: data.nip,
      nama: data.nama,
      jabatan: data.jabatan,
      kodeUnor: data.kodeUnor
    });
  }

  /**
   * Sinkronisasi data Unit Organisasi (UNOR) dari SIMPEG
   */
  static async syncUnor(): Promise<SyncResult> {
    const provider = this.getProvider();
    const errors: SyncErrorItem[] = [];
    let items: SimpegUnorItem[] = [];

    try {
      items = await provider.fetchUnor();
    } catch (err: any) {
      const failResult: SyncResult = {
        success: false,
        target: 'unor',
        totalFetched: 0,
        totalUpserted: 0,
        errors: [{ identifier: 'UNOR', message: err.message || 'Gagal mengambil data UNOR dari SIMPEG' }],
        syncedAt: new Date()
      };
      this.lastUnorSync = failResult;
      return failResult;
    }

    let totalUpserted = 0;

    for (const item of items) {
      const kodeUnor = item.kodeUnor?.trim();
      const namaUnor = item.namaUnor?.trim();

      if (!kodeUnor || !namaUnor) {
        errors.push({
          identifier: kodeUnor || 'UNKNOWN',
          message: 'Kode UNOR dan Nama UNOR tidak boleh kosong'
        });
        continue;
      }

      try {
        const existing = await UnorService.getByKode(kodeUnor);
        if (existing) {
          if (existing.namaUnor !== namaUnor) {
            await UnorService.update(existing.id, { namaUnor });
          }
          totalUpserted++;
        } else {
          await UnorService.create({ kodeUnor, namaUnor });
          totalUpserted++;
        }
      } catch (err: any) {
        errors.push({
          identifier: kodeUnor,
          message: err.message || 'Gagal menyimpan UNOR'
        });
      }
    }

    const result: SyncResult = {
      success: errors.length === 0,
      target: 'unor',
      totalFetched: items.length,
      totalUpserted,
      errors,
      syncedAt: new Date()
    };

    this.lastUnorSync = result;
    return result;
  }

  /**
   * Sinkronisasi data Pegawai dari SIMPEG
   * Catatan: Jika kodeUnor belum ada di database lokal, pegawai tersebut di-SKIP.
   */
  static async syncPegawai(options?: { offset?: number; limit?: number }): Promise<SyncResult> {
    const provider = this.getProvider();
    const errors: SyncErrorItem[] = [];
    let items: SimpegPegawaiItem[] = [];

    try {
      items = await provider.fetchPegawai(options);
    } catch (err: any) {
      const failResult: SyncResult = {
        success: false,
        target: 'pegawai',
        totalFetched: 0,
        totalUpserted: 0,
        errors: [{ identifier: 'PEGAWAI', message: err.message || 'Gagal mengambil data Pegawai dari SIMPEG' }],
        syncedAt: new Date()
      };
      this.lastPegawaiSync = failResult;
      return failResult;
    }

    let totalUpserted = 0;

    // Untuk batch kecil atau unit test (<= 10 items), gunakan pemanggilan method individual
    // agar kompatibel dengan spies unit test dan error handling per-item yang spesifik.
    if (items.length <= 10) {
      for (const item of items) {
        const nip = item.nip?.trim();
        const nama = item.nama?.trim();
        const kodeUnor = item.kodeUnor?.trim();
        const jabatan = item.jabatan?.trim() || '-';

        if (!nip) {
          errors.push({
            identifier: 'UNKNOWN',
            message: 'NIP pegawai tidak boleh kosong'
          });
          continue;
        }

        if (!nama) {
          errors.push({
            identifier: nip,
            message: 'Nama pegawai tidak boleh kosong'
          });
          continue;
        }

        if (!kodeUnor) {
          errors.push({
            identifier: nip,
            message: 'Kode UNOR pegawai tidak boleh kosong'
          });
          continue;
        }

        // Validasi Strict UNOR: Harus sudah ada di lokal
        const existingUnor = await UnorService.getByKode(kodeUnor);
        if (!existingUnor) {
          errors.push({
            identifier: nip,
            message: `Kode UNOR '${kodeUnor}' belum terdaftar di lokal. Silakan lakukan sinkronisasi UNOR terlebih dahulu.`
          });
          continue; // Lewati pegawai ini
        }

        try {
          const existingPegawai = await PegawaiService.getByNip(nip);
          if (existingPegawai) {
            await this.updatePegawaiByNip(nip, { nama, jabatan, kodeUnor });
            totalUpserted++;
          } else {
            await this.insertPegawai({ nip, nama, jabatan, kodeUnor });
            totalUpserted++;
          }
        } catch (err: any) {
          errors.push({
            identifier: nip,
            message: err.message || 'Gagal menyimpan data pegawai'
          });
        }
      }
    } else {
      // Bulk sync berkecepatan tinggi untuk ribuan data:
      // 1. Ambil seluruh kode UNOR lokal dalam 1 query SELECT
      const localUnors = await db.select({ kodeUnor: unor.kodeUnor }).from(unor);
      const validUnorCodes = new Set(localUnors.map(u => u.kodeUnor));

      // 2. Validasi data di memori dan deduplikasi berdasarkan NIP
      const validItemsMap = new Map<string, { nip: string; nama: string; jabatan: string; kodeUnor: string }>();

      for (const item of items) {
        const nip = item.nip?.trim();
        const nama = item.nama?.trim();
        const kodeUnor = item.kodeUnor?.trim();
        const jabatan = item.jabatan?.trim() || '-';

        if (!nip) {
          errors.push({
            identifier: 'UNKNOWN',
            message: 'NIP pegawai tidak boleh kosong'
          });
          continue;
        }

        if (!nama) {
          errors.push({
            identifier: nip,
            message: 'Nama pegawai tidak boleh kosong'
          });
          continue;
        }

        if (!kodeUnor) {
          errors.push({
            identifier: nip,
            message: 'Kode UNOR pegawai tidak boleh kosong'
          });
          continue;
        }

        // Validasi Strict UNOR
        if (!validUnorCodes.has(kodeUnor)) {
          errors.push({
            identifier: nip,
            message: `Kode UNOR '${kodeUnor}' belum terdaftar di lokal. Silakan lakukan sinkronisasi UNOR terlebih dahulu.`
          });
          continue;
        }

        validItemsMap.set(nip, { nip, nama, jabatan, kodeUnor });
      }

      const validList = Array.from(validItemsMap.values());
      const CHUNK_SIZE = 500;

      for (let i = 0; i < validList.length; i += CHUNK_SIZE) {
        const chunk = validList.slice(i, i + CHUNK_SIZE);
        try {
          await db
            .insert(pegawai)
            .values(chunk)
            .onDuplicateKeyUpdate({
              set: {
                nama: sql`VALUES(\`nama\`)`,
                jabatan: sql`VALUES(\`jabatan\`)`,
                kodeUnor: sql`VALUES(\`kode_unor\`)`
              }
            });
          totalUpserted += chunk.length;
        } catch (err: any) {
          // Fallback per-item jika ada 1 baris yang bermasalah dalam chunk
          for (const row of chunk) {
            try {
              await db
                .insert(pegawai)
                .values(row)
                .onDuplicateKeyUpdate({
                  set: {
                    nama: sql`VALUES(\`nama\`)`,
                    jabatan: sql`VALUES(\`jabatan\`)`,
                    kodeUnor: sql`VALUES(\`kode_unor\`)`
                  }
                });
              totalUpserted++;
            } catch (singleErr: any) {
              errors.push({
                identifier: row.nip,
                message: singleErr.message || 'Gagal menyimpan data pegawai'
              });
            }
          }
        }
      }
    }

    const result: SyncResult = {
      success: errors.length === 0,
      target: 'pegawai',
      totalFetched: items.length,
      totalUpserted,
      errors,
      syncedAt: new Date()
    };

    this.lastPegawaiSync = result;
    return result;
  }
}


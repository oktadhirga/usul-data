import { db, pegawai, unor, eq, and, or, like, type Pegawai, type NewPegawai, type PegawaiWithUnor } from '@usul-data/shared';
import type { AuthUser } from '../middleware/auth';
import { UnorService } from './unor.service';

export interface PegawaiFilterParams {
  kodeUnor?: string | null;
  search?: string | null;
  scopeUnor?: string | null;
}

export class PegawaiService {
  static async getAll(params: PegawaiFilterParams): Promise<PegawaiWithUnor[]> {
    // Penegakan scope: Jika scopeUnor ada (AdminOPD), paksa filter ke kodeUnor milik user
    const effectiveKodeUnor = params.scopeUnor || params.kodeUnor || null;

    const conditions = [];

    if (effectiveKodeUnor) {
      conditions.push(eq(pegawai.kodeUnor, effectiveKodeUnor));
    }

    if (params.search && params.search.trim()) {
      const searchPattern = `%${params.search.trim()}%`;
      conditions.push(
        or(
          like(pegawai.nama, searchPattern),
          like(pegawai.nip, searchPattern),
          like(pegawai.jabatan, searchPattern)
        )
      );
    }

    let query = db
      .select({
        id: pegawai.id,
        nip: pegawai.nip,
        nama: pegawai.nama,
        jabatan: pegawai.jabatan,
        kodeUnor: pegawai.kodeUnor,
        namaUnor: unor.namaUnor
      })
      .from(pegawai)
      .leftJoin(unor, eq(pegawai.kodeUnor, unor.kodeUnor));

    if (conditions.length === 1) {
      return await query.where(conditions[0]);
    } else if (conditions.length > 1) {
      return await query.where(and(...conditions));
    }

    return await query;
  }

  static async getById(id: number, scopeUnor?: string | null): Promise<PegawaiWithUnor | null> {
    const results = await db
      .select({
        id: pegawai.id,
        nip: pegawai.nip,
        nama: pegawai.nama,
        jabatan: pegawai.jabatan,
        kodeUnor: pegawai.kodeUnor,
        namaUnor: unor.namaUnor
      })
      .from(pegawai)
      .leftJoin(unor, eq(pegawai.kodeUnor, unor.kodeUnor))
      .where(eq(pegawai.id, id))
      .limit(1);

    const record = results[0] ?? null;
    if (!record) {
      return null;
    }

    // Jika user adalah AdminOPD, periksa apakah pegawai berada dalam unor user
    if (scopeUnor && record.kodeUnor !== scopeUnor) {
      throw new Error('Forbidden: Anda tidak memiliki hak akses untuk melihat data pegawai unit lain');
    }

    return record;
  }

  static async getByNip(nip: string): Promise<Pegawai | null> {
    const results = await db
      .select()
      .from(pegawai)
      .where(eq(pegawai.nip, nip))
      .limit(1);

    return results[0] ?? null;
  }

  static async create(
    data: { nip: string; nama: string; jabatan: string; kodeUnor: string },
    user: AuthUser
  ) {
    // Validasi otorisasi jika user adalah AdminOPD
    if (user.role === 'AdminOPD') {
      if (!user.kodeUnor || data.kodeUnor !== user.kodeUnor) {
        throw new Error('Forbidden: Anda hanya dapat menambahkan pegawai ke Unit Organisasi Anda');
      }
    }

    // Validasi keberadaan UNOR
    const existingUnor = await UnorService.getByKode(data.kodeUnor);
    if (!existingUnor) {
      throw new Error(`Unit Organisasi dengan kode '${data.kodeUnor}' tidak ditemukan`);
    }

    // Validasi keunikan NIP
    const existingNip = await this.getByNip(data.nip);
    if (existingNip) {
      throw new Error(`Pegawai dengan NIP '${data.nip}' sudah terdaftar`);
    }

    await db.insert(pegawai).values({
      nip: data.nip,
      nama: data.nama,
      jabatan: data.jabatan,
      kodeUnor: data.kodeUnor
    });

    return { success: true, message: 'Data pegawai berhasil ditambahkan' };
  }

  static async update(
    id: number,
    data: { nip?: string; nama?: string; jabatan?: string; kodeUnor?: string },
    user: AuthUser
  ) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Data pegawai tidak ditemukan');
    }

    // Cek otorisasi untuk AdminOPD
    if (user.role === 'AdminOPD') {
      if (!user.kodeUnor || existing.kodeUnor !== user.kodeUnor) {
        throw new Error('Forbidden: Anda tidak memiliki hak akses untuk mengubah data pegawai unit lain');
      }
      if (data.kodeUnor && data.kodeUnor !== user.kodeUnor) {
        throw new Error('Forbidden: Anda tidak dapat memindahkan pegawai ke unit organisasi lain');
      }
    }

    // Cek duplikasi NIP jika diperbarui
    if (data.nip && data.nip !== existing.nip) {
      const duplicateNip = await this.getByNip(data.nip);
      if (duplicateNip) {
        throw new Error(`Pegawai dengan NIP '${data.nip}' sudah terdaftar`);
      }
    }

    // Cek keberadaan UNOR jika kodeUnor diperbarui
    if (data.kodeUnor && data.kodeUnor !== existing.kodeUnor) {
      const existingUnor = await UnorService.getByKode(data.kodeUnor);
      if (!existingUnor) {
        throw new Error(`Unit Organisasi dengan kode '${data.kodeUnor}' tidak ditemukan`);
      }
    }

    const updatePayload: Partial<NewPegawai> = {};
    if (data.nip !== undefined) updatePayload.nip = data.nip;
    if (data.nama !== undefined) updatePayload.nama = data.nama;
    if (data.jabatan !== undefined) updatePayload.jabatan = data.jabatan;
    if (data.kodeUnor !== undefined) updatePayload.kodeUnor = data.kodeUnor;

    await db.update(pegawai).set(updatePayload).where(eq(pegawai.id, id));
    return { success: true, message: 'Data pegawai berhasil diperbarui' };
  }

  static async delete(id: number, user: AuthUser) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Data pegawai tidak ditemukan');
    }

    // Cek otorisasi untuk AdminOPD
    if (user.role === 'AdminOPD') {
      if (!user.kodeUnor || existing.kodeUnor !== user.kodeUnor) {
        throw new Error('Forbidden: Anda tidak memiliki hak akses untuk menghapus data pegawai unit lain');
      }
    }

    await db.delete(pegawai).where(eq(pegawai.id, id));
    return { success: true, message: 'Data pegawai berhasil dihapus' };
  }
}

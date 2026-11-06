import { db, pegawai, unor, eq, and, or, like, sql, type Pegawai, type NewPegawai, type PegawaiWithUnor } from '@usul-data/shared';
import type { AuthUser } from '../middleware/auth';
import { UnorService } from './unor.service';

export interface PegawaiFilterParams {
  kodeUnor?: string | null;
  search?: string | null;
  scopeUnor?: string | null;
  page?: number | null;
  limit?: number | null;
}

export interface PegawaiPaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PegawaiQueryResult {
  data: PegawaiWithUnor[];
  pagination: PegawaiPaginationMeta;
}

export class PegawaiService {
  static async getAll(params: PegawaiFilterParams): Promise<PegawaiWithUnor[] | PegawaiQueryResult> {
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

    const whereClause =
      conditions.length === 1
        ? conditions[0]
        : conditions.length > 1
        ? and(...conditions)
        : undefined;

    // Jika tidak meminta pagination (misal untuk dropdown atau unit test lama), return array langsung
    if (!params.page && !params.limit) {
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

      if (whereClause) {
        return await query.where(whereClause);
      }
      return await query;
    }

    // Hitung total data
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(pegawai)
      .leftJoin(unor, eq(pegawai.kodeUnor, unor.kodeUnor));

    const totalCountRes = whereClause ? await countQuery.where(whereClause) : await countQuery;
    const totalItems = Number(totalCountRes[0]?.count || 0);

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 10);
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalItems / limit);

    let dataQuery = db
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

    if (whereClause) {
      dataQuery = dataQuery.where(whereClause) as any;
    }

    const data = await dataQuery.limit(limit).offset(offset);

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    };
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

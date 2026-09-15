import {
  db,
  usulanPerubahan,
  usulanDetailField,
  usulanDokumen,
  pegawai,
  unor,
  eq,
  and,
  desc,
  inArray,
  type UsulanStatus,
  type JenisUsulan,
  type KategoriUbah,
  type UsulanPerubahan,
  type UsulanDetailField,
  type UsulanDokumen
} from '@usul-data/shared';
import type { AuthUser } from '../middleware/auth';
import { PegawaiService } from './pegawai.service';
import path from 'path';
import fs from 'fs';

export interface UsulanFilterParams {
  kodeUnor?: string | null;
  status?: UsulanStatus | null;
  scopeUnor?: string | null;
  kategoriUbah?: KategoriUbah | null;
}

export interface UsulanDetailInput {
  jenisUsulan: JenisUsulan;
  kategoriUbah: KategoriUbah;
  fieldName: string;
  nilaiLama?: string | null;
  nilaiBaru?: string | null;
}

export interface CreateUsulanInput {
  pegawaiId: number;
  catatan?: string | null;
  details: UsulanDetailInput[];
}

export interface UsulanItemWithRelations extends UsulanPerubahan {
  namaPegawai?: string | null;
  nipPegawai?: string | null;
  jabatanPegawai?: string | null;
  namaUnor?: string | null;
  details?: UsulanDetailField[];
  dokumen?: UsulanDokumen[];
}

export class UsulanService {
  static resolveUploadedFilePath(filename: string): string | null {
    const sanitized = path.basename(filename);
    const candidates = [
      path.resolve(process.cwd(), 'uploads', sanitized),
      path.resolve(process.cwd(), 'apps/api/uploads', sanitized),
      path.resolve(import.meta.dir, '../../uploads', sanitized),
      path.resolve(import.meta.dir, '../../../uploads', sanitized)
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  static getUploadDir(): string {
    const candidate1 = path.resolve(process.cwd(), 'uploads');
    const candidate2 = path.resolve(process.cwd(), 'apps/api/uploads');
    const candidate3 = path.resolve(import.meta.dir, '../../uploads');

    if (fs.existsSync(candidate2)) return candidate2;
    if (fs.existsSync(candidate1)) return candidate1;
    if (fs.existsSync(candidate3)) return candidate3;

    fs.mkdirSync(candidate1, { recursive: true });
    return candidate1;
  }

  static async getAll(params: UsulanFilterParams): Promise<UsulanItemWithRelations[]> {
    const effectiveKodeUnor = params.scopeUnor || params.kodeUnor || null;
    const conditions = [];

    if (effectiveKodeUnor) {
      conditions.push(eq(usulanPerubahan.kodeUnor, effectiveKodeUnor));
    }

    if (params.status) {
      conditions.push(eq(usulanPerubahan.status, params.status));
    }

    if (params.kategoriUbah) {
      const usulanIdsWithKategori = db
        .select({ id: usulanDetailField.usulanId })
        .from(usulanDetailField)
        .where(eq(usulanDetailField.kategoriUbah, params.kategoriUbah));
      conditions.push(inArray(usulanPerubahan.id, usulanIdsWithKategori));
    }

    let query = db
      .select({
        id: usulanPerubahan.id,
        pegawaiId: usulanPerubahan.pegawaiId,
        kodeUnor: usulanPerubahan.kodeUnor,
        status: usulanPerubahan.status,
        catatan: usulanPerubahan.catatan,
        verifiedBy: usulanPerubahan.verifiedBy,
        verifiedAt: usulanPerubahan.verifiedAt,
        createdAt: usulanPerubahan.createdAt,
        updatedAt: usulanPerubahan.updatedAt,
        namaPegawai: pegawai.nama,
        nipPegawai: pegawai.nip,
        jabatanPegawai: pegawai.jabatan,
        namaUnor: unor.namaUnor
      })
      .from(usulanPerubahan)
      .leftJoin(pegawai, eq(usulanPerubahan.pegawaiId, pegawai.id))
      .leftJoin(unor, eq(usulanPerubahan.kodeUnor, unor.kodeUnor))
      .orderBy(desc(usulanPerubahan.createdAt));

    let rows: any[];
    if (conditions.length === 1) {
      rows = await query.where(conditions[0]);
    } else if (conditions.length > 1) {
      rows = await query.where(and(...conditions));
    } else {
      rows = await query;
    }

    return rows;
  }

  static async getById(id: number, scopeUnor?: string | null): Promise<UsulanItemWithRelations | null> {
    const rows = await db
      .select({
        id: usulanPerubahan.id,
        pegawaiId: usulanPerubahan.pegawaiId,
        kodeUnor: usulanPerubahan.kodeUnor,
        status: usulanPerubahan.status,
        catatan: usulanPerubahan.catatan,
        verifiedBy: usulanPerubahan.verifiedBy,
        verifiedAt: usulanPerubahan.verifiedAt,
        createdAt: usulanPerubahan.createdAt,
        updatedAt: usulanPerubahan.updatedAt,
        namaPegawai: pegawai.nama,
        nipPegawai: pegawai.nip,
        jabatanPegawai: pegawai.jabatan,
        namaUnor: unor.namaUnor
      })
      .from(usulanPerubahan)
      .leftJoin(pegawai, eq(usulanPerubahan.pegawaiId, pegawai.id))
      .leftJoin(unor, eq(usulanPerubahan.kodeUnor, unor.kodeUnor))
      .where(eq(usulanPerubahan.id, id))
      .limit(1);

    const record = rows[0] ?? null;
    if (!record) {
      return null;
    }

    if (scopeUnor && record.kodeUnor !== scopeUnor) {
      throw new Error('Forbidden: Anda tidak memiliki hak akses untuk melihat usulan unit lain');
    }

    const details = await db
      .select()
      .from(usulanDetailField)
      .where(eq(usulanDetailField.usulanId, id));

    const dokumen = await db
      .select()
      .from(usulanDokumen)
      .where(eq(usulanDokumen.usulanId, id));

    return {
      ...record,
      details,
      dokumen
    };
  }

  static async createDraft(input: CreateUsulanInput, user: AuthUser) {
    if (!input.details || input.details.length === 0) {
      throw new Error('Usulan harus memiliki minimal 1 rincian perubahan');
    }

    const targetPegawai = await PegawaiService.getById(input.pegawaiId);
    if (!targetPegawai) {
      throw new Error('Pegawai yang dipilih tidak ditemukan');
    }

    if (user.role === 'AdminOPD') {
      if (!user.kodeUnor || targetPegawai.kodeUnor !== user.kodeUnor) {
        throw new Error('Forbidden: Anda hanya dapat mengajukan usulan untuk pegawai di Unit Organisasi Anda');
      }
    }

    const [insertResult] = await db.insert(usulanPerubahan).values({
      pegawaiId: targetPegawai.id,
      kodeUnor: targetPegawai.kodeUnor,
      status: 'draft',
      catatan: input.catatan ?? null
    });

    const newUsulanId = Number(insertResult.insertId);

    for (const detail of input.details) {
      await db.insert(usulanDetailField).values({
        usulanId: newUsulanId,
        jenisUsulan: detail.jenisUsulan,
        kategoriUbah: detail.kategoriUbah,
        fieldName: detail.fieldName,
        nilaiLama: detail.nilaiLama ?? null,
        nilaiBaru: detail.nilaiBaru ?? null
      });
    }

    return {
      success: true,
      message: 'Draft usulan berhasil dibuat',
      data: { id: newUsulanId }
    };
  }

  static async uploadDokumen(
    usulanId: number,
    file: File,
    namaDokumen: string | undefined,
    user: AuthUser
  ) {
    const existing = await this.getById(usulanId);
    if (!existing) {
      throw new Error('Usulan tidak ditemukan');
    }

    if (user.role === 'AdminOPD') {
      if (!user.kodeUnor || existing.kodeUnor !== user.kodeUnor) {
        throw new Error('Forbidden: Anda tidak memiliki akses ke usulan unit lain');
      }
    }

    if (existing.status !== 'draft' && existing.status !== 'dibatalkan') {
      throw new Error('Dokumen hanya dapat ditambahkan pada usulan berstatus draft atau dibatalkan');
    }

    // Validasi tipe file PDF (MIME atau extension)
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      throw new Error('Format file tidak valid. Hanya file berekstensi PDF yang diperbolehkan');
    }

    // Validasi ukuran maks 1 MB (1048576 bytes)
    const MAX_SIZE = 1 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('Ukuran file melebihi batas maksimal 1 MB');
    }

    const uploadDir = this.getUploadDir();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${usulanId}_${Date.now()}_${sanitizedName}`;
    const targetFilePath = path.join(uploadDir, uniqueFileName);

    const arrayBuffer = await file.arrayBuffer();
    await Bun.write(targetFilePath, Buffer.from(arrayBuffer));

    const docName = namaDokumen && namaDokumen.trim() ? namaDokumen.trim() : file.name;
    const [insertResult] = await db.insert(usulanDokumen).values({
      usulanId,
      namaDokumen: docName,
      pathFile: `/uploads/${uniqueFileName}`,
      tipeDokumen: 'application/pdf',
      ukuranBytes: file.size
    });

    return {
      success: true,
      message: 'Dokumen pendukung berhasil diunggah',
      data: {
        id: Number(insertResult.insertId),
        namaDokumen: docName,
        pathFile: `/uploads/${uniqueFileName}`,
        ukuranBytes: file.size
      }
    };
  }

  static async updateUsulan(
    id: number,
    input: {
      catatan?: string | null;
      details?: UsulanDetailInput[];
    },
    user: AuthUser
  ) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Usulan tidak ditemukan');
    }

    if (user.role === 'AdminOPD') {
      if (!user.kodeUnor || existing.kodeUnor !== user.kodeUnor) {
        throw new Error('Forbidden: Anda tidak memiliki akses ke usulan unit lain');
      }
    }

    if (existing.status !== 'draft' && existing.status !== 'dibatalkan') {
      throw new Error('Hanya usulan berstatus draft atau dibatalkan yang dapat diedit');
    }

    if (input.catatan !== undefined) {
      await db
        .update(usulanPerubahan)
        .set({ catatan: input.catatan })
        .where(eq(usulanPerubahan.id, id));
    }

    if (input.details && input.details.length > 0) {
      await db
        .delete(usulanDetailField)
        .where(eq(usulanDetailField.usulanId, id));

      for (const detail of input.details) {
        await db.insert(usulanDetailField).values({
          usulanId: id,
          jenisUsulan: detail.jenisUsulan,
          kategoriUbah: detail.kategoriUbah,
          fieldName: detail.fieldName,
          nilaiLama: detail.nilaiLama ?? null,
          nilaiBaru: detail.nilaiBaru ?? null
        });
      }
    }

    return {
      success: true,
      message: 'Usulan berhasil diperbarui'
    };
  }

  static async submitUsulan(id: number, user: AuthUser) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Usulan tidak ditemukan');
    }

    if (user.role === 'AdminOPD') {
      if (!user.kodeUnor || existing.kodeUnor !== user.kodeUnor) {
        throw new Error('Forbidden: Anda tidak memiliki akses ke usulan unit lain');
      }
    }

    if (existing.status !== 'draft' && existing.status !== 'dibatalkan') {
      throw new Error('Hanya usulan berstatus draft atau dibatalkan yang dapat diajukan');
    }

    const details = existing.details || [];
    if (details.length === 0) {
      throw new Error('Usulan harus memiliki minimal 1 rincian perubahan');
    }

    // Cek kewajiban dokumen:
    // Jika jenis_usulan adalah 'tambah' atau 'ubah', wajib ada minimal 1 dokumen terlampir
    const hasTambahOrUbah = details.some(
      (d) => d.jenisUsulan === 'tambah' || d.jenisUsulan === 'ubah'
    );

    const docs = existing.dokumen || [];
    if (hasTambahOrUbah && docs.length === 0) {
      throw new Error(
        'Usulan dengan jenis usulan tambah atau ubah wajib melampirkan minimal 1 dokumen pendukung PDF'
      );
    }

    await db
      .update(usulanPerubahan)
      .set({ status: 'diajukan' })
      .where(eq(usulanPerubahan.id, id));

    return {
      success: true,
      message: 'Usulan perubahan data berhasil diajukan'
    };
  }

  static async cancelUsulan(id: number, user: AuthUser) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Usulan tidak ditemukan');
    }

    if (user.role === 'AdminOPD') {
      if (!user.kodeUnor || existing.kodeUnor !== user.kodeUnor) {
        throw new Error('Forbidden: Anda tidak memiliki akses ke usulan unit lain');
      }
    }

    // Batalkan usulan hanya jika status adalah diajukan
    if (existing.status !== 'diajukan') {
      throw new Error('Hanya usulan berstatus diajukan yang dapat dibatalkan');
    }

    await db
      .update(usulanPerubahan)
      .set({ status: 'dibatalkan' })
      .where(eq(usulanPerubahan.id, id));

    return {
      success: true,
      message: 'Usulan perubahan data berhasil dibatalkan'
    };
  }

  static async deleteUsulan(id: number, user: AuthUser) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Usulan tidak ditemukan');
    }

    if (user.role === 'AdminOPD') {
      if (!user.kodeUnor || existing.kodeUnor !== user.kodeUnor) {
        throw new Error('Forbidden: Anda tidak memiliki akses untuk menghapus usulan unit lain');
      }
    }

    // Hapus file dokumen terkait dari disk
    if (existing.dokumen && existing.dokumen.length > 0) {
      for (const doc of existing.dokumen) {
        const filePath = this.resolveUploadedFilePath(path.basename(doc.pathFile));
        if (filePath && fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error(`Gagal menghapus file berkas ${filePath}:`, e);
          }
        }
      }
    }

    await db.delete(usulanPerubahan).where(eq(usulanPerubahan.id, id));

    return {
      success: true,
      message: 'Usulan berhasil dihapus secara permanen'
    };
  }

  static async approveUsulan(
    id: number,
    catatan: string | undefined,
    user: AuthUser
  ) {
    if (user.role !== 'Admin') {
      throw new Error('Forbidden: Hanya Admin yang berhak menyetujui usulan');
    }

    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Usulan tidak ditemukan');
    }

    if (existing.status !== 'diajukan') {
      throw new Error('Hanya usulan berstatus diajukan yang dapat disetujui');
    }

    // 1. Update status usulan ke 'disetujui' dan isi catatan audit
    await db
      .update(usulanPerubahan)
      .set({
        status: 'disetujui',
        verifiedBy: user.username,
        verifiedAt: new Date(),
        catatan: catatan !== undefined && catatan !== null ? catatan.trim() : existing.catatan
      })
      .where(eq(usulanPerubahan.id, id));

    // 2. Memicu trigger pembaruan data master pegawai sesuai rincian field
    const details = existing.details || [];
    const pegawaiUpdatePayload: Partial<{
      nama: string;
      nip: string;
      jabatan: string;
      kodeUnor: string;
    }> = {};

    for (const detail of details) {
      // Catatan: Untuk jenis usulan 'hapus', tidak ada tindakan penghapusan fisik/soft delete (biarkan apa adanya)
      if (detail.jenisUsulan === 'ubah' || detail.jenisUsulan === 'tambah') {
        if (detail.nilaiBaru !== null && detail.nilaiBaru !== undefined) {
          const fieldNorm = detail.fieldName.trim().toLowerCase();
          if (['nama', 'nama lengkap', 'nama_lengkap'].includes(fieldNorm)) {
            pegawaiUpdatePayload.nama = detail.nilaiBaru;
          } else if (['nip', 'nomor induk pegawai'].includes(fieldNorm)) {
            pegawaiUpdatePayload.nip = detail.nilaiBaru;
          } else if (['jabatan'].includes(fieldNorm)) {
            pegawaiUpdatePayload.jabatan = detail.nilaiBaru;
          } else if (['kode_unor', 'kodeunor', 'unor', 'unit kerja', 'unit organisasi'].includes(fieldNorm)) {
            pegawaiUpdatePayload.kodeUnor = detail.nilaiBaru;
          }
        }
      }
    }

    if (Object.keys(pegawaiUpdatePayload).length > 0) {
      await db
        .update(pegawai)
        .set(pegawaiUpdatePayload)
        .where(eq(pegawai.id, existing.pegawaiId));
    }

    return {
      success: true,
      message: 'Usulan berhasil disetujui dan data pegawai telah diperbarui'
    };
  }

  static async rejectUsulan(
    id: number,
    input: { catatan: string },
    user: AuthUser
  ) {
    if (user.role !== 'Admin') {
      throw new Error('Forbidden: Hanya Admin yang berhak menolak usulan');
    }

    if (!input.catatan || !input.catatan.trim()) {
      throw new Error('Catatan alasan penolakan wajib diisi');
    }

    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Usulan tidak ditemukan');
    }

    if (existing.status !== 'diajukan') {
      throw new Error('Hanya usulan berstatus diajukan yang dapat ditolak');
    }

    await db
      .update(usulanPerubahan)
      .set({
        status: 'ditolak',
        verifiedBy: user.username,
        verifiedAt: new Date(),
        catatan: input.catatan.trim()
      })
      .where(eq(usulanPerubahan.id, id));

    return {
      success: true,
      message: 'Usulan berhasil ditolak'
    };
  }
}

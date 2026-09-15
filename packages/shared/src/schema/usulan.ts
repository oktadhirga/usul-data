import { mysqlTable, serial, varchar, text, timestamp, mysqlEnum, int, bigint } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { unor } from './unor';
import { pegawai } from './pegawai';

export const usulanStatusEnum = ['draft', 'diajukan', 'dibatalkan', 'disetujui', 'ditolak'] as const;
export type UsulanStatus = (typeof usulanStatusEnum)[number];

export const jenisUsulanEnum = ['tambah', 'ubah', 'hapus'] as const;
export type JenisUsulan = (typeof jenisUsulanEnum)[number];

export const kategoriUbahEnum = [
  'Data Pribadi',
  'Data Keluarga',
  'Golongan',
  'Jabatan',
  'Pendidikan',
  'Pindah Instansi',
  'Diklat/Kursus'
] as const;
export type KategoriUbah = (typeof kategoriUbahEnum)[number];

export const usulanPerubahan = mysqlTable('usulan_perubahan', {
  id: serial('id').primaryKey(),
  pegawaiId: bigint('pegawai_id', { mode: 'number', unsigned: true })
    .notNull()
    .references(() => pegawai.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  kodeUnor: varchar('kode_unor', { length: 100 })
    .notNull()
    .references(() => unor.kodeUnor, { onDelete: 'cascade', onUpdate: 'cascade' }),
  status: mysqlEnum('status', usulanStatusEnum).notNull().default('draft'),
  catatan: text('catatan'),
  verifiedBy: varchar('verified_by', { length: 100 }),
  verifiedAt: timestamp('verified_at'),
  catatanVerifikasi: text('catatan_verifikasi'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull()
});

export const usulanDetailField = mysqlTable('usulan_detail_field', {
  id: serial('id').primaryKey(),
  usulanId: bigint('usulan_id', { mode: 'number', unsigned: true })
    .notNull()
    .references(() => usulanPerubahan.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  jenisUsulan: mysqlEnum('jenis_usulan', jenisUsulanEnum).notNull(),
  kategoriUbah: mysqlEnum('kategori_ubah', kategoriUbahEnum).notNull(),
  fieldName: varchar('field_name', { length: 255 }).notNull(),
  nilaiLama: text('nilai_lama'),
  nilaiBaru: text('nilai_baru')
});

export const usulanDokumen = mysqlTable('usulan_dokumen', {
  id: serial('id').primaryKey(),
  usulanId: bigint('usulan_id', { mode: 'number', unsigned: true })
    .notNull()
    .references(() => usulanPerubahan.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  namaDokumen: varchar('nama_dokumen', { length: 255 }).notNull(),
  pathFile: varchar('path_file', { length: 500 }).notNull(),
  tipeDokumen: varchar('tipe_dokumen', { length: 100 }).notNull(),
  ukuranBytes: int('ukuran_bytes'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const usulanPerubahanRelations = relations(usulanPerubahan, ({ one, many }) => ({
  pegawai: one(pegawai, {
    fields: [usulanPerubahan.pegawaiId],
    references: [pegawai.id]
  }),
  unor: one(unor, {
    fields: [usulanPerubahan.kodeUnor],
    references: [unor.kodeUnor]
  }),
  details: many(usulanDetailField),
  dokumen: many(usulanDokumen)
}));

export const usulanDetailFieldRelations = relations(usulanDetailField, ({ one }) => ({
  usulan: one(usulanPerubahan, {
    fields: [usulanDetailField.usulanId],
    references: [usulanPerubahan.id]
  })
}));

export const usulanDokumenRelations = relations(usulanDokumen, ({ one }) => ({
  usulan: one(usulanPerubahan, {
    fields: [usulanDokumen.usulanId],
    references: [usulanPerubahan.id]
  })
}));

export type UsulanPerubahan = typeof usulanPerubahan.$inferSelect;
export type NewUsulanPerubahan = typeof usulanPerubahan.$inferInsert;

export type UsulanDetailField = typeof usulanDetailField.$inferSelect;
export type NewUsulanDetailField = typeof usulanDetailField.$inferInsert;

export type UsulanDokumen = typeof usulanDokumen.$inferSelect;
export type NewUsulanDokumen = typeof usulanDokumen.$inferInsert;

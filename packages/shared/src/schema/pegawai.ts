import { mysqlTable, serial, varchar } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { unor } from './unor';

export const pegawai = mysqlTable('pegawai', {
  id: serial('id').primaryKey(),
  nip: varchar('nip', { length: 50 }).notNull().unique(),
  nama: varchar('nama', { length: 255 }).notNull(),
  jabatan: varchar('jabatan', { length: 255 }).notNull(),
  kodeUnor: varchar('kode_unor', { length: 100 })
    .notNull()
    .references(() => unor.kodeUnor, { onDelete: 'cascade', onUpdate: 'cascade' })
});

export const pegawaiRelations = relations(pegawai, ({ one }) => ({
  unor: one(unor, {
    fields: [pegawai.kodeUnor],
    references: [unor.kodeUnor]
  })
}));

export type Pegawai = typeof pegawai.$inferSelect;
export type NewPegawai = typeof pegawai.$inferInsert;
export type PegawaiWithUnor = Pegawai & { namaUnor?: string | null };

import { mysqlTable, serial, varchar } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { pegawai } from './pegawai';

export const unor = mysqlTable('unor', {
  id: serial('id').primaryKey(),
  kodeUnor: varchar('kode_unor', { length: 100 }).notNull().unique(),
  namaUnor: varchar('nama_unor', { length: 255 }).notNull()
});

export const unorRelations = relations(unor, ({ many }) => ({
  pegawai: many(pegawai)
}));

export type Unor = typeof unor.$inferSelect;
export type NewUnor = typeof unor.$inferInsert;

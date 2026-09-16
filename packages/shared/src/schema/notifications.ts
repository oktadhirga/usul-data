import { mysqlTable, serial, varchar, text, timestamp, boolean, bigint } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const notifikasi = mysqlTable('notifikasi', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number', unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  judul: varchar('judul', { length: 255 }).notNull(),
  pesan: text('pesan').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  link: varchar('link', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const notifikasiRelations = relations(notifikasi, ({ one }) => ({
  user: one(users, {
    fields: [notifikasi.userId],
    references: [users.id]
  })
}));

export type Notifikasi = typeof notifikasi.$inferSelect;
export type NewNotifikasi = typeof notifikasi.$inferInsert;

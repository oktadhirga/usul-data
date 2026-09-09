import { mysqlTable, serial, varchar, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';

export const userRoleEnum = ['Admin', 'AdminOPD'] as const;
export type UserRole = (typeof userRoleEnum)[number];

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: mysqlEnum('role', userRoleEnum).notNull().default('AdminOPD'),
  kodeUnor: varchar('kode_unor', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;


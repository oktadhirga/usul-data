import { db, users, eq, type NewUser } from '@usul-data/shared';

export class UserService {
  static async getAll() {
    return await db.select().from(users);
  }

  static async getById(id: number) {
    const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0] ?? null;
  }

  static async create(data: { name: string; email: string }) {
    await db.insert(users).values(data);
    return { success: true, message: 'User created' };
  }
}

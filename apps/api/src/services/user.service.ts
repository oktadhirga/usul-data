import { db, users, eq, type User, type UserRole } from '@usul-data/shared';

export interface CreateUserData {
  username: string;
  password: string;
  role?: UserRole;
  kodeUnor?: string | null;
}

export interface UpdateUserData {
  username?: string;
  password?: string;
  role?: UserRole;
  kodeUnor?: string | null;
}

export class UserService {
  // Ambil semua user tanpa menyertakan passwordHash
  static async getAll() {
    return await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        kodeUnor: users.kodeUnor,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users);
  }

  // Ambil user berdasarkan ID tanpa passwordHash
  static async getById(id: number) {
    const results = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        kodeUnor: users.kodeUnor,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return results[0] ?? null;
  }

  // Ambil user internal beserta passwordHash (untuk login/verifikasi)
  static async getByUsername(username: string): Promise<User | null> {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return results[0] ?? null;
  }

  // Ambil user internal berdasarkan ID beserta passwordHash
  static async getInternalById(id: number): Promise<User | null> {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return results[0] ?? null;
  }

  // Buat user baru dengan hash password
  static async create(data: CreateUserData) {
    const passwordHash = await Bun.password.hash(data.password, {
      algorithm: 'bcrypt',
      cost: 10
    });

    await db.insert(users).values({
      username: data.username,
      passwordHash,
      role: data.role ?? 'AdminOPD',
      kodeUnor: data.kodeUnor ?? null
    });

    return { success: true, message: 'User berhasil dibuat' };
  }

  // Update data user
  static async update(id: number, data: UpdateUserData) {
    const updatePayload: Partial<typeof users.$inferInsert> = {};

    if (data.username !== undefined) {
      updatePayload.username = data.username;
    }
    if (data.role !== undefined) {
      updatePayload.role = data.role;
    }
    if (data.kodeUnor !== undefined) {
      updatePayload.kodeUnor = data.kodeUnor;
    }
    if (data.password) {
      updatePayload.passwordHash = await Bun.password.hash(data.password, {
        algorithm: 'bcrypt',
        cost: 10
      });
    }

    await db.update(users).set(updatePayload).where(eq(users.id, id));
    return { success: true, message: 'User berhasil diperbarui' };
  }

  // Update password langsung dengan hash
  static async updatePassword(id: number, newPassword: string) {
    const passwordHash = await Bun.password.hash(newPassword, {
      algorithm: 'bcrypt',
      cost: 10
    });

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, id));

    return { success: true, message: 'Password berhasil diubah' };
  }

  // Hapus user
  static async delete(id: number) {
    await db.delete(users).where(eq(users.id, id));
    return { success: true, message: 'User berhasil dihapus' };
  }
}

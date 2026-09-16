import { db, notifikasi, users, eq, and, desc, type Notifikasi } from '@usul-data/shared';

export class NotificationService {
  static async getUserNotifications(userId: number, limit = 50): Promise<Notifikasi[]> {
    return await db
      .select()
      .from(notifikasi)
      .where(eq(notifikasi.userId, userId))
      .orderBy(desc(notifikasi.createdAt))
      .limit(limit);
  }

  static async getUnreadCount(userId: number): Promise<number> {
    const results = await db
      .select()
      .from(notifikasi)
      .where(and(eq(notifikasi.userId, userId), eq(notifikasi.isRead, false)));
    return results.length;
  }

  static async markAsRead(id: number, userId: number): Promise<boolean> {
    const result = await db
      .update(notifikasi)
      .set({ isRead: true })
      .where(and(eq(notifikasi.id, id), eq(notifikasi.userId, userId)));
    return true;
  }

  static async markAllAsRead(userId: number): Promise<boolean> {
    await db
      .update(notifikasi)
      .set({ isRead: true })
      .where(eq(notifikasi.userId, userId));
    return true;
  }

  static async createNotification(
    userId: number,
    judul: string,
    pesan: string,
    link?: string
  ): Promise<void> {
    await db.insert(notifikasi).values({
      userId,
      judul,
      pesan,
      link: link || null,
      isRead: false
    });
  }

  static async notifyAdmins(judul: string, pesan: string, link?: string): Promise<void> {
    const adminUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'Admin'));

    for (const admin of adminUsers) {
      await this.createNotification(admin.id, judul, pesan, link);
    }
  }

  static async notifyUnor(
    kodeUnor: string,
    judul: string,
    pesan: string,
    link?: string
  ): Promise<void> {
    const unorUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, 'AdminOPD'), eq(users.kodeUnor, kodeUnor)));

    for (const u of unorUsers) {
      await this.createNotification(u.id, judul, pesan, link);
    }
  }
}

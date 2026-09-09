import { db, unor, eq, type Unor, type NewUnor } from '@usul-data/shared';

export class UnorService {
  static async getAll(scopeUnor?: string | null): Promise<Unor[]> {
    if (scopeUnor) {
      return await db.select().from(unor).where(eq(unor.kodeUnor, scopeUnor));
    }
    return await db.select().from(unor);
  }

  static async getById(id: number): Promise<Unor | null> {
    const results = await db.select().from(unor).where(eq(unor.id, id)).limit(1);
    return results[0] ?? null;
  }

  static async getByKode(kodeUnor: string): Promise<Unor | null> {
    const results = await db.select().from(unor).where(eq(unor.kodeUnor, kodeUnor)).limit(1);
    return results[0] ?? null;
  }

  static async create(data: { kodeUnor: string; namaUnor: string }) {
    const existing = await this.getByKode(data.kodeUnor);
    if (existing) {
      throw new Error(`Unit Organisasi dengan kode '${data.kodeUnor}' sudah ada`);
    }

    await db.insert(unor).values({
      kodeUnor: data.kodeUnor,
      namaUnor: data.namaUnor
    });

    return { success: true, message: 'Unit Organisasi berhasil ditambahkan' };
  }

  static async update(id: number, data: { kodeUnor?: string; namaUnor?: string }) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Unit Organisasi tidak ditemukan');
    }

    if (data.kodeUnor && data.kodeUnor !== existing.kodeUnor) {
      const duplicate = await this.getByKode(data.kodeUnor);
      if (duplicate) {
        throw new Error(`Unit Organisasi dengan kode '${data.kodeUnor}' sudah digunakan`);
      }
    }

    const updatePayload: Partial<NewUnor> = {};
    if (data.kodeUnor !== undefined) updatePayload.kodeUnor = data.kodeUnor;
    if (data.namaUnor !== undefined) updatePayload.namaUnor = data.namaUnor;

    await db.update(unor).set(updatePayload).where(eq(unor.id, id));
    return { success: true, message: 'Unit Organisasi berhasil diperbarui' };
  }

  static async delete(id: number) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Unit Organisasi tidak ditemukan');
    }

    await db.delete(unor).where(eq(unor.id, id));
    return { success: true, message: 'Unit Organisasi berhasil dihapus' };
  }
}

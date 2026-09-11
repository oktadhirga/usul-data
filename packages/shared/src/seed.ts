import { db, poolConnection } from './db';
import { users } from './schema/users';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding default users...');

  try {
    // 1. Admin Pusat
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
    if (existingAdmin.length === 0) {
      const adminPasswordHash = await Bun.password.hash('admin123', {
        algorithm: 'bcrypt',
        cost: 10
      });
      await db.insert(users).values({
        username: 'admin',
        passwordHash: adminPasswordHash,
        role: 'Admin',
        kodeUnor: null
      });
      console.log('✓ Created Admin: admin / admin123');
    } else {
      console.log('ℹ Admin user "admin" already exists');
    }

    // 2. Admin OPD
    const existingOpd = await db.select().from(users).where(eq(users.username, 'admin_opd')).limit(1);
    if (existingOpd.length === 0) {
      const opdPasswordHash = await Bun.password.hash('opd12345', {
        algorithm: 'bcrypt',
        cost: 10
      });
      await db.insert(users).values({
        username: 'admin_opd',
        passwordHash: opdPasswordHash,
        role: 'AdminOPD',
        kodeUnor: 'UNOR-101'
      });
      console.log('✓ Created AdminOPD: admin_opd / opd12345 (UNOR-101)');
    } else {
      console.log('ℹ AdminOPD user "admin_opd" already exists');
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await poolConnection.end();
  }
}

seed();

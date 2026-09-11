import { db, poolConnection } from './db';
import { users, unor, pegawai } from './schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // 1. Unor
    const existingUnor = await db.select().from(unor).where(eq(unor.kodeUnor, 'UNOR-101')).limit(1);
    if (existingUnor.length === 0) {
      await db.insert(unor).values([
        {
          kodeUnor: 'UNOR-101',
          namaUnor: 'Dinas Komunikasi dan Informatika'
        },
        {
          kodeUnor: 'UNOR-102',
          namaUnor: 'Badan Kepegawaian Daerah'
        },
        {
          kodeUnor: 'UNOR-103',
          namaUnor: 'Dinas Kesehatan'
        }
      ]);
      console.log('✓ Seeded UNOR data: UNOR-101, UNOR-102, UNOR-103');
    } else {
      console.log('ℹ UNOR data already exists');
    }

    // 2. Admin Pusat
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

    // 3. Admin OPD
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

    // 4. Pegawai
    const existingPegawai = await db.select().from(pegawai).limit(1);
    if (existingPegawai.length === 0) {
      await db.insert(pegawai).values([
        {
          nip: '198501012010011001',
          nama: 'Ahmad Fauzi, S.Kom',
          jabatan: 'Pranata Komputer Ahli Muda',
          kodeUnor: 'UNOR-101'
        },
        {
          nip: '198802022012022002',
          nama: 'Siti Rahmawati, S.AP',
          jabatan: 'Analis Kepegawaian',
          kodeUnor: 'UNOR-102'
        },
        {
          nip: '199003032015031003',
          nama: 'dr. Budi Setiawan, Sp.A',
          jabatan: 'Dokter Ahli Pertama',
          kodeUnor: 'UNOR-103'
        }
      ]);
      console.log('✓ Seeded sample Pegawai');
    } else {
      console.log('ℹ Pegawai data already exists');
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await poolConnection.end();
  }
}

seed();

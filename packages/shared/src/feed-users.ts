import { poolConnection } from './db';
import fs from 'fs';
import path from 'path';

async function feedUsers() {
  console.log('🚀 Memulai feeder akun pengguna ke database...');

  try {
    const dir = typeof import.meta.dir !== 'undefined' ? import.meta.dir : __dirname;
    const sqlPath = path.resolve(dir, '../../../deploy/feed_users.sql');

    if (!fs.existsSync(sqlPath)) {
      throw new Error(`File SQL tidak ditemukan di: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📥 Menjalankan query SQL feeder (UPSERT 49 pengguna)...');
    await poolConnection.query(sqlContent);

    console.log('✅ Feeder akun pengguna berhasil dimasukkan ke database!');
  } catch (error) {
    console.error('❌ Gagal menjalankan feeder:', error);
    process.exit(1);
  } finally {
    await poolConnection.end();
  }
}

feedUsers();


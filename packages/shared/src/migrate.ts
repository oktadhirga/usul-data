import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db, poolConnection } from './db';
import path from 'path';

async function runMigrations() {
  console.log('Running database migrations...');
  try {
    const migrationsFolder = path.resolve(__dirname, '../drizzle');
    await migrate(db, { migrationsFolder });
    console.log('Migrations applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await poolConnection.end();
  }
}

runMigrations();

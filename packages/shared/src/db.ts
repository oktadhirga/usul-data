import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const connectionUri = process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/usul_data';

export const poolConnection = mysql.createPool(connectionUri);

export const db = drizzle(poolConnection, { schema, mode: 'default' });

export type Database = typeof db;
export { schema };

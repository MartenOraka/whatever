// Drops everything and recreates the empty schema.
// Usage: npm run db:reset   (then optionally: npm run db:seed)
import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './pool';

async function main() {
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await pool.query(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));
  console.log('Database reset: empty schema created.');
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });

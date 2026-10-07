// Veritabanı tablolarını oluşturur: npm run db:kur
// Önce Vercel'deki bağlantı bilgisini çek: npx vercel env pull .env.local
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error('DATABASE_URL bulunamadı. Önce "npx vercel env pull .env.local" komutunu çalıştır.');
  process.exit(1);
}

const sema = await readFile(new URL('../db/sema.sql', import.meta.url), 'utf8');
const istemci = new pg.Client({ connectionString: url });
await istemci.connect();
try {
  await istemci.query(sema);
  const { rows } = await istemci.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log('Tablolar hazır:', rows.map(r => r.table_name).join(', '));
} finally {
  await istemci.end();
}

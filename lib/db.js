import { Pool } from 'pg';

/*
 * Veritabanı bağlantısı
 * DATABASE_URL değeri Vercel'deki Neon Postgres entegrasyonu tarafından
 * otomatik eklenir. Bilgisayarında çalışırken .env.local dosyasından okunur.
 * Bağlantı bilgisi koda asla yazılmaz.
 */
const kuresel = globalThis;

function havuz() {
  if (!kuresel.__atomHavuz) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL tanımlı değil. Vercel ortam değişkenlerini ya da .env.local dosyasını kontrol et.');
    }
    kuresel.__atomHavuz = new Pool({ connectionString, max: 5, idleTimeoutMillis: 10_000 });
  }
  return kuresel.__atomHavuz;
}

/** Parametreli sorgu: değerler her zaman $1, $2 ile ayrı gönderilir (SQL enjeksiyonuna karşı). */
export function sorgu(metin, degerler = []) {
  return havuz().query(metin, degerler);
}

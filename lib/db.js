import { Pool } from 'pg';

/*
 * Veritabanı bağlantısı
 * DATABASE_URL değeri Vercel'deki Neon Postgres entegrasyonu tarafından
 * otomatik eklenir. Bilgisayarında çalışırken .env.local dosyasından okunur.
 * Bağlantı bilgisi koda asla yazılmaz.
 */
const kuresel = globalThis;

const SEMA_SQL = `
CREATE TABLE IF NOT EXISTS kullanicilar (
  id           SERIAL PRIMARY KEY,
  ad           VARCHAR(40)  NOT NULL,
  eposta       VARCHAR(254) NOT NULL UNIQUE,
  sifre_ozeti  TEXT         NOT NULL,
  olusturma    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS oturumlar (
  token_ozeti   CHAR(64)    PRIMARY KEY,
  kullanici_id  INTEGER     NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  bitis         TIMESTAMPTZ NOT NULL,
  olusturma     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS oturumlar_kullanici_idx ON oturumlar (kullanici_id);

CREATE TABLE IF NOT EXISTS ilerleme (
  id            SERIAL PRIMARY KEY,
  kullanici_id  INTEGER     NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  oyun          VARCHAR(20) NOT NULL CHECK (oyun IN ('kur', 'foton', 'yarisma')),
  yildiz        SMALLINT    NOT NULL CHECK (yildiz BETWEEN 0 AND 9),
  puan          INTEGER     NOT NULL DEFAULT 0 CHECK (puan BETWEEN 0 AND 1000),
  olusturma     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ilerleme_kullanici_idx ON ilerleme (kullanici_id, olusturma DESC);

CREATE TABLE IF NOT EXISTS kullanim (
  kullanici_id  INTEGER NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  gun           DATE    NOT NULL,
  adet          INTEGER NOT NULL DEFAULT 0 CHECK (adet >= 0),
  PRIMARY KEY (kullanici_id, gun)
);

CREATE TABLE IF NOT EXISTS sorular (
  id            SERIAL PRIMARY KEY,
  kullanici_id  INTEGER      NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  soru          VARCHAR(300) NOT NULL,
  cevap         TEXT         NOT NULL,
  olusturma     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sorular_kullanici_idx ON sorular (kullanici_id, olusturma DESC);

CREATE TABLE IF NOT EXISTS giris_denemeleri (
  id      SERIAL PRIMARY KEY,
  eposta  VARCHAR(254) NOT NULL,
  zaman   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS giris_denemeleri_idx ON giris_denemeleri (eposta, zaman DESC);
`;

let semaOlusturuldu = false;

function havuz() {
  if (!kuresel.__atomHavuz) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL tanımlı değil. Vercel ortam değişkenlerini ya da .env.local dosyasını kontrol et.');
    }
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    kuresel.__atomHavuz = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10_000
    });
  }
  return kuresel.__atomHavuz;
}

export async function semaOlustur() {
  const p = havuz();
  await p.query(SEMA_SQL);
  semaOlusturuldu = true;
}

/** Parametreli sorgu: değerler her zaman $1, $2 ile ayrı gönderilir (SQL enjeksiyonuna karşı). */
export async function sorgu(metin, degerler = []) {
  try {
    return await havuz().query(metin, degerler);
  } catch (err) {
    if (err.code === '42P01' && !semaOlusturuldu) {
      await semaOlustur();
      return await havuz().query(metin, degerler);
    }
    throw err;
  }
}

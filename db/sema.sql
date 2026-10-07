-- ==========================================================
-- Atom Ailesi veritabanı şeması (PostgreSQL)
-- Vercel → Storage → Neon Postgres → "Open in Neon" → SQL Editor
-- ekranına bu dosyanın tamamını yapıştırıp çalıştırabilirsin.
-- Komutlar tekrar çalıştırılabilir (IF NOT EXISTS).
-- ==========================================================

-- Kullanıcılar: şifreler asla düz metin saklanmaz, yalnızca bcrypt özeti tutulur
CREATE TABLE IF NOT EXISTS kullanicilar (
  id           SERIAL PRIMARY KEY,
  ad           VARCHAR(40)  NOT NULL,
  eposta       VARCHAR(254) NOT NULL UNIQUE,
  sifre_ozeti  TEXT         NOT NULL,
  olusturma    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Oturumlar: tarayıcıdaki çerezin kendisi değil, SHA-256 özeti saklanır
CREATE TABLE IF NOT EXISTS oturumlar (
  token_ozeti   CHAR(64)    PRIMARY KEY,
  kullanici_id  INTEGER     NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  bitis         TIMESTAMPTZ NOT NULL,
  olusturma     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS oturumlar_kullanici_idx ON oturumlar (kullanici_id);

-- Oyun ilerlemesi: her biten görev / oyun bir satır
CREATE TABLE IF NOT EXISTS ilerleme (
  id            SERIAL PRIMARY KEY,
  kullanici_id  INTEGER     NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  oyun          VARCHAR(20) NOT NULL CHECK (oyun IN ('kur', 'foton', 'yarisma')),
  yildiz        SMALLINT    NOT NULL CHECK (yildiz BETWEEN 0 AND 9),
  puan          INTEGER     NOT NULL DEFAULT 0 CHECK (puan BETWEEN 0 AND 1000),
  olusturma     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ilerleme_kullanici_idx ON ilerleme (kullanici_id, olusturma DESC);

-- Günlük kullanım kotası: her kullanıcı için her gün bir satır
-- "gun" Türkiye saatine göre hesaplanır (Europe/Istanbul)
CREATE TABLE IF NOT EXISTS kullanim (
  kullanici_id  INTEGER NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  gun           DATE    NOT NULL,
  adet          INTEGER NOT NULL DEFAULT 0 CHECK (adet >= 0),
  PRIMARY KEY (kullanici_id, gun)
);

-- Gluon Dede'ye sorulan sorular ve verilen cevaplar
CREATE TABLE IF NOT EXISTS sorular (
  id            SERIAL PRIMARY KEY,
  kullanici_id  INTEGER      NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  soru          VARCHAR(300) NOT NULL,
  cevap         TEXT         NOT NULL,
  olusturma     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sorular_kullanici_idx ON sorular (kullanici_id, olusturma DESC);

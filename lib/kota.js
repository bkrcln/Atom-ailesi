import { sorgu } from './db';

/*
 * Kullanıcı başı günlük kullanım kotası
 * - Her kullanıcı her gün en fazla GUNLUK_SORU_LIMITI kadar soru sorabilir (varsayılan 10).
 * - Gün, Türkiye saatine göre gece 00.00'da yenilenir.
 * - Hak kullanımı tek bir SQL komutuyla yapılır; aynı anda iki istek gelse bile limit aşılamaz.
 */
const BUGUN = "(now() AT TIME ZONE 'Europe/Istanbul')::date";
const TR_SAAT_FARKI = 3 * 60 * 60 * 1000; // Türkiye yıl boyunca UTC+3

export function gunlukLimit() {
  const deger = parseInt(process.env.GUNLUK_SORU_LIMITI ?? '10', 10);
  return Number.isInteger(deger) && deger > 0 ? deger : 10;
}

/** Bir sonraki gece yarısı (Türkiye saati) */
export function yenilenmeZamani(simdi = Date.now()) {
  const gun = Math.floor((simdi + TR_SAAT_FARKI) / 86_400_000);
  return new Date((gun + 1) * 86_400_000 - TR_SAAT_FARKI).toISOString();
}

export async function kotaDurumu(kullaniciId) {
  const limit = gunlukLimit();
  const { rows } = await sorgu(
    `SELECT adet FROM kullanim WHERE kullanici_id = $1 AND gun = ${BUGUN}`,
    [kullaniciId]
  );
  const kullanilan = rows[0]?.adet ?? 0;
  return { limit, kullanilan, kalan: Math.max(0, limit - kullanilan), yenilenme: yenilenmeZamani() };
}

/** Bir hak kullanır. Limit dolmuşsa null, değilse güncel durumu döndürür. */
export async function hakKullan(kullaniciId) {
  const limit = gunlukLimit();
  const { rows } = await sorgu(
    `INSERT INTO kullanim (kullanici_id, gun, adet) VALUES ($1, ${BUGUN}, 1)
     ON CONFLICT (kullanici_id, gun)
     DO UPDATE SET adet = kullanim.adet + 1 WHERE kullanim.adet < $2
     RETURNING adet`,
    [kullaniciId, limit]
  );
  if (!rows[0]) return null;
  const kullanilan = rows[0].adet;
  return { limit, kullanilan, kalan: Math.max(0, limit - kullanilan), yenilenme: yenilenmeZamani() };
}

/** Yapay zekâ cevap veremezse kullanılan hak geri verilir. */
export async function hakIade(kullaniciId) {
  await sorgu(
    `UPDATE kullanim SET adet = GREATEST(adet - 1, 0) WHERE kullanici_id = $1 AND gun = ${BUGUN}`,
    [kullaniciId]
  );
}

/** Son 7 günün kullanım sayıları (panel grafiği için) */
export async function haftalikKullanim(kullaniciId) {
  const { rows } = await sorgu(
    `SELECT g::date AS gun, COALESCE(k.adet, 0)::int AS adet
       FROM generate_series(${BUGUN} - 6, ${BUGUN}, interval '1 day') AS g
       LEFT JOIN kullanim k ON k.gun = g::date AND k.kullanici_id = $1
      ORDER BY g`,
    [kullaniciId]
  );
  return rows.map(r => ({ gun: r.gun instanceof Date ? r.gun.toISOString().slice(0, 10) : String(r.gun), adet: r.adet }));
}

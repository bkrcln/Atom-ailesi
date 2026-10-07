import crypto from 'node:crypto';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sorgu } from './db';

/*
 * Oturum yönetimi
 * - Girişte rastgele 32 baytlık bir anahtar üretilir ve HttpOnly çereze yazılır.
 * - Veritabanında anahtarın kendisi değil, SHA-256 özeti saklanır.
 * - Her istekte çerezdeki anahtar veritabanıyla karşılaştırılır.
 * - Çıkışta veritabanındaki kayıt silinir, çerez temizlenir.
 */
export const OTURUM_CEREZI = 'atom_oturum';
const OTURUM_GUN = 7;

const ozet = anahtar => crypto.createHash('sha256').update(anahtar).digest('hex');

export function cerezAyarlari(bitis) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: bitis
  };
}

export async function oturumAc(kullaniciId) {
  const anahtar = crypto.randomBytes(32).toString('base64url');
  const bitis = new Date(Date.now() + OTURUM_GUN * 24 * 60 * 60 * 1000);
  await sorgu('DELETE FROM oturumlar WHERE kullanici_id = $1 AND bitis < now()', [kullaniciId]);
  await sorgu(
    'INSERT INTO oturumlar (token_ozeti, kullanici_id, bitis) VALUES ($1, $2, $3)',
    [ozet(anahtar), kullaniciId, bitis]
  );
  return { anahtar, bitis };
}

export async function oturumKapat(anahtar) {
  if (anahtar) await sorgu('DELETE FROM oturumlar WHERE token_ozeti = $1', [ozet(anahtar)]);
}

/** Giriş yapmış kullanıcıyı döndürür; yoksa null. Aynı istekte bir kez sorgulanır. */
export const oturumKullanicisi = cache(async () => {
  const cerezler = await cookies();
  const anahtar = cerezler.get(OTURUM_CEREZI)?.value;
  if (!anahtar) return null;
  const { rows } = await sorgu(
    `SELECT k.id, k.ad, k.eposta, k.olusturma
       FROM oturumlar o
       JOIN kullanicilar k ON k.id = o.kullanici_id
      WHERE o.token_ozeti = $1 AND o.bitis > now()`,
    [ozet(anahtar)]
  );
  return rows[0] ?? null;
});

/** Korumalı sayfalarda kullanılır: giriş yoksa ana sayfaya yönlendirir. */
export async function girisZorunlu() {
  const kullanici = await oturumKullanicisi();
  if (!kullanici) redirect('/?yonlendirme=1');
  return kullanici;
}

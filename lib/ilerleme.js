import { sorgu } from './db';

export const OYUNLAR = {
  kur: { ad: 'Atom kur', maxYildiz: 3 },
  foton: { ad: 'Foton yakala', maxYildiz: 5 },
  yarisma: { ad: 'Bilgi yarışması', maxYildiz: 9 }
};

export async function toplamYildiz(kullaniciId) {
  const { rows } = await sorgu(
    'SELECT COALESCE(SUM(yildiz), 0)::int AS toplam FROM ilerleme WHERE kullanici_id = $1',
    [kullaniciId]
  );
  return rows[0].toplam;
}

export async function oyunOzeti(kullaniciId) {
  const { rows } = await sorgu(
    `SELECT oyun, COUNT(*)::int AS oynama, COALESCE(SUM(yildiz), 0)::int AS yildiz, COALESCE(MAX(puan), 0)::int AS en_iyi
       FROM ilerleme WHERE kullanici_id = $1 GROUP BY oyun`,
    [kullaniciId]
  );
  return rows;
}

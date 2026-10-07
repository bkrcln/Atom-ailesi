import { sorgu } from '@/lib/db';
import { OYUNLAR } from '@/lib/ilerleme';
import { oturumKullanicisi } from '@/lib/oturum';
import { yanit, hata, govdeOku } from '@/lib/yanit';

const GUNLUK_KAYIT_SINIRI = 200;

export async function POST(istek) {
  const kullanici = await oturumKullanicisi();
  if (!kullanici) return hata('Önce giriş yapmalısın.', 401);

  const govde = await govdeOku(istek);
  const oyun = govde?.oyun;
  const yildiz = Number(govde?.yildiz);
  const puan = Number(govde?.puan ?? 0);
  if (!OYUNLAR[oyun]) return hata('Bilinmeyen oyun.');
  if (!Number.isInteger(yildiz) || yildiz < 0 || yildiz > OYUNLAR[oyun].maxYildiz) return hata('Geçersiz yıldız sayısı.');
  if (!Number.isInteger(puan) || puan < 0 || puan > 1000) return hata('Geçersiz puan.');

  try {
    const { rows } = await sorgu(
      `SELECT COUNT(*)::int AS adet FROM ilerleme
        WHERE kullanici_id = $1 AND olusturma > now() - interval '1 day'`,
      [kullanici.id]
    );
    if (rows[0].adet >= GUNLUK_KAYIT_SINIRI) return hata('Bugün çok fazla kayıt yapıldı.', 429);

    await sorgu(
      'INSERT INTO ilerleme (kullanici_id, oyun, yildiz, puan) VALUES ($1, $2, $3, $4)',
      [kullanici.id, oyun, yildiz, puan]
    );
    return yanit({ tamam: true }, 201);
  } catch (e) {
    console.error('İlerleme kaydı hatası:', e);
    return hata('İlerleme kaydedilemedi.', 500);
  }
}

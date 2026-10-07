import { sorgu } from '@/lib/db';
import { oturumKullanicisi } from '@/lib/oturum';
import { hakKullan, hakIade, kotaDurumu } from '@/lib/kota';
import { gluonDedeyeSor } from '@/lib/yapayzeka';
import { yanit, hata, govdeOku } from '@/lib/yanit';

export const maxDuration = 30;

const HATA_MESAJLARI = {
  yogun: 'Gluon Dede şu an çok yoğun. Biraz sonra tekrar dene, hakkın eksilmedi.',
  bos: 'Gluon Dede bu soruya cevap veremedi. Sorunu başka bir şekilde sormayı dene, hakkın eksilmedi.',
  varsayilan: 'Gluon Dede şu an cevap veremedi. Biraz sonra tekrar dene, hakkın eksilmedi.'
};

export async function POST(istek) {
  // 1. Yetkilendirme: yalnızca giriş yapmış kullanıcılar
  const kullanici = await oturumKullanicisi();
  if (!kullanici) return hata('Önce giriş yapmalısın.', 401);

  // 2. Girdi kontrolü
  const govde = await govdeOku(istek);
  const soru = String(govde?.soru ?? '').replace(/\s+/g, ' ').trim();
  if (soru.length < 3) return hata('Sorunu biraz daha açık yaz.');
  if (soru.length > 300) return hata('Sorun en fazla 300 karakter olabilir.');

  try {
    // 3. Kota: hak yoksa yapay zekâya hiç gidilmez
    const durum = await hakKullan(kullanici.id);
    if (!durum) {
      const kota = await kotaDurumu(kullanici.id);
      return hata('Bugünlük soru hakkın doldu. Hakların gece 00.00\'da yenilenecek.', 429, { limitDoldu: true, kota });
    }

    // 4. Yapay zekâ çağrısı (anahtar sunucuda kalır)
    try {
      const cevap = await gluonDedeyeSor(soru);
      await sorgu('INSERT INTO sorular (kullanici_id, soru, cevap) VALUES ($1, $2, $3)', [kullanici.id, soru, cevap]);
      return yanit({ cevap, kota: durum });
    } catch (e) {
      console.error('Yapay zekâ hatası:', e.message);
      await hakIade(kullanici.id);
      const kota = await kotaDurumu(kullanici.id);
      return hata(HATA_MESAJLARI[e.tur] || HATA_MESAJLARI.varsayilan, 502, { kota });
    }
  } catch (e) {
    console.error('Soru işleme hatası:', e);
    return hata('Sunucuda bir sorun oluştu. Biraz sonra tekrar dene.', 500);
  }
}

import bcrypt from 'bcryptjs';
import { sorgu } from '@/lib/db';
import { kayitDogrula } from '@/lib/dogrulama';
import { oturumAc, cerezAyarlari, OTURUM_CEREZI } from '@/lib/oturum';
import { yanit, hata, govdeOku } from '@/lib/yanit';

export async function POST(istek) {
  const govde = await govdeOku(istek);
  if (!govde) return hata('Geçersiz istek.');

  const veri = kayitDogrula(govde);
  if (veri.hata) return hata(veri.hata);

  try {
    const sifreOzeti = await bcrypt.hash(veri.sifre, 12);
    const { rows } = await sorgu(
      `INSERT INTO kullanicilar (ad, eposta, sifre_ozeti) VALUES ($1, $2, $3)
       ON CONFLICT (eposta) DO NOTHING RETURNING id`,
      [veri.ad, veri.eposta, sifreOzeti]
    );
    if (!rows[0]) return hata('Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.', 409);

    const { anahtar, bitis } = await oturumAc(rows[0].id);
    const cevap = yanit({ tamam: true }, 201);
    cevap.cookies.set(OTURUM_CEREZI, anahtar, cerezAyarlari(bitis));
    return cevap;
  } catch (e) {
    console.error('Kayıt hatası:', e);
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
      return hata('Veritabanı bağlantısı bulunamadı. Vercel Storage üzerinden Postgres bağlamalısınız.', 500);
    }
    return hata('Sunucuda bir sorun oluştu. Biraz sonra tekrar dene.', 500);
  }
}

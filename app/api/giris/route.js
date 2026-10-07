import bcrypt from 'bcryptjs';
import { sorgu } from '@/lib/db';
import { epostaTemizle } from '@/lib/dogrulama';
import { oturumAc, cerezAyarlari, OTURUM_CEREZI } from '@/lib/oturum';
import { yanit, hata, govdeOku } from '@/lib/yanit';

// Kullanıcı yokken de aynı sürede cevap vermek için sahte bir özet (gerçek şifre değildir)
const SAHTE_OZET = '$2b$12$jD9UPktlz/NI03ChIM2H.Oj3EHXQ2iNlXGZHGso5Nx16LGAe5zCQu';
const DENEME_SINIRI = 5;

export async function POST(istek) {
  const govde = await govdeOku(istek);
  if (!govde) return hata('Geçersiz istek.');

  const eposta = epostaTemizle(govde.eposta);
  const sifre = String(govde.sifre ?? '');
  if (!eposta || !sifre) return hata('E-posta adresini ve şifreni yaz.');

  try {
    // Şifre tahmin denemelerine karşı: son 15 dakikadaki hatalı denemeler sayılır
    const deneme = await sorgu(
      `SELECT COUNT(*)::int AS adet FROM giris_denemeleri
        WHERE eposta = $1 AND zaman > now() - interval '15 minutes'`,
      [eposta]
    );
    if (deneme.rows[0].adet >= DENEME_SINIRI) {
      return hata('Çok fazla hatalı deneme yapıldı. 15 dakika sonra tekrar dene.', 429);
    }

    const { rows } = await sorgu('SELECT id, sifre_ozeti FROM kullanicilar WHERE eposta = $1', [eposta]);
    const kullanici = rows[0];
    const dogru = await bcrypt.compare(sifre, kullanici ? kullanici.sifre_ozeti : SAHTE_OZET);
    if (!kullanici || !dogru) {
      await sorgu('INSERT INTO giris_denemeleri (eposta) VALUES ($1)', [eposta]);
      return hata('E-posta ya da şifre hatalı.', 401);
    }

    await sorgu(
      `DELETE FROM giris_denemeleri WHERE eposta = $1 OR zaman < now() - interval '1 day'`,
      [eposta]
    );

    const { anahtar, bitis } = await oturumAc(kullanici.id);
    const cevap = yanit({ tamam: true });
    cevap.cookies.set(OTURUM_CEREZI, anahtar, cerezAyarlari(bitis));
    return cevap;
  } catch (e) {
    console.error('Giriş hatası:', e);
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
      return hata('Veritabanı bağlantısı bulunamadı. Vercel Storage üzerinden Postgres bağlamalısınız.', 500);
    }
    return hata('Sunucuda bir sorun oluştu. Biraz sonra tekrar dene.', 500);
  }
}

import bcrypt from 'bcryptjs';
import { sorgu } from '@/lib/db';
import { epostaTemizle } from '@/lib/dogrulama';
import { oturumAc, cerezAyarlari, OTURUM_CEREZI } from '@/lib/oturum';
import { yanit, hata, govdeOku } from '@/lib/yanit';

// Kullanıcı yokken de aynı sürede cevap vermek için sahte bir özet (gerçek şifre değildir)
const SAHTE_OZET = '$2b$12$jD9UPktlz/NI03ChIM2H.Oj3EHXQ2iNlXGZHGso5Nx16LGAe5zCQu';

export async function POST(istek) {
  const govde = await govdeOku(istek);
  if (!govde) return hata('Geçersiz istek.');

  const eposta = epostaTemizle(govde.eposta);
  const sifre = String(govde.sifre ?? '');
  if (!eposta || !sifre) return hata('E-posta adresini ve şifreni yaz.');

  try {
    const { rows } = await sorgu('SELECT id, sifre_ozeti FROM kullanicilar WHERE eposta = $1', [eposta]);
    const kullanici = rows[0];
    const dogru = await bcrypt.compare(sifre, kullanici ? kullanici.sifre_ozeti : SAHTE_OZET);
    if (!kullanici || !dogru) return hata('E-posta ya da şifre hatalı.', 401);

    const { anahtar, bitis } = await oturumAc(kullanici.id);
    const cevap = yanit({ tamam: true });
    cevap.cookies.set(OTURUM_CEREZI, anahtar, cerezAyarlari(bitis));
    return cevap;
  } catch (e) {
    console.error('Giriş hatası:', e);
    return hata('Sunucuda bir sorun oluştu. Biraz sonra tekrar dene.', 500);
  }
}

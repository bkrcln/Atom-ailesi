import UstMenu from '@/components/UstMenu';
import Oyun from '@/components/Oyun';
import { girisZorunlu } from '@/lib/oturum';
import { toplamYildiz } from '@/lib/ilerleme';
import { kotaDurumu } from '@/lib/kota';

export const metadata = { title: 'Oyun' };

export default async function OyunSayfasi() {
  const kullanici = await girisZorunlu();
  const [yildiz, kota] = await Promise.all([toplamYildiz(kullanici.id), kotaDurumu(kullanici.id)]);

  return (
    <>
      <UstMenu kullanici={kullanici} />
      <main className="wrap">
        <Oyun baslangicYildiz={yildiz} ad={kullanici.ad} kota={kota} />
      </main>
    </>
  );
}

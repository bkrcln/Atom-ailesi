import UstMenu from '@/components/UstMenu';
import Oyun from '@/components/Oyun';
import { girisZorunlu } from '@/lib/oturum';
import { toplamYildiz } from '@/lib/ilerleme';

export const metadata = { title: 'Oyun' };

export default async function OyunSayfasi() {
  const kullanici = await girisZorunlu();
  const yildiz = await toplamYildiz(kullanici.id);

  return (
    <>
      <UstMenu kullanici={kullanici} />
      <main className="wrap">
        <Oyun baslangicYildiz={yildiz} />
      </main>
    </>
  );
}

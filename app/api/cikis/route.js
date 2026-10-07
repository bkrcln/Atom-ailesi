import { cookies } from 'next/headers';
import { oturumKapat, OTURUM_CEREZI } from '@/lib/oturum';
import { yanit } from '@/lib/yanit';

export async function POST() {
  const cerezler = await cookies();
  try {
    await oturumKapat(cerezler.get(OTURUM_CEREZI)?.value);
  } catch (e) {
    console.error('Çıkış hatası:', e);
  }
  const cevap = yanit({ tamam: true });
  cevap.cookies.set(OTURUM_CEREZI, '', { httpOnly: true, path: '/', expires: new Date(0) });
  return cevap;
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import Logo from '@/components/Logo';
import KayitFormu from '@/components/KayitFormu';
import { oturumKullanicisi } from '@/lib/oturum';

export const metadata = { title: 'Kayıt ol' };

export default async function KayitSayfasi() {
  if (await oturumKullanicisi()) redirect('/oyun');

  return (
    <main className="ortala">
      <Link href="/" className="marka"><Logo /><strong>Atom Ailesi</strong></Link>
      <div className="card">
        <h2>Kayıt ol</h2>
        <p className="muted">Hesap açınca yıldızların kaydedilir ve kaldığın yerden devam edersin.</p>
        <KayitFormu />
      </div>
    </main>
  );
}

import Link from 'next/link';
import Logo from '@/components/Logo';
import Oyun from '@/components/Oyun';

export const metadata = { title: 'Oyun' };

export default function OyunSayfasi() {
  return (
    <>
      <header className="ust">
        <Link href="/" className="marka"><Logo /><strong>Atom Ailesi</strong></Link>
      </header>
      <main className="wrap">
        <Oyun />
      </main>
    </>
  );
}

import Link from 'next/link';
import Logo from './Logo';
import CikisButonu from './CikisButonu';

export default function UstMenu({ kullanici }) {
  return (
    <header className="ust">
      <Link href="/oyun" className="marka"><Logo /><strong>Atom Ailesi</strong></Link>
      <div className="ust-sag">
        <span className="selam">Merhaba, {kullanici.ad}!</span>
        <CikisButonu />
      </div>
    </header>
  );
}

import Link from 'next/link';
import Logo from './Logo';
import CikisButonu from './CikisButonu';
import NavBaglantilari from './NavBaglantilari';

export default function UstMenu({ kullanici }) {
  return (
    <header className="ust">
      <Link href="/oyun" className="marka"><Logo /><strong>Atom Ailesi</strong></Link>
      <div className="ust-sag">
        <NavBaglantilari />
        <span className="selam">Merhaba, {kullanici.ad}!</span>
        <CikisButonu />
      </div>
    </header>
  );
}

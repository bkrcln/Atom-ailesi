import Link from 'next/link';
import Logo from '@/components/Logo';

const AILE = [
  ['Anne Proton', 'proton'], ['Baba Nötron', 'neutron'], ['Elektron Kardeşler', 'electron'],
  ['Kuark Bebekler', 'quark'], ['Gluon Dede', 'gluon'], ['Foton Postacı', 'photon']
];

export default function AnaSayfa() {
  return (
    <main className="karsilama">
      <div>
        <Logo boyut={84} />
        <h1>Atom Ailesi</h1>
        <p className="giris-metni">Atomun içinde koca bir aile yaşar. Onlarla tanış, kendi atomunu kur, fotonları yakala ve bilgi yarışmasında yıldızları topla!</p>
        <ul className="aile">
          {AILE.map(([ad, renk]) => <li key={ad}><i style={{ '--c': `var(--${renk})` }} />{ad}</li>)}
        </ul>
      </div>
      <div className="card giris-kart">
        <h2>Hazır mısın?</h2>
        <p>Dört bölümlük atom macerası seni bekliyor.</p>
        <div className="btn-row"><Link className="btn" href="/oyun">Oyuna başla</Link></div>
      </div>
    </main>
  );
}

import { redirect } from 'next/navigation';
import Logo from '@/components/Logo';
import GirisFormu from '@/components/GirisFormu';
import { oturumKullanicisi } from '@/lib/oturum';

const AILE = [
  ['Anne Proton', 'proton'], ['Baba Nötron', 'neutron'], ['Elektron Kardeşler', 'electron'],
  ['Kuark Bebekler', 'quark'], ['Gluon Dede', 'gluon'], ['Foton Postacı', 'photon']
];

const BILDIRIMLER = {
  yonlendirme: { tur: 'bilgi', metin: 'Oyuna girmek için önce giriş yapmalısın.' },
  cikis: { tur: 'basari', metin: 'Çıkış yaptın. Görüşmek üzere!' }
};

export default async function AnaSayfa({ searchParams }) {
  if (await oturumKullanicisi()) redirect('/oyun');

  const parametreler = await searchParams;
  const bildirim = parametreler?.yonlendirme ? BILDIRIMLER.yonlendirme : parametreler?.cikis ? BILDIRIMLER.cikis : null;

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
        <h2>Giriş yap</h2>
        <p className="muted">Oyuna girmek için hesabınla giriş yap.</p>
        <GirisFormu bildirim={bildirim} />
      </div>
    </main>
  );
}

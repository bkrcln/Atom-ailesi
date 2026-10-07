import Link from 'next/link';
import UstMenu from '@/components/UstMenu';
import { girisZorunlu } from '@/lib/oturum';
import { kotaDurumu, haftalikKullanim } from '@/lib/kota';
import { oyunOzeti, OYUNLAR } from '@/lib/ilerleme';
import { sorgu } from '@/lib/db';

export const metadata = { title: 'Panelim' };

const GUNLER = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function kalanSure(isoZaman) {
  const dakika = Math.max(0, Math.round((new Date(isoZaman).getTime() - Date.now()) / 60000));
  const saat = Math.floor(dakika / 60);
  return saat > 0 ? `${saat} saat ${dakika % 60} dakika` : `${dakika} dakika`;
}

export default async function PanelSayfasi() {
  const kullanici = await girisZorunlu();
  const [kota, hafta, oyunlar, sonSorular] = await Promise.all([
    kotaDurumu(kullanici.id),
    haftalikKullanim(kullanici.id),
    oyunOzeti(kullanici.id),
    sorgu('SELECT soru, cevap, olusturma FROM sorular WHERE kullanici_id = $1 ORDER BY olusturma DESC LIMIT 5', [kullanici.id]).then(r => r.rows)
  ]);

  const toplamYildiz = oyunlar.reduce((t, o) => t + o.yildiz, 0);
  const enYuksekGun = Math.max(kota.limit, ...hafta.map(g => g.adet));
  const uyelik = new Date(kullanici.olusturma).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });

  return (
    <>
      <UstMenu kullanici={kullanici} />
      <main className="wrap">
        <h1 className="sayfa-baslik">Panelim</h1>
        <p className="muted">Yıldızlarını, oyun sonuçlarını ve Gluon Dede&apos;ye kalan soru hakkını buradan takip edebilirsin.</p>

        <div className="pano">
          <section className="card kota-kart" aria-labelledby="kota-baslik">
            <h2 id="kota-baslik">Bugünkü soru hakkın</h2>
            <p className="kota-sayi"><strong>{kota.kalan}</strong> / {kota.limit} hakkın kaldı</p>
            <div className="kota-cubuk" role="meter" aria-label="Kalan soru hakkı" aria-valuemin={0} aria-valuemax={kota.limit} aria-valuenow={kota.kalan}>
              <span style={{ width: `${Math.round((kota.kalan / kota.limit) * 100)}%` }} />
            </div>
            {kota.kalan === 0
              ? <p className="uyari bilgi">Bugünlük hakkının hepsini kullandın. Hakların {kalanSure(kota.yenilenme)} sonra, gece 00.00&apos;da yenilenecek.</p>
              : <p className="muted">Bugün {kota.kullanilan} soru sordun. Hakların {kalanSure(kota.yenilenme)} sonra, gece 00.00&apos;da yeniden {kota.limit} olacak.</p>}
            <div className="btn-row"><Link className="btn amber small" href="/oyun">Gluon Dede&apos;ye soru sor</Link></div>
          </section>

          <section className="card yildiz-kart" aria-labelledby="yildiz-baslik">
            <h2 id="yildiz-baslik">Toplam yıldızın</h2>
            <p className="dev-sayi">{toplamYildiz}</p>
            <p className="muted">Atom kur, Foton yakala ve Bilgi yarışması bölümlerinde kazandığın yıldızlar.</p>
          </section>

          <section className="card" aria-labelledby="hesap-baslik">
            <h2 id="hesap-baslik">Hesabım</h2>
            <dl className="hesap">
              <dt>Ad</dt><dd>{kullanici.ad}</dd>
              <dt>E-posta</dt><dd>{kullanici.eposta}</dd>
              <dt>Üyelik</dt><dd>{uyelik}</dd>
            </dl>
          </section>

          <section className="card" aria-labelledby="hafta-baslik">
            <h2 id="hafta-baslik">Son 7 günde sorduğun sorular</h2>
            <div className="grafik" role="img" aria-label={hafta.map(g => `${GUNLER[new Date(g.gun + 'T12:00:00Z').getUTCDay()]}: ${g.adet}`).join(', ')}>
              {hafta.map(g => (
                <div key={g.gun} className="sutun">
                  <span className="deger">{g.adet}</span>
                  <span className="cubuk" style={{ height: `${Math.round((g.adet / enYuksekGun) * 100)}%` }} />
                  <span className="gun">{GUNLER[new Date(g.gun + 'T12:00:00Z').getUTCDay()]}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card iki" aria-labelledby="oyun-baslik">
            <h2 id="oyun-baslik">Oyunlarım</h2>
            <div className="tablo-kap">
              <table className="tablo">
                <thead><tr><th scope="col">Bölüm</th><th scope="col">Tamamlama</th><th scope="col">Yıldız</th><th scope="col">En iyi puan</th></tr></thead>
                <tbody>
                  {Object.entries(OYUNLAR).map(([anahtar, bilgi]) => {
                    const o = oyunlar.find(x => x.oyun === anahtar);
                    return (
                      <tr key={anahtar}>
                        <th scope="row">{bilgi.ad}</th>
                        <td>{o?.oynama ?? 0}</td>
                        <td>{o?.yildiz ?? 0}</td>
                        <td>{o?.en_iyi ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card genis" aria-labelledby="soru-baslik">
            <h2 id="soru-baslik">Son sorduğun sorular</h2>
            {sonSorular.length === 0
              ? <p className="muted">Henüz soru sormadın. Oyundaki &quot;Gluon Dede&apos;ye sor&quot; bölümünden ilk sorunu sorabilirsin.</p>
              : (
                <ul className="soru-listesi">
                  {sonSorular.map((s, i) => (
                    <li key={i}>
                      <strong>{s.soru}</strong>
                      <p>{s.cevap}</p>
                    </li>
                  ))}
                </ul>
              )}
          </section>

        </div>
      </main>
    </>
  );
}

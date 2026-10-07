'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GluonDedeAvatar from './GluonDedeAvatar';

const ONERILER = [
  'Atomları neden gözümüzle göremeyiz?',
  'Elektron neden çekirdeğe düşmez?',
  'Kuark ne demek?',
  'Işık nasıl oluşur?'
];

export default function GluonaSor({ ad, kota: ilkKota }) {
  const router = useRouter();
  const [kota, setKota] = useState(ilkKota);
  const [mesajlar, setMesajlar] = useState([
    { kim: 'dede', metin: `Merhaba ${ad}! Ben Gluon Dede. Atomlar, ışık ya da maddeler hakkında merak ettiğin her şeyi bana sorabilirsin.` }
  ]);
  const [soru, setSoru] = useState('');
  const [bekliyor, setBekliyor] = useState(false);
  const [uyari, setUyari] = useState('');
  const listeRef = useRef(null);
  const limitDoldu = kota.kalan <= 0;

  useEffect(() => {
    const liste = listeRef.current;
    if (liste) liste.scrollTop = liste.scrollHeight;
  }, [mesajlar, bekliyor]);

  async function sor(metin) {
    const temiz = metin.replace(/\s+/g, ' ').trim();
    if (!temiz || bekliyor || limitDoldu) return;
    setUyari('');
    setBekliyor(true);
    setMesajlar(m => [...m, { kim: 'sen', metin: temiz }]);
    setSoru('');
    try {
      const cevap = await fetch('/api/sor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soru: temiz })
      });
      if (cevap.status === 401) {
        router.replace('/?yonlendirme=1');
        return;
      }
      const sonuc = await cevap.json().catch(() => ({}));
      if (sonuc.kota) setKota(sonuc.kota);
      if (cevap.ok) {
        setMesajlar(m => [...m, { kim: 'dede', metin: sonuc.cevap }]);
      } else {
        if (cevap.status === 400) {
          setMesajlar(m => m.slice(0, -1));
          setSoru(temiz);
        }
        setUyari(sonuc.mesaj || 'Bir sorun oluştu. Biraz sonra tekrar dene.');
      }
    } catch {
      setUyari('Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.');
    } finally {
      setBekliyor(false);
    }
  }

  const doluluk = Math.round((kota.kalan / kota.limit) * 100);

  return (
    <>
      <div className="card sohbet-kart">
        <div className="sohbet" ref={listeRef} aria-live="polite">
          {mesajlar.map((m, i) => (
            <div key={i} className={`balon ${m.kim}`}>
              {m.kim === 'dede' && <GluonDedeAvatar />}
              <p>{m.metin}</p>
            </div>
          ))}
          {bekliyor && (
            <div className="balon dede">
              <GluonDedeAvatar />
              <p className="dusunuyor">Gluon Dede düşünüyor<span>.</span><span>.</span><span>.</span></p>
            </div>
          )}
        </div>

        {uyari && <p className="uyari hata" role="alert">{uyari}</p>}

        {limitDoldu ? (
          <div className="uyari bilgi limit-kutu" role="status">
            Bugünlük {kota.limit} soru hakkının hepsini kullandın. Hakların gece 00.00&apos;da yenilenecek.
            O zamana kadar oyunlarla öğrenmeye devam edebilirsin! <Link href="/panel">Panelime git</Link>
          </div>
        ) : (
          <form className="soru-formu" onSubmit={e => { e.preventDefault(); sor(soru); }}>
            <label htmlFor="soru" className="sr">Gluon Dede&apos;ye sorunu yaz</label>
            <textarea
              id="soru"
              value={soru}
              onChange={e => setSoru(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sor(soru); } }}
              maxLength={300}
              rows={2}
              placeholder="Örneğin: Proton neden artı yüklüdür?"
              disabled={bekliyor}
            />
            <button className="btn amber" type="submit" disabled={bekliyor || soru.trim().length < 3}>Sor</button>
          </form>
        )}
      </div>

      <div className="side">
        <div className="card">
          <h3>Bugünkü soru hakkın</h3>
          <p className="kota-sayi"><strong>{kota.kalan}</strong> / {kota.limit}</p>
          <div className="kota-cubuk" role="meter" aria-label="Kalan soru hakkı" aria-valuemin={0} aria-valuemax={kota.limit} aria-valuenow={kota.kalan}>
            <span style={{ width: `${doluluk}%` }} />
          </div>
          <p className="muted">Her gün {kota.limit} soru sorabilirsin. Hakların gece 00.00&apos;da yenilenir.</p>
        </div>
        <div className="card">
          <h3>Ne sorabilirim?</h3>
          <div className="chips">
            {ONERILER.map(o => (
              <button key={o} type="button" className="chip" style={{ '--c': 'var(--gluon)' }} onClick={() => sor(o)} disabled={bekliyor || limitDoldu}>{o}</button>
            ))}
          </div>
        </div>
        <p className="fact">Gluon Dede bir yapay zekâ asistanıdır ve bazen yanılabilir. Öğrendiğin önemli bilgileri öğretmenine ya da kitabına da danış.</p>
      </div>
    </>
  );
}

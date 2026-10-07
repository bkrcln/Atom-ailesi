'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GirisFormu({ bildirim }) {
  const router = useRouter();
  const [hata, setHata] = useState('');
  const [bekliyor, setBekliyor] = useState(false);
  const [goster, setGoster] = useState(false);

  async function gonder(e) {
    e.preventDefault();
    setHata('');
    const veri = new FormData(e.currentTarget);
    setBekliyor(true);
    try {
      const cevap = await fetch('/api/giris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eposta: veri.get('eposta'), sifre: veri.get('sifre') })
      });
      const sonuc = await cevap.json().catch(() => ({}));
      if (!cevap.ok) {
        setHata(sonuc.mesaj || 'Giriş yapılamadı.');
        setBekliyor(false);
        return;
      }
      router.replace('/oyun');
      router.refresh();
    } catch {
      setHata('Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.');
      setBekliyor(false);
    }
  }

  return (
    <form className="form" onSubmit={gonder} noValidate>
      {bildirim && !hata && <p className={`uyari ${bildirim.tur}`} role="status">{bildirim.metin}</p>}
      {hata && <p className="uyari hata" role="alert">{hata}</p>}
      <div className="alan">
        <label htmlFor="eposta">E-posta</label>
        <input id="eposta" name="eposta" type="email" autoComplete="email" inputMode="email" required />
      </div>
      <div className="alan">
        <label htmlFor="sifre">Şifre</label>
        <input id="sifre" name="sifre" type={goster ? 'text' : 'password'} autoComplete="current-password" required />
      </div>
      <label className="goster"><input type="checkbox" checked={goster} onChange={e => setGoster(e.target.checked)} />Şifreyi göster</label>
      <button className="btn" type="submit" disabled={bekliyor}>{bekliyor ? 'Giriş yapılıyor…' : 'Giriş yap ve oyuna gir'}</button>
      <p className="alt-baglanti">Hesabın yok mu? <Link href="/kayit">Hemen kayıt ol</Link></p>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function KayitFormu() {
  const router = useRouter();
  const [hata, setHata] = useState('');
  const [bekliyor, setBekliyor] = useState(false);
  const [goster, setGoster] = useState(false);

  async function gonder(e) {
    e.preventDefault();
    setHata('');
    const veri = new FormData(e.currentTarget);
    if (veri.get('sifre') !== veri.get('sifreTekrar')) {
      setHata('Şifreler birbiriyle aynı değil.');
      return;
    }
    setBekliyor(true);
    try {
      const cevap = await fetch('/api/kayit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad: veri.get('ad'), eposta: veri.get('eposta'), sifre: veri.get('sifre') })
      });
      const sonuc = await cevap.json().catch(() => ({}));
      if (!cevap.ok) {
        setHata(sonuc.mesaj || 'Kayıt olunamadı.');
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
      {hata && <p className="uyari hata" role="alert">{hata}</p>}
      <div className="alan">
        <label htmlFor="ad">Adın</label>
        <input id="ad" name="ad" type="text" autoComplete="given-name" maxLength={40} required />
      </div>
      <div className="alan">
        <label htmlFor="eposta">E-posta</label>
        <input id="eposta" name="eposta" type="email" autoComplete="email" inputMode="email" required />
      </div>
      <div className="alan">
        <label htmlFor="sifre">Şifre</label>
        <input id="sifre" name="sifre" type={goster ? 'text' : 'password'} autoComplete="new-password" minLength={8} required aria-describedby="sifre-ipucu" />
        <small id="sifre-ipucu">En az 8 karakter olsun.</small>
      </div>
      <div className="alan">
        <label htmlFor="sifreTekrar">Şifre (tekrar)</label>
        <input id="sifreTekrar" name="sifreTekrar" type={goster ? 'text' : 'password'} autoComplete="new-password" required />
      </div>
      <label className="goster"><input type="checkbox" checked={goster} onChange={e => setGoster(e.target.checked)} />Şifreyi göster</label>
      <button className="btn green" type="submit" disabled={bekliyor}>{bekliyor ? 'Hesap açılıyor…' : 'Kayıt ol'}</button>
      <p className="alt-baglanti">Zaten hesabın var mı? <Link href="/">Giriş yap</Link></p>
    </form>
  );
}

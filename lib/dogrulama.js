const EPOSTA_DESENI = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function epostaTemizle(deger) {
  return String(deger ?? '').trim().toLowerCase();
}

export function kayitDogrula({ ad, eposta, sifre }) {
  const temizAd = String(ad ?? '').trim().replace(/\s+/g, ' ');
  const temizEposta = epostaTemizle(eposta);
  const sifreMetni = String(sifre ?? '');

  if (temizAd.length < 2) return { hata: 'Adını en az 2 harf olacak şekilde yaz.' };
  if (temizAd.length > 40) return { hata: 'Adın en fazla 40 karakter olabilir.' };
  if (!EPOSTA_DESENI.test(temizEposta) || temizEposta.length > 254) return { hata: 'Geçerli bir e-posta adresi yaz.' };
  if (sifreMetni.length < 8) return { hata: 'Şifre en az 8 karakter olmalı.' };
  if (Buffer.byteLength(sifreMetni, 'utf8') > 72) return { hata: 'Şifre çok uzun. Daha kısa bir şifre seç.' };

  return { ad: temizAd, eposta: temizEposta, sifre: sifreMetni };
}

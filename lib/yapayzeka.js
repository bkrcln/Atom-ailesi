/*
 * Gluon Dede yapay zekâ asistanı (Google Gemini API)
 * Bu dosya YALNIZCA sunucuda çalışır. API anahtarı tarayıcıya hiç gönderilmez;
 * Vercel ortam değişkenindeki GEMINI_API_KEY değerinden okunur.
 */
const SISTEM_TALIMATI = `Sen "Atom Ailesi" adlı eğitim oyunundaki Gluon Dede'sin. Kuark bebekleri yay gibi kıvırcık sakalıyla bir arada tutan, neşeli ve sabırlı bir dedesin. İlkokul öğrencilerinin atom, madde, ışık ve fen bilimleri hakkındaki sorularını cevaplıyorsun.

Kurallar:
- Her zaman Türkçe ve ilkokul öğrencisinin anlayacağı sade kelimelerle cevap ver.
- Cevabın en fazla 4 kısa cümle olsun. Markdown, liste, başlık veya emoji kullanma.
- Bilimsel olarak doğru ol. Benzetme yaparken Atom Ailesi karakterlerini kullanabilirsin: Anne Proton (+), Baba Nötron (0), Elektron Kardeşler (−), Kuark Bebekler, Gluon Dede ve Foton Postacı. Bunların benzetme olduğunu unutma.
- Emin olmadığın bir şeyi uydurma; "Bunu öğretmenine de sorabilirsin" de.
- Soru fen bilimleriyle ilgili değilse kısa ve nazik bir cevap ver, sonra konuyu atomlara ve bilime geri getir.
- Çocuk adres, telefon, şifre gibi kişisel bilgiler yazarsa bunları tekrar etme ve bu bilgileri kimseyle paylaşmaması gerektiğini nazikçe hatırlat.
- Korkutucu, şiddet içeren ya da yaşına uygun olmayan konulara girme; böyle bir durumda güvendiği bir büyüğüyle konuşmasını öner.`;

export class YapayZekaHatasi extends Error {
  constructor(mesaj, tur) {
    super(mesaj);
    this.tur = tur; // 'ayar' | 'yogun' | 'servis' | 'bos'
  }
}

export async function gluonDedeyeSor(soru) {
  const anahtar = process.env.GEMINI_API_KEY;
  if (!anahtar) throw new YapayZekaHatasi('GEMINI_API_KEY ortam değişkeni tanımlı değil.', 'ayar');

  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const generationConfig = { maxOutputTokens: 1024 };
  // Kısa cevaplarda uzun "düşünme" gerekmez; hız ve maliyet için düşük tutulur
  if (model.startsWith('gemini-3')) generationConfig.thinkingConfig = { thinkingLevel: 'low' };
  else if (model.startsWith('gemini-2.5-flash')) generationConfig.thinkingConfig = { thinkingBudget: 0 };

  let cevap;
  try {
    cevap = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': anahtar },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SISTEM_TALIMATI }] },
          contents: [{ role: 'user', parts: [{ text: soru }] }],
          generationConfig
        }),
        signal: AbortSignal.timeout(25_000)
      }
    );
  } catch (e) {
    throw new YapayZekaHatasi(`Gemini'ye ulaşılamadı: ${e.message}`, 'servis');
  }

  if (!cevap.ok) {
    const ayrinti = (await cevap.text().catch(() => '')).slice(0, 300);
    throw new YapayZekaHatasi(`Gemini ${cevap.status}: ${ayrinti}`, cevap.status === 429 ? 'yogun' : 'servis');
  }

  const veri = await cevap.json();
  const metin = (veri?.candidates?.[0]?.content?.parts ?? [])
    .filter(p => typeof p.text === 'string' && !p.thought)
    .map(p => p.text)
    .join('')
    .replace(/[*#_`]/g, '')
    .trim();

  if (!metin) {
    const neden = veri?.promptFeedback?.blockReason || veri?.candidates?.[0]?.finishReason || 'bilinmiyor';
    throw new YapayZekaHatasi(`Boş cevap (${neden})`, 'bos');
  }
  return metin.slice(0, 1200);
}

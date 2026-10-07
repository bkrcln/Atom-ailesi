/*
 * Gluon Dede yapay zekâ asistanı
 * Desteklenen sağlayıcılar:
 * 1. EVREN (Cumhurbaşkanlığı SSB Milli LLM Platformu - evren.ssyz.org.tr)
 * 2. Google Gemini (Google AI Studio)
 *
 * Bu dosya YALNIZCA sunucuda çalışır. API anahtarları tarayıcıya hiç gönderilmez;
 * Vercel ortam değişkenlerinden okunur.
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

async function evrenIleSor(soru, anahtar) {
  const baseUrl = (process.env.EVREN_BASE_URL || 'https://evren-llmapi.ssyz.org.tr/v1').replace(/\/+$/, '');
  const model = process.env.EVREN_MODEL || 'deepseek-v4.1-flash';

  let cevap;
  try {
    cevap = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anahtar}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SISTEM_TALIMATI },
          { role: 'user', content: soru }
        ],
        max_tokens: 1024,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(25_000)
    });
  } catch (e) {
    throw new YapayZekaHatasi(`EVREN servisine ulaşılamadı: ${e.message}`, 'servis');
  }

  if (!cevap.ok) {
    const ayrinti = (await cevap.text().catch(() => '')).slice(0, 300);
    throw new YapayZekaHatasi(`EVREN ${cevap.status}: ${ayrinti}`, cevap.status === 429 ? 'yogun' : 'servis');
  }

  const veri = await cevap.json();
  const metin = (veri?.choices?.[0]?.message?.content || '')
    .replace(/[*#_`]/g, '')
    .trim();

  if (!metin) {
    throw new YapayZekaHatasi('EVREN boş cevap döndürdü.', 'bos');
  }
  return metin.slice(0, 1200);
}

async function geminiIleSor(soru, anahtar) {
  const anaModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const modeller = [...new Set([anaModel, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'])];

  let sonHata;
  for (const model of modeller) {
    const generationConfig = { maxOutputTokens: 1024 };
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
      sonHata = new YapayZekaHatasi(`Gemini'ye ulaşılamadı (${model}): ${e.message}`, 'servis');
      continue;
    }

    if (!cevap.ok) {
      const ayrinti = (await cevap.text().catch(() => '')).slice(0, 300);
      // 503 (yüksek talep) veya 429 (oran sınırı) durumunda sonraki modeli dene
      if (cevap.status === 503 || cevap.status === 429) {
        console.warn(`Gemini modeli (${model}) ${cevap.status} yanıtı verdi, yedek modele geçiliyor...`);
        sonHata = new YapayZekaHatasi(`Gemini ${cevap.status}: ${ayrinti}`, 'yogun');
        continue;
      }
      throw new YapayZekaHatasi(`Gemini ${cevap.status}: ${ayrinti}`, 'servis');
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
      sonHata = new YapayZekaHatasi(`Boş cevap (${neden})`, 'bos');
      continue;
    }
    return metin.slice(0, 1200);
  }

  throw sonHata || new YapayZekaHatasi('Tüm Gemini modelleri yoğun.', 'yogun');
}

export async function gluonDedeyeSor(soru) {
  const geminiAnahtar = process.env.GEMINI_API_KEY;
  const evrenAnahtar = process.env.EVREN_API_KEY;
  const tercih = (process.env.AI_PROVIDER || '').toLowerCase();

  // Açık tercih belirtilmişse
  if (tercih === 'evren' && evrenAnahtar) {
    return await evrenIleSor(soru, evrenAnahtar);
  }
  if (tercih === 'gemini' && geminiAnahtar) {
    return await geminiIleSor(soru, geminiAnahtar);
  }

  // GEMINI_API_KEY öncelikli
  if (geminiAnahtar) {
    try {
      return await geminiIleSor(soru, geminiAnahtar);
    } catch (err) {
      if (evrenAnahtar) {
        console.warn('Gemini çağrısı başarısız oldu, EVREN deneniyor:', err.message);
        return await evrenIleSor(soru, evrenAnahtar);
      }
      throw err;
    }
  }

  // EVREN_API_KEY tanımlıysa
  if (evrenAnahtar) {
    return await evrenIleSor(soru, evrenAnahtar);
  }

  throw new YapayZekaHatasi(
    'Yapay zekâ anahtarı bulunamadı (GEMINI_API_KEY veya EVREN_API_KEY ortam değişkeni tanımlanmalı).',
    'ayar'
  );
}

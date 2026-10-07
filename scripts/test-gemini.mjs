// Gemini API bağlantı test aracı:
// Kullanım: GEMINI_API_KEY=AIzaSyxxxx node scripts/test-gemini.mjs

const anahtar = process.env.GEMINI_API_KEY;

if (!anahtar) {
  console.log('❌ GEMINI_API_KEY bulunamadı!');
  console.log('Kullanım: GEMINI_API_KEY=anahtariniz node scripts/test-gemini.mjs');
  process.exit(1);
}

const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
console.log(`📡 Gemini API test ediliyor (Model: ${model})...`);

try {
  const cevap = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': anahtar },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Merhaba! Atom hakkında tek cümlelik eğlenceli bir bilgi ver.' }] }]
      })
    }
  );

  if (!cevap.ok) {
    const ayrinti = await cevap.text();
    console.error(`❌ Hata (${cevap.status}):`, ayrinti);
    process.exit(1);
  }

  const veri = await cevap.json();
  const metin = (veri?.candidates?.[0]?.content?.parts ?? [])
    .filter(p => typeof p.text === 'string' && !p.thought)
    .map(p => p.text)
    .join('')
    .trim();

  console.log('✅ Gemini API başarıyla çalışıyor!');
  console.log('Cevap:', metin);
} catch (e) {
  console.error('❌ Bağlantı hatası:', e.message);
  process.exit(1);
}

// EVREN API bağlantı test aracı:
// Kullanım: EVREN_API_KEY=evren_llm_xxxx node scripts/test-evren.mjs

const anahtar = process.env.EVREN_API_KEY;

if (!anahtar) {
  console.log('❌ EVREN_API_KEY bulunamadı!');
  console.log('Kullanım: EVREN_API_KEY=anahtariniz node scripts/test-evren.mjs');
  process.exit(1);
}

console.log('📡 EVREN API test ediliyor...');
const baseUrl = (process.env.EVREN_BASE_URL || 'https://evren-llmapi.ssyz.org.tr/v1').replace(/\/+$/, '');
const model = process.env.EVREN_MODEL || 'deepseek-v4.1-flash';

try {
  const yanit = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anahtar}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'user', content: 'Merhaba, bana atom hakkında tek cümlelik bilgi verir misin?' }
      ],
      max_tokens: 150
    })
  });

  if (!yanit.ok) {
    const metin = await yanit.text();
    console.error(`❌ Hata (${yanit.status}):`, metin);
    if (yanit.status === 403 && metin.includes('terms')) {
      console.log('💡 İpucu: evren.ssyz.org.tr üzerinden kullanım şartlarını onaylamanız gerekiyor.');
    }
    process.exit(1);
  }

  const veri = await yanit.json();
  const cevap = veri?.choices?.[0]?.message?.content;
  console.log('✅ EVREN API başarıyla çalışıyor!');
  console.log('Model:', model);
  console.log('Cevap:', cevap);
} catch (e) {
  console.error('❌ Bağlantı hatası:', e.message);
  process.exit(1);
}

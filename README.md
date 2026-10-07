# Atom Ailesi ⚛️

**İlkokul öğrencileri için atomun yapısını oyunlarla öğreten, yapay zekâ destekli eğitim uygulaması.**

Canlı adres: `https://SENIN-PROJEN.vercel.app` ← Vercel'e yayınladıktan sonra kendi adresini buraya yaz.

Atomun parçacıkları bir ailenin üyeleri olarak anlatılır. Anne Proton (+) evin adını belirler, Baba Nötron (0) çekirdeği dengede tutar, Elektron Kardeşler (−) halka yollarda koşar. Proton ve nötronun içinde Kuark Bebekler yaşar, Gluon Dede onları bir arada tutar, Foton Postacı ise ışık hızında haber taşır.

---

## Ne yapar?

Uygulamaya e-posta ve şifreyle kayıt olan öğrenci, giriş yaptıktan sonra beş bölüme ulaşır:

| Bölüm | Öğrenci ne yapar? |
|---|---|
| **Atomu keşfet** | Hareketli bir lityum atomunu inceler, parçacıklara dokunarak karakter kartlarını açar. "Kuantum gözlüğü" ile elektronun olasılık bulutunu, "Protonun içi" ile kuarkları ve gluonları görür. |
| **Atom kur** | Hidrojenden oksijene beş görevde proton, nötron ve elektron ekleyerek atom kurar. Yanlışlarda neden yanlış olduğunu öğrenir. |
| **Foton yakala** | 45 saniyede doğru renkteki fotonları yakalayarak elektronun kat atlamasını (kuantum sıçraması) ve ışık saçmasını gözlemler. |
| **Bilgi yarışması** | 9 soruluk yarışmayla öğrendiklerini sınar, her sorudan sonra kısa açıklama okur. |
| **Gluon Dede'ye sor** | Merak ettiği soruyu yazar; yapay zekâ asistanı Gluon Dede çocuk diliyle, kısa ve doğru bir cevap verir. **Günlük 10 soru hakkı vardır.** |

Kazanılan yıldızlar, oyun sonuçları ve sorulan sorular veritabanına kaydedilir. Öğrenci **Panelim** sayfasında bugünkü kalan soru hakkını, son 7 günün kullanımını, oyun sonuçlarını ve son sorularını görür.

## Kim için?

- **Öğrenciler:** İlkokul 3 ve 4. sınıf öğrencileri ile atom konusuna ilk kez giriş yapan ortaokul öğrencileri. Metinler kısa, dil sade ve karakter odaklıdır.
- **Öğretmenler:** Fen bilimleri derslerinde "maddenin tanecikli yapısı" ve atom konularına hazırlık, akıllı tahtada sınıfça keşif ya da ödev olarak kullanım için.

## Hangi öğrenme çıktısını hedefliyor?

**Çözülen problem:** Atom gözle görülemeyen, soyut bir kavramdır. Çocuklar ders kitaplarındaki durağan çizimlerden atomun hareketli yapısını hayal etmekte zorlanır ve sık sık "elektron gezegen gibi döner" yanılgısına kapılır. Atom Ailesi bu soyut yapıyı tanıdık bir aile hikâyesine, dokunulabilir animasyonlara ve oyunlara dönüştürür.

Uygulamayı tamamlayan öğrenci şunları yapabilir:

1. Atomun çekirdek ve elektronlardan oluştuğunu, çekirdekte proton ve nötron bulunduğunu söyler.
2. Proton, nötron ve elektronun yüklerini (+, 0, −) eşleştirir.
3. Bir atomun hangi element olduğunu proton sayısının belirlediğini açıklar ve verilen proton sayısına göre atom kurar.
4. Proton ve elektron sayısı eşit olduğunda atomun nötr olduğunu fark eder.
5. Elektronun yerinin kesin olmadığını, "olasılık bulutu" ile anlatıldığını basit bir dille ifade eder.
6. Proton ve nötronun daha küçük parçacıklardan (kuarklar) oluştuğunu, gluonların onları bir arada tuttuğunu bilir.
7. Elektron üst enerji katından aşağı inerken ışık (foton) saçtığını bir örnekle açıklar.
8. Yapay zekâ asistanının yanılabileceğini, önemli bilgilerin öğretmene ve kitaba danışılması gerektiğini bilir (yapay zekâ okuryazarlığı).

## Nasıl kullanılır?

1. Canlı adresi aç. Ana sayfadaki **Giriş yap** kartını görürsün.
2. Hesabın yoksa **Hemen kayıt ol** bağlantısıyla adını, e-postanı ve en az 8 karakterlik bir şifre gir.
3. Giriş yapınca oyun açılır. Üstteki sekmelerden bölümler arasında geç.
4. **Gluon Dede'ye sor** sekmesinde sorunu yaz; sağdaki kartta kalan hakkını görürsün.
5. **Panelim** sayfasında yıldızlarını, kalan soru hakkını ve sonuçlarını takip et.
6. İşin bitince sağ üstteki **Çıkış yap** düğmesine bas.

---

## Teknik altyapı

| Katman | Kullanılan |
|---|---|
| Uygulama | Next.js 16 (App Router), React 19 |
| Barındırma | Vercel |
| Veritabanı | Vercel Marketplace üzerinden Neon Postgres (Vercel Postgres'in güncel hali) |
| Veritabanı istemcisi | `pg` (parametreli sorgular) |
| Şifreleme | `bcryptjs` (maliyet: 12) |
| Yapay zekâ | Google Gemini API (`generateContent`), yalnızca sunucudan çağrılır |
| Grafikler | HTML Canvas 2D, harici kütüphane yok |

### Güvenlik

- **API anahtarı kodda yok.** `GEMINI_API_KEY` yalnızca Vercel ortam değişkenlerinde durur. Tarayıcı Gemini'ye hiç bağlanmaz; tüm çağrılar `app/api/sor/route.js` sunucu yolundan geçer.
- **Şifreler düz metin saklanmaz.** Kayıtta bcrypt özeti alınır, girişte özet karşılaştırılır.
- **Oturum yönetimi:** Girişte rastgele 32 baytlık anahtar üretilir ve `HttpOnly`, `SameSite=Lax`, canlıda `Secure` bir çereze yazılır. Veritabanında anahtarın kendisi değil SHA-256 özeti tutulur. Oturum 7 gün sonra biter; çıkışta veritabanından silinir.
- **Yetkilendirme:** `/oyun` ve `/panel` sayfaları her istekte oturumu sunucuda kontrol eder; giriş yoksa ana sayfaya yönlendirir. `/api/sor` ve `/api/ilerleme` giriş yoksa `401` döndürür.
- **Şifre tahminine karşı:** Aynı e-postayla 15 dakikada 5 hatalı denemeden sonra giriş geçici olarak durdurulur.
- **Girdi kontrolü:** Ad, e-posta, şifre, soru uzunluğu ve oyun puanları sunucuda doğrulanır. Tüm SQL sorguları parametrelidir.
- `.env.local` dosyası `.gitignore` ile depodan hariç tutulur; depoda yalnızca boş `.env.example` vardır.

### Kullanıcı başı kullanım limiti nasıl çalışır?

- Her kullanıcının **günlük 10 soru hakkı** vardır (`GUNLUK_SORU_LIMITI` ile değiştirilebilir).
- `kullanim` tablosunda her kullanıcı için her gün tek satır tutulur. Gün, **Türkiye saatine göre** hesaplanır ve hak gece 00.00'da yenilenir.
- Hak, tek bir SQL komutuyla düşülür (`INSERT ... ON CONFLICT ... DO UPDATE ... WHERE adet < limit`). Aynı anda iki soru gönderilse bile limit aşılamaz.
- Hak yoksa Gemini'ye hiç istek gönderilmez; kullanıcıya "Bugünlük soru hakkın doldu" mesajı gösterilir ve soru kutusu kapanır.
- Gemini hata verirse kullanılan hak geri iade edilir; çocuk boşuna hak kaybetmez.
- Kalan hak hem sohbet ekranında hem de **Panelim** sayfasında görünür; panelde son 7 günün grafiği ve yenilenmeye kalan süre de yer alır.

### Veritabanı tabloları

| Tablo | Ne saklar? |
|---|---|
| `kullanicilar` | Ad, e-posta, şifre özeti, üyelik tarihi |
| `oturumlar` | Oturum anahtarının özeti, kullanıcı, bitiş zamanı |
| `ilerleme` | Biten görev ve oyunlar: oyun adı, yıldız, puan |
| `kullanim` | Kullanıcı + gün başına kullanılan soru sayısı (kota) |
| `sorular` | Gluon Dede'ye sorulan sorular ve cevaplar |
| `giris_denemeleri` | Hatalı giriş denemeleri (15 dakikalık sınır için) |

Şemanın tamamı `db/sema.sql` dosyasındadır.

---

## Kurulum ve yayınlama

### 1. GitHub'a gönder

```bash
git remote add origin https://github.com/KULLANICI_ADIN/atom-ailesi.git
git push -u origin main
```

### 2. Vercel'de proje oluştur

1. [vercel.com](https://vercel.com) → **Add New → Project** → GitHub deposunu seç → **Deploy**.
2. Proje sayfasında **Storage** → **Create Database** → **Neon (Serverless Postgres)** → projeye bağla. `DATABASE_URL` ortam değişkeni otomatik eklenir.
3. **Settings → Environment Variables** bölümüne yapay zekâ anahtarını ekle:
   - `EVREN_API_KEY` → [EVREN Milli LLM Platformu](https://evren.ssyz.org.tr/api-keys) üzerinden aldığın anahtar (Önerilen)
   - *veya* `GEMINI_API_KEY` → [Google AI Studio](https://aistudio.google.com/apikey) üzerinden aldığın anahtar
4. **Deployments** → son yayının yanındaki menüden **Redeploy** de.

### 3. Tabloları oluştur

En kolay yol: Vercel → **Storage** → veritabanın → **Open in Neon** → **SQL Editor**. `db/sema.sql` dosyasının içeriğini yapıştır ve **Run** de.

Alternatif olarak bilgisayarından:

```bash
npm install
npx vercel link
npx vercel env pull .env.local
npm run db:kur
```

### 4. Bilgisayarında çalıştır

```bash
cp .env.example .env.local   # değerleri doldur
npm install
npm run dev
```

### Ortam değişkenleri

| Değişken | Zorunlu mu? | Açıklama |
|---|---|---|
| `DATABASE_URL` | Evet | Neon Postgres bağlantı adresi (Vercel otomatik ekler) |
| `EVREN_API_KEY` | Evet* | EVREN API anahtarı (`evren_llm_...`); yalnızca sunucuda kullanılır |
| `EVREN_MODEL` | Hayır | Varsayılan `deepseek-v4.1-flash` |
| `GEMINI_API_KEY` | Evet* | Alternatif olarak Gemini API anahtarı |
| `GEMINI_MODEL` | Hayır | Varsayılan `gemini-3.5-flash` |
| `AI_PROVIDER` | Hayır | Tercih edilen sağlayıcı (`evren` veya `gemini`) |
| `GUNLUK_SORU_LIMITI` | Hayır | Kullanıcı başı günlük soru hakkı, varsayılan `10` |

*\*`EVREN_API_KEY` veya `GEMINI_API_KEY` ikilisinden en az birinin tanımlı olması yeterlidir.*

---

## Proje yapısı

```
app/
  page.js               Ana sayfa: tanıtım + giriş formu
  kayit/page.js         Kayıt sayfası
  oyun/page.js          Oyun (yalnızca giriş yapanlara açık)
  panel/page.js         Kullanıcı paneli: kota, yıldızlar, sonuçlar
  api/kayit, giris, cikis, ilerleme, sor   Sunucu yolları
components/             Oyun, formlar, sohbet ve menü bileşenleri
lib/
  oyun-motoru.js        Tuval çizimleri ve dört oyunun mantığı
  oturum.js             Oturum açma, kontrol ve kapatma
  kota.js               Günlük kullanım limiti
  yapayzeka.js          Gemini çağrısı ve Gluon Dede talimatı
  db.js                 Veritabanı bağlantısı
db/sema.sql             Tablolar
scripts/db-kur.mjs      Tabloları oluşturan betik
```

## Geliştirme süreci (iterasyonlar)

| İterasyon | Ne değişti? | Neden? |
|---|---|---|
| 1 | Tek dosyalık `atom.html` oyunu Next.js projesine taşındı, oyun mantığı ayrı bir modüle ayrıldı. | Sunucu katmanı, veritabanı ve giriş ekleyebilmek için uygulama çatısı gerekiyordu. |
| 2 | Neon Postgres, kayıt/giriş/çıkış, korumalı oyun sayfası ve yıldızların kaydı eklendi. | Öğrencinin ilerlemesi kaybolmasın, uygulama yalnızca sınıftaki kayıtlı öğrencilere açık olsun. |
| 3 | Gluon Dede yapay zekâ asistanı, günlük kota ve kullanıcı paneli eklendi; mobil düzen iyileştirildi. | Çocukların merakını beslemek; yapay zekâ maliyetini ve ekran süresini sınırlamak. |
| 4 | Hareketli karşılama görseli, güvenlik başlıkları, hatalı giriş sınırı ve bu README eklendi. | Marka hissini güçlendirmek ve yayın öncesi güvenliği sıkılaştırmak. |

Ayrıntılar için: `git log`

## Yapay zekâ araçlarıyla geliştirme

Bu proje, Yapay Zekâ Uygulamaları dersi kapsamında yapay zekâ araçlarıyla birlikte geliştirildi. Atom modeli görseli ve animasyon denemeleri için Gemini; oyunun ilk HTML sürümü, Next.js'e taşınması, veritabanı ve güvenlik katmanı için Claude kullanıldı. Ürün kararları, karakter hikâyesi, test ve sınıf içi deneme proje sahibine aittir.

## Yayın öncesi kontrol listesi

- [ ] Uygulama önizlemede hatasız çalışıyor, ana akış baştan sona test edildi
- [ ] Tüm metinler Türkçe ve yazım hataları düzeltildi
- [ ] Kodda ve depoda API anahtarı yok (anahtar yalnızca Vercel ortam değişkenlerinde)
- [ ] Neon Postgres bağlantısı çalışıyor, tablolar oluşturuldu
- [ ] Kayıt olma ve giriş yapma akışı sorunsuz
- [ ] Oyun ve panel yalnızca giriş yapmış kullanıcılara açık
- [ ] Günlük soru limiti çalışıyor, limit dolunca mesaj görünüyor
- [ ] Görsel kimlik tutarlı (renkler, yazı tipleri, düğmeler)
- [ ] README dolduruldu: ne yapar, kim için, nasıl kullanılır
- [ ] Canlı adres telefonda denendi

## Gelecek iterasyon fikirleri

- Öğretmen hesabı: sınıftaki öğrencilerin ilerlemesini tek ekranda görme
- Gluon Dede'nin cevaplarını sesli okuma
- Yeni bölüm: iyonlar ve izotoplar
- Şifremi unuttum akışı

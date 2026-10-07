# Atom Ailesi

İlkokul öğrencileri için atomun yapısını oyunlarla öğreten eğitim uygulaması.

Atomun parçacıkları bir ailenin üyeleri olarak anlatılır: Anne Proton, Baba Nötron, Elektron Kardeşler, Kuark Bebekler, Gluon Dede ve Foton Postacı. Uygulamada dört bölüm vardır: Atomu keşfet, Atom kur, Foton yakala ve Bilgi yarışması.

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini aç.

## Veritabanı ve giriş (İterasyon 2)

Uygulama artık kullanıcı hesabı istiyor. Tabloları oluşturmak için `db/sema.sql` dosyasını Neon SQL Editor'da çalıştır ya da `npm run db:kur` komutunu kullan. Bağlantı bilgisi `DATABASE_URL` ortam değişkeninden okunur.

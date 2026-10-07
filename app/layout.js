import './globals.css';

export const metadata = {
  title: { default: 'Atom Ailesi', template: '%s | Atom Ailesi' },
  description: 'İlkokul öğrencileri için atomun yapısını oyunlarla öğreten eğitim uygulaması.'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#161A45'
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;700;800&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}

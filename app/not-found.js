import Link from 'next/link';

export default function Bulunamadi() {
  return (
    <main className="ortala">
      <div className="card">
        <h2>Bu sayfa bulunamadı</h2>
        <p>Aradığın sayfa atomun içinde bile yok! Ana sayfaya dönüp tekrar dene.</p>
        <div className="btn-row"><Link className="btn" href="/">Ana sayfaya dön</Link></div>
      </div>
    </main>
  );
}

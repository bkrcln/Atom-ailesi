'use client';

export default function Hata({ reset }) {
  return (
    <main className="ortala">
      <div className="card">
        <h2>Bir şeyler ters gitti</h2>
        <p>Atom Ailesi şu an bu sayfayı açamadı. Biraz bekleyip tekrar dene.</p>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => reset()}>Tekrar dene</button>
          <a className="btn ghost" href="/">Ana sayfaya dön</a>
        </div>
      </div>
    </main>
  );
}

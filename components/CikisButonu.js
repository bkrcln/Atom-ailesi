'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CikisButonu() {
  const router = useRouter();
  const [bekliyor, setBekliyor] = useState(false);

  async function cik() {
    setBekliyor(true);
    try {
      await fetch('/api/cikis', { method: 'POST' });
    } finally {
      router.replace('/?cikis=1');
      router.refresh();
    }
  }

  return (
    <button type="button" className="btn ghost small" onClick={cik} disabled={bekliyor}>
      {bekliyor ? 'Çıkılıyor…' : 'Çıkış yap'}
    </button>
  );
}

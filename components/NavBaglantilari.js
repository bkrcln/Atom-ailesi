'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BAGLANTILAR = [
  { href: '/oyun', ad: 'Oyun' },
  { href: '/panel', ad: 'Panelim' }
];

export default function NavBaglantilari() {
  const yol = usePathname();
  return (
    <nav className="nav" aria-label="Ana menü">
      {BAGLANTILAR.map(b => (
        <Link key={b.href} href={b.href} aria-current={yol === b.href ? 'page' : undefined}>{b.ad}</Link>
      ))}
    </nav>
  );
}

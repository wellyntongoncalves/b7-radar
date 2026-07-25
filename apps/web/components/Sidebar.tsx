'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

// Módulos internos do B7 Radar (produto único; nomes funcionam como seções).
const GROUPS: NavGroup[] = [
  { title: 'Visão geral', items: [{ href: '/', label: 'Dashboard' }] },
  {
    title: 'Módulos',
    items: [
      { href: '/radar', label: 'B7 Radar' },
      { href: '/margem', label: 'B7 Margem' },
      { href: '/monitor', label: 'B7 Monitor' },
      { href: '/trends', label: 'B7 Trends' },
      { href: '/seller', label: 'B7 Seller' },
      { href: '/data', label: 'B7 Data' },
    ],
  },
  { title: 'Conta', items: [{ href: '/conta', label: 'Preferências' }] },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="b7-sidebar">
      <div className="b7-sidebar__brand">
        <svg className="b7-logo" viewBox="0 0 64 64" role="img" aria-label="B7 Radar">
          <defs>
            <linearGradient id="b7mark" x1="10" y1="10" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#2457FF" />
              <stop offset="0.55" stopColor="#6D35FF" />
              <stop offset="1" stopColor="#19C9E8" />
            </linearGradient>
          </defs>
          <g fill="url(#b7mark)">
            <rect x="13" y="13" width="9" height="9" rx="2.5" />
            <rect x="24" y="13" width="9" height="9" rx="2.5" />
            <rect x="35" y="13" width="9" height="9" rx="2.5" />
            <rect x="46" y="13" width="9" height="9" rx="2.5" />
            <rect x="35" y="24" width="9" height="9" rx="2.5" />
            <rect x="27" y="35" width="9" height="9" rx="2.5" />
            <rect x="19" y="46" width="9" height="9" rx="2.5" />
          </g>
        </svg>
        <div>
          <strong>B7 Radar</strong>
          <span>Inteligência por Bloco 7</span>
        </div>
      </div>
      {GROUPS.map((g) => (
        <div className="b7-nav-group" key={g.title}>
          <div className="b7-nav-group__title">{g.title}</div>
          {g.items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="b7-nav-link"
              aria-current={pathname === it.href ? 'page' : undefined}
            >
              {it.label}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}

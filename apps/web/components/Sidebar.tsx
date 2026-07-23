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
        <div className="b7-logo" aria-hidden />
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

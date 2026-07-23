import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Sidebar } from '../components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'B7 Radar — Inteligência de mercado por Bloco 7',
  description: 'Dados organizados. Decisões mais fortes.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="b7-shell">
          <Sidebar />
          <main className="b7-main">{children}</main>
        </div>
      </body>
    </html>
  );
}

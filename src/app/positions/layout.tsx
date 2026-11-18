import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TS1 – Mercado de Posições & Ordens de Pitwall',
  description: 'Terminal de abertura e consolidação de posições táticas de telemetria para o próximo Grande Prêmio.',
};

export default function PositionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

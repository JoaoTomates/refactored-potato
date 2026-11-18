import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pitwall Global // Matriz Operacional de Garagens & Alianças',
  description: 'Central de telemetria e alocação de cockpits da Fórmula 1 – TS1 2026',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

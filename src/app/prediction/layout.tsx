import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VoltGrid – Terminal de Predições de Pitwall',
  description: 'Transmissão de ordens táticas de telemetria, duelos de pilotos e previsões para o próximo Grande Prêmio.',
};

export default function PredictionLayout({ children }: { children: React.ReactNode }) {
  return children;
}

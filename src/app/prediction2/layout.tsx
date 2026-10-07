import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VoltGrid – Terminal de Predições de Pitwall (V2)',
  description: 'Transmissão de ordens táticas de telemetria, duelos de pilotos e previsões para o próximo Grande Prêmio com cores de seleção.',
};

export default function Prediction2Layout({ children }: { children: React.ReactNode }) {
  return children;
}

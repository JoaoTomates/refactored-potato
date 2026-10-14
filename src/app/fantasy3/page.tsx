import type { Metadata } from 'next';
import Fantasy3Client from './fantasy3-client';

export const metadata: Metadata = {
  title: 'VoltGrid | Fantasy 3 – Minimal',
  description: 'Versão minimalista da central de ligas e competições Fantasy, mantendo o estilo noir.',
};

export default function Fantasy3Page() {
  return (
    <main className="w-full min-h-screen bg-[#050401] p-0 m-0">
      <Fantasy3Client />
    </main>
  );
}

import React from 'react';
import type { Metadata } from 'next';
import FantasyClient from './fantasy-client';

export const metadata: Metadata = {
  title: 'BAEFF1 | Central de Ligas & Competições Fantasy 2026',
  description: 'Acompanhe as tabelas, resultados de rodadas e regras de pontuação de Poletime, Master League, Milesimus e Teamwork.',
};

export default function FantasyPage() {
    return (
        <main className="w-full min-h-screen bg-[#050401] p-0 m-0">
            <FantasyClient />
        </main>
    );
}

import React from 'react';
import type { Metadata } from 'next';
import FantasyClient from './fantasy-client';

export const metadata: Metadata = {
  title: 'VoltGrid | Fantasy (Legacy v1)',
  description: 'Versão legada das competições e regras do VoltGrid Fantasy.',
};

export default function FantasyPage() {
    return (
        <main className="w-full max-w-5xl mx-auto p-4 md:p-8 pt-6 pb-24 min-h-screen">
            <FantasyClient />
        </main>
    );
}

"use client";

import React, { useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import Link from 'next/link';

// Minimal list of competitions
const COMPETITIONS = [
  { id: 'poletime', name: 'Poletime Competition' },
  { id: 'master', name: 'Master League' },
  { id: 'milesimus', name: 'Milesimus League' },
  { id: 'teamwork', name: 'Teamwork Competition' },
];

export default function FantasyClient() {
  const { user } = useSupabaseAuth();

  const userDisplay = user ? `${user.first_name?.charAt(0) || ''}.${user.last_name?.toUpperCase() || ''}` : 'L.GUSTAVO';

  return (
    <div className="min-h-screen bg-[#050401] text-white font-mono p-4">
      {/* Header */}
      <header className="border-b border-white/10 pb-3 mb-4">
        <h1 className="text-2xl font-black uppercase tracking-widest">Fantasy (Legacy) – Minimal</h1>
        <p className="text-sm text-white/60">Piloto ativo: {userDisplay}</p>
      </header>

      {/* Competition list */}
      <ul className="space-y-2">
        {COMPETITIONS.map((c) => (
          <li key={c.id}>
            <Link
              href={`/fantasy2/${c.id}`}
              className="block w-full text-center py-2 bg-[#fbaa19]/20 hover:bg-[#fbaa19]/40 border border-[#fbaa19] rounded text-[#fbaa19] font-bold uppercase tracking-widest"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <footer className="mt-8 border-t border-white/10 pt-3 text-xs text-white/40">
        <p>Regra de Ouro – O pregão encerra no início do Q1 (Qualifying). Prioridade de desempate: ordem de envio.</p>
      </footer>
    </div>
  );
}

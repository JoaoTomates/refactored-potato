"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/utils/supabase';

// Minimal name formatter (includes optional driver number)
function formatPilotName(firstName?: string | null, lastName?: string | null, driverNumber?: string | null, fallback?: string | null): string {
  if (firstName && lastName) {
    const initial = firstName.trim().charAt(0).toUpperCase();
    const cleanLast = lastName.trim().toUpperCase().replace(/\s+/g, '');
    const num = driverNumber ? driverNumber.replace(/\D/g, '') : '';
    return `${initial}.${cleanLast}${num}`;
  }
  if (firstName && !lastName) {
    const num = driverNumber ? driverNumber.replace(/\D/g, '') : '';
    return `${firstName.trim().toUpperCase()}${num}`;
  }
  if (fallback) {
    const clean = fallback.replace(/^@/, '').trim().toUpperCase();
    return clean;
  }
  return 'PILOTO';
}

// Simple mock data for Poletime results (can be extended later)
const MOCK_POLETIME_RESULTS = [
  { pos: 1, pilot: 'L.GUSTAVO', team: 'McLaren', points: 5000 },
  { pos: 2, pilot: 'C.LECLERC', team: 'Ferrari', points: 4995 },
  { pos: 3, pilot: 'M.VERSTAPPEN', team: 'Red Bull', points: 4988 },
];

// Configuração das Competições oficiais
type CompetitionKey = 'poletime' | 'master' | 'milesimus' | 'teamwork';

interface CompetitionDef {
  id: CompetitionKey;
  code: string;
  title: string;
  subtitle: string;
  badge: string;
  desc: string;
}

const COMPETITIONS: CompetitionDef[] = [
  {
    id: 'poletime',
    code: 'POLE',
    title: 'POLETIME COMPETITION',
    subtitle: 'PRECISÃO MILIMÉTRICA NO Q3',
    badge: 'CIRÚRGICO',
    desc: 'Desafio individual contra o relógio: adivinhe o tempo exato da pole position até os milésimos de segundo.',
  },
  {
    id: 'master',
    code: 'MASTER',
    title: 'MASTER LEAGUE',
    subtitle: 'O GRID FECHADO DE 22 PILOTOS',
    badge: 'LIGA OFICIAL',
    desc: 'Micro-campeonato fechado dentro do seu grupo de 22 assentos com pontuação oficial TS1 e desempate em 3 camadas táticas.',
  },
  {
    id: 'milesimus',
    code: 'MILES',
    title: 'MILESIMUS LEAGUE',
    subtitle: 'RANKING GERAL SUPREMO',
    badge: 'GLOBAL',
    desc: 'A somatória absoluta de todo o repertório técnico de cada estrategista ao longo de toda a temporada mundial.',
  },
  {
    id: 'teamwork',
    code: 'TEAM',
    title: 'TEAMWORK COMPETITION',
    subtitle: 'GUERRA DE ESCUDERIAS & BLOCOS',
    badge: 'ALIANÇAS',
    desc: 'A disputa entre os construtores e alianças de motores da F1. Cada ponto conquistado soma para a honra da sua equipe.',
  },
];

export default function Fantasy3Client() {
  const { user } = useSupabaseAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeComp, setActiveComp] = useState<CompetitionKey>('poletime');

  // Load real user profile (if any)
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, driver_number')
        .eq('id', user.id)
        .single();
      if (data) setUserProfile(data);
    };
    fetch();
  }, [user]);

  const userDisplay = useMemo(() => {
    if (!userProfile) return 'L.GUSTAVO88';
    return formatPilotName(
      userProfile.first_name,
      userProfile.last_name,
      userProfile.driver_number,
      userProfile.slug
    );
  }, [userProfile]);

  return (
    <div className="w-full min-h-screen bg-[#050401] text-white font-mono relative overflow-x-hidden selection:bg-[#fbaa19] selection:text-black">
      {/* Simple background pixel art – keep noir feel */}
      <img
        src="/pixel_invite_bg_v2.jpg"
        alt=""
        className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 pointer-events-none opacity-30"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Header */}
      <header className="border-b border-white/10 bg-black/85 backdrop-blur-md px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black uppercase tracking-wider text-[#fbaa19]">
            Fantasy 3 – Minimal
          </h1>
          <span className="text-sm text-white/70 uppercase">
            Piloto ativo: <strong>{userDisplay}</strong>
          </span>
        </div>
      </header>

      {/* Console seletor de competições (Centralizado com largura máxima para tablet: max-w-4xl) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 w-full flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
          {COMPETITIONS.map((comp) => {
            const isSelected = activeComp === comp.id;
            return (
              <button
                key={comp.id}
                onClick={() => setActiveComp(comp.id)}
                className={`relative p-4 rounded-lg text-left transition-all duration-200 border flex flex-col justify-between overflow-hidden group cursor-pointer ${
                  isSelected
                    ? 'bg-black/85 border-[#fbaa19] shadow-[0_0_20px_rgba(251,170,25,0.2)]'
                    : 'bg-black/50 border-white/10 hover:border-white/30 hover:bg-black/70'
                }`}
              >
                {/* Linha decorativa no topo quando selecionado */}
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fbaa19] via-amber-300 to-[#fbaa19]"></div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-black tracking-widest uppercase ${
                        isSelected ? 'bg-[#fbaa19] text-black' : 'bg-white/10 text-white/60'
                      }`}
                    >
                      [{comp.code}]
                    </span>
                    <span className="text-[10px] tracking-widest text-white/40 uppercase font-semibold">
                      {comp.badge}
                    </span>
                  </div>

                  <h3
                    className={`text-base font-black uppercase tracking-wider transition-colors ${
                      isSelected ? 'text-[#fbaa19]' : 'text-white group-hover:text-white'
                    }`}
                  >
                    {comp.title}
                  </h3>
                  <p className="text-[10px] text-white/50 tracking-wider uppercase mt-0.5">
                    {comp.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-white/40 line-clamp-1">{comp.desc}</span>
                  <span
                    className={`text-xs ml-2 font-bold whitespace-nowrap ${
                      isSelected ? 'text-[#fbaa19]' : 'text-white/30'
                    }`}
                  >
                    {isSelected ? '● ATIVO' : '○ VER'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area – only Poletime results for demo */}
      {activeComp === 'poletime' && (
        <section className="max-w-4xl mx-auto py-4">
          <table className="w-full text-left border border-white/10">
            <thead className="bg-black/70">
              <tr>
                <th className="p-2">Pos</th>
                <th className="p-2">Piloto</th>
                <th className="p-2">Equipe</th>
                <th className="p-2">Pts</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_POLETIME_RESULTS.map((r) => (
                <tr key={r.pos} className="border-t border-white/5">
                  <td className="p-2">{r.pos}</td>
                  <td className="p-2 text-[#fbaa19] font-bold">{r.pilot}</td>
                  <td className="p-2">{r.team}</td>
                  <td className="p-2">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

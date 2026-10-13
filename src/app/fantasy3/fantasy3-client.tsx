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

export default function Fantasy3Client() {
  const { user } = useSupabaseAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeComp, setActiveComp] = useState<'poletime' | 'master' | 'milesimus' | 'teamwork'>('poletime');

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
    if (!userProfile) return 'L.GUSTAVO';
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
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-black uppercase tracking-wider text-[#fbaa19]">
            Fantasy 3 – Minimal
          </h1>
          <span className="text-sm text-white/70 uppercase">
            Piloto ativo: <strong>{userDisplay}</strong>
          </span>
        </div>
      </header>

      {/* Competition selector – grid of 4 buttons, minimal styling */}
      <section className="max-w-4xl mx-auto py-6 grid grid-cols-2 gap-4">
        {['poletime', 'master', 'milesimus', 'teamwork'].map((c) => (
          <button
            key={c}
            onClick={() => setActiveComp(c as any)}
            className={`p-4 rounded border ${
              activeComp === c
                ? 'bg-[#fbaa19] text-black border-[#fbaa19]'
                : 'bg-black/60 border-white/10 hover:bg-black/80 hover:border-white/30'
            }`}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </section>

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

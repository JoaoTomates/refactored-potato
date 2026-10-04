"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const ENGINE_FACTIONS: Record<'A' | 'B' | 'C', any> = {
  A: {
    badge: 'BLOCO A',
    title: 'CONSÓRCIO DA ESTRELA',
    teams: ['MER', 'MCL', 'ALP', 'WIL'],
    description: 'Voce chamou a atencao da maior frota da Alemanha. Analise as ofertas e assine com sua nova garagem.'
  },
  B: {
    badge: 'BLOCO B',
    title: 'A DINASTIA DE MARANELLO',
    teams: ['FER', 'HAA', 'CAD'],
    description: 'A paixao italiana e a agressividade americana querem voce no pitwall. Onde voce vai assinar?'
  },
  C: {
    badge: 'BLOCO C',
    title: 'OS DESAFIANTES',
    teams: ['RBR', 'RBA', 'AST', 'AUD'],
    description: 'O caos e uma escada. As montadoras desafiantes enviaram propostas. Faca sua escolha.'
  }
};

const TEAM_COLORS: Record<string, string> = {
    MCL: '#FF8000', MER: '#00D2BE', WIL: '#005AFF', ALP: '#FD4BC7',
    FER: '#DC0000', HAA: '#FFFFFF', CAD: '#C8A2C8',
    RBR: '#0600EF', RBA: '#2B4562', AST: '#229971', AUD: '#F50537'
};

function pickTwoRandom(arr: any[]) {
    if (arr.length <= 2) return arr;
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
}

function HeadquartersFlow() {
    const router = useRouter();
    const { user, isLoading } = useSupabaseAuth();
    
    const [teams, setTeams] = useState<any[]>([]);
    const [allianceInfo, setAllianceInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [signingId, setSigningId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const initHQ = async () => {
            if (isLoading) return;
            if (!user) {
                window.location.replace('/superlicense');
                return;
            }

            try {
                const { data: contract } = await supabase.from('contracts').select('id').eq('profile_id', user.id).maybeSingle();
                if (contract) {
                    const { data: profile } = await supabase.from('profiles').select('slug').eq('id', user.id).single();
                    if (profile?.slug) {
                        window.location.replace('/' + profile.slug);
                        return;
                    }
                }

                let pref = user.user_metadata?.alliance_id;
                if (!pref) {
                    pref = localStorage.getItem('draft_alliance') || 'A';
                }
                
                const alliance = ENGINE_FACTIONS[pref as 'A' | 'B' | 'C'] || ENGINE_FACTIONS['A'];
                setAllianceInfo(alliance);

                const { data: teamsData, error: tErr } = await supabase.from('teams').select('*');
                if (tErr) throw tErr;

                let available = teamsData.filter(t => alliance.teams.includes(t.code) && t.is_available);
                if (available.length === 0) {
                    available = teamsData.filter(t => alliance.teams.includes(t.code));
                }

                const offeredTeams = pickTwoRandom(available);
                setTeams(offeredTeams);
            } catch (err: any) {
                console.error(err);
                setErrorMsg(err.message || "Erro ao carregar ofertas.");
            } finally {
                setLoading(false);
            }
        };
        initHQ();
    }, [user, isLoading]);

    const handleSignContract = async (teamId: string) => {
        setSigningId(teamId);
        setErrorMsg('');
        try {
            const { error: rpcError } = await supabase.rpc('sign_initial_contract', { p_team_id: teamId });
            if (rpcError) throw rpcError;

            await supabase.from('profiles').update({ setup_completed: true }).eq('id', user!.id);

            const { data } = await supabase.from('profiles').select('slug').eq('id', user!.id).single();
            window.location.replace('/' + (data?.slug || 'superlicense'));
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Falha ao assinar contrato.");
            setSigningId(null);
        }
    };

    if (isLoading || loading) {
        return (
            <div className="w-full min-h-screen bg-[#050401] flex flex-col items-center justify-center font-mono">
                <div className="w-12 h-12 border-4 border-[#fbaa19] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[#fbaa19] font-bold tracking-widest uppercase text-xs animate-pulse">VERIFICANDO DISPONIBILIDADE NO GRID...</p>
            </div>
        );
    }

    return (
        <main className="w-full min-h-screen bg-[#050401] relative flex flex-col font-mono overflow-x-hidden pt-12 pb-24">
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)', backgroundSize: '100% 4px' }}></div>
            
            <div className="w-full max-w-4xl mx-auto px-4 relative z-10 flex flex-col gap-8">
                
                <div className="bg-black/80 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg p-6 md:p-8 shadow-2xl">
                    <p className="text-[#fbaa19] font-black tracking-[0.2em] uppercase text-xs mb-2">SISTEMA DE RECRUTAMENTO DE ESTRATEGISTAS</p>
                    <h1 className="text-white text-2xl md:text-3xl font-black uppercase tracking-widest mb-4">
                        PROPOSTAS DE CONTRATO
                    </h1>
                    <div className="border-l-2 border-[#fbaa19] pl-4 flex flex-col gap-3">
                        <p className="text-gray-300 text-sm md:text-base leading-relaxed italic">
                            "{allianceInfo?.description}"
                        </p>
                        <p className="text-[#fbaa19] text-xs uppercase tracking-widest font-bold">
                            &gt; DIRETRIZ: Preenchimento prioritario do Grupo 1 (Giuseppe Farina). A relacao estrategica nao e atrelada diretamente aos pilotos, mas sim de ordem estrutural: cada vaga oficial nas garagens reais (Assento 1 e 2) possui uma correlacao direta 1:1 com a alocacao de estrategistas nos Grupos Fantasy. Analise as {teams.length} propostas abaixo e assuma o pitwall.
                        </p>
                    </div>
                </div>

                {errorMsg && (
                    <div className="bg-red-900/20 border border-red-500/50 p-4 rounded text-red-500 font-bold uppercase tracking-widest text-xs">
                        [ERRO] {errorMsg}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {teams.map((team) => (
                        <div key={team.id} className="bg-black/60 border border-white/10 hover:border-[#fbaa19]/50 hover:bg-black/80 transition-all rounded-lg p-6 flex flex-col gap-6 group">
                            
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded flex items-center justify-center font-black text-xl shadow-inner border border-white/20" style={{backgroundColor: TEAM_COLORS[team.code] || '#333', color: '#fff'}}>
                                    {team.code}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold uppercase tracking-widest text-lg">{team.name}</h3>
                                    <p className="text-gray-500 text-xs font-bold tracking-widest uppercase">Vaga: ESTRATEGISTA CHEFE</p>
                                </div>
                            </div>

                            <div className="flex-1 bg-[#111] border border-white/5 p-4 rounded text-xs text-gray-400 font-mono leading-relaxed">
                                &gt; Nivel de Acesso: TOTAL<br/>
                                &gt; Grupo Fantasy: GRUPO 1 (FARINA)<br/>
                                &gt; Status de Integracao: IMEDIATA<br/>
                                &gt; Contrato: TEMPORADA 2026
                            </div>

                            <button 
                                onClick={() => handleSignContract(team.id)}
                                disabled={!!signingId}
                                className="w-full bg-white/5 text-white border border-white/10 hover:bg-[#fbaa19] hover:text-black hover:border-[#fbaa19] font-black uppercase tracking-widest p-4 transition-all disabled:opacity-50"
                            >
                                {signingId === team.id ? 'ASSINANDO...' : 'ACEITAR OFERTA'}
                            </button>
                        </div>
                    ))}
                </div>

            </div>
        </main>
    );
}

export default function HeadquartersPage() {
    return (
        <Suspense fallback={<div className="w-full h-screen bg-black" />}>
            <HeadquartersFlow />
        </Suspense>
    );
}

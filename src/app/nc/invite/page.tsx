"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { ENGINE_FACTIONS, ALLIANCE_KEYS } from '@/utils/alliance-data';
import { ArrowRight, ShieldCheck, Check, Sparkles, LogIn } from 'lucide-react';

export default function NewConceptInvitePage() {
    const router = useRouter();

    const [step, setStep] = useState<'ALLIANCE' | 'ENLIST' | 'SUCCESS'>('ALLIANCE');
    const [selectedAlliance, setSelectedAlliance] = useState<'A' | 'B' | 'C'>('B');
    
    // Form fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Previews do Golden Rule: L.GUSTAVO88 e slug @lgustavo88
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const previewCode = (firstName && lastName)
        ? `${firstName.charAt(0).toUpperCase()}.${lastName.toUpperCase().replace(/\s+/g, '')}88`
        : 'PILOTO.TS1';

    const previewSlug = (firstName && lastName)
        ? `@${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}88`
        : '@novo_estrategista';

    const handleSelectAlliance = (allianceId: 'A' | 'B' | 'C') => {
        setSelectedAlliance(allianceId);
        localStorage.setItem('draft_alliance', allianceId);
        setStep('ENLIST');
    };

    const handleEnlist = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (nameParts.length < 2) {
            setErrorMsg('Informe nome e sobrenome para emissão da Superlicença.');
            return;
        }

        if (!email || !email.includes('@')) {
            setErrorMsg('Informe um endereço de e-mail válido.');
            return;
        }

        setLoading(true);

        try {
            const cleanFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
            const cleanLastName = lastName.toUpperCase();
            const driverNum = 88;
            const initial = cleanFirstName.charAt(0).toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanLast = cleanLastName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const generatedSlug = `@${initial}${cleanLast}${driverNum}`;

            const userPassword = password.trim() || `Volt${Math.random().toString(36).slice(-6)}!`;

            localStorage.setItem('draft_name', `${cleanFirstName} ${cleanLastName}`);
            localStorage.setItem('draft_email', email.trim().toLowerCase());
            localStorage.setItem('draft_alliance', selectedAlliance);

            // 1. Cadastra no Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password: userPassword,
                options: {
                    emailRedirectTo: `${window.location.origin}/nc/headquarters`,
                    data: {
                        alliance_id: selectedAlliance,
                        first_name: cleanFirstName,
                        last_name: cleanLastName,
                        full_name: `${cleanFirstName} ${cleanLastName}`
                    }
                }
            });

            if (authError) throw authError;

            // 2. Cria o registro do perfil inicial se tiver ID
            if (authData.user) {
                await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    email: email.trim().toLowerCase(),
                    first_name: cleanFirstName,
                    last_name: cleanLastName,
                    org_color: '#000000',
                    setup_completed: false,
                    slug: generatedSlug,
                    mls_balance: 100,
                    driver_number: driverNum
                });

                // Tenta login direto se a confirmação de email estiver desativada ou automática
                try {
                    await supabase.auth.signInWithPassword({
                        email: email.trim().toLowerCase(),
                        password: userPassword
                    });
                } catch (_) {}

                router.push('/nc/headquarters');
                return;
            }

            setStep('SUCCESS');
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || 'Falha ao registrar Superlicença.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="w-full min-h-screen bg-[#050401] text-white font-mono flex flex-col justify-between p-4 sm:p-8 relative selection:bg-[#fbaa19] selection:text-black">
            
            {/* Topbar Minimalista */}
            <header className="w-full max-w-4xl mx-auto flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-black tracking-widest text-[#fbaa19]">
                        NC // RECRUTAMENTO TS1
                    </span>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest hidden sm:inline">
                        • CONCEITO MINIMALISTA
                    </span>
                </div>

                <Link
                    href="/superlicense"
                    className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors uppercase tracking-wider"
                >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Login</span>
                </Link>
            </header>

            {/* Conteúdo Central */}
            <div className="w-full max-w-2xl mx-auto my-auto py-8">
                
                {step === 'ALLIANCE' && (
                    <div className="flex flex-col gap-6 animate-fade-in">
                        <div className="text-center sm:text-left">
                            <span className="text-[10px] font-bold text-[#fbaa19] uppercase tracking-widest">
                                ETAPA 01 // SELEÇÃO DO BLOCO PROPULSOR
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1 text-white">
                                Escolha sua Aliança Técnica
                            </h1>
                            <p className="text-xs text-white/50 mt-1.5 max-w-lg leading-relaxed">
                                Seu estrategista será alocado a uma das escuderias parceiras que compartilham da mesma unidade de potência e bônus estratégico no campeonato.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {ALLIANCE_KEYS.map((key) => {
                                const faction = ENGINE_FACTIONS[key];
                                const isSelected = selectedAlliance === key;

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleSelectAlliance(key)}
                                        className={`p-5 rounded border text-left flex flex-col justify-between gap-4 transition-all cursor-pointer ${
                                            isSelected 
                                                ? 'bg-white/[0.07] border-[#fbaa19] shadow-[0_0_20px_rgba(251,170,25,0.15)]' 
                                                : 'bg-white/[0.02] border-white/10 hover:border-white/30'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black px-2 py-0.5 rounded bg-white/10 text-white">
                                                [{faction.badge}]
                                            </span>
                                            <span className="text-[10px] font-bold text-white/40 tracking-wider">
                                                ALIANÇA {key}
                                            </span>
                                        </div>

                                        <div>
                                            <h2 className="text-sm font-black text-white uppercase tracking-wider">
                                                {faction.title}
                                            </h2>
                                            <p className="text-[11px] text-[#fbaa19] mt-1 font-bold">
                                                {faction.engineSpec}
                                            </p>
                                            <p className="text-[10px] text-white/50 mt-2 leading-relaxed">
                                                {faction.description}
                                            </p>
                                        </div>

                                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/60">
                                            <span>Equipes: {faction.teams.join(', ')}</span>
                                            <ArrowRight className="w-3 h-3 text-[#fbaa19]" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {step === 'ENLIST' && (
                    <div className="flex flex-col gap-6 animate-fade-in">
                        <div>
                            <button
                                type="button"
                                onClick={() => setStep('ALLIANCE')}
                                className="text-[10px] text-white/40 hover:text-white uppercase tracking-wider mb-2 cursor-pointer flex items-center gap-1"
                            >
                                &lt;&lt; Voltar para seleção de aliança
                            </button>
                            <span className="text-[10px] font-bold text-[#fbaa19] uppercase tracking-widest">
                                ETAPA 02 // SUPERLICENÇA TS1
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1 text-white">
                                Registro de Piloto e Estrategista
                            </h1>
                        </div>

                        {errorMsg && (
                            <div className="p-3 bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-bold uppercase tracking-wider">
                                [ERRO] {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleEnlist} className="flex flex-col gap-4">
                            <div>
                                <label className="text-[10px] text-white/50 uppercase tracking-widest block mb-1">
                                    Nome Completo (Piloto & Estrategista)
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Luiz Gustavo"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/15 focus:border-[#fbaa19] text-white px-4 py-3 text-xs tracking-wider outline-none rounded transition-colors"
                                />
                                {fullName.trim().length > 2 && (
                                    <div className="flex items-center gap-4 mt-2 text-[10px] text-white/40">
                                        <span>Padrão Oficial: <strong className="text-white">{previewCode}</strong></span>
                                        <span>Slug Privado: <strong className="text-[#fbaa19]">{previewSlug}</strong></span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] text-white/50 uppercase tracking-widest block mb-1">
                                    E-mail de Telemetria
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="seu.email@exemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/15 focus:border-[#fbaa19] text-white px-4 py-3 text-xs tracking-wider outline-none rounded transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-white/50 uppercase tracking-widest block mb-1">
                                    Senha de Acesso (Opcional - pode ser gerada automaticamente)
                                </label>
                                <input
                                    type="password"
                                    placeholder="Deixe em branco para senha automática"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/15 focus:border-[#fbaa19] text-white px-4 py-3 text-xs tracking-wider outline-none rounded transition-colors"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 bg-[#fbaa19] text-black font-black uppercase text-xs py-3.5 tracking-widest hover:bg-white transition-colors cursor-pointer flex items-center justify-center gap-2 rounded"
                            >
                                {loading ? (
                                    <span>EMITINDO SUPERLICENÇA...</span>
                                ) : (
                                    <>
                                        <span>HOMOLOGAR CREDENCIAL & ESCOLHER GARAGEM</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {step === 'SUCCESS' && (
                    <div className="text-center flex flex-col items-center gap-4 animate-fade-in">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                            <Check className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-black uppercase text-white tracking-wider">
                            Superlicença Enviada!
                        </h2>
                        <p className="text-xs text-white/60 max-w-md leading-relaxed">
                            Um link de confirmação foi transmitido para o endereço informado. Verifique sua caixa de entrada para acessar diretamente o Quartel-General.
                        </p>
                        <Link
                            href="/nc/headquarters"
                            className="mt-4 bg-[#fbaa19] text-black font-black text-xs uppercase px-6 py-3 tracking-widest hover:bg-white transition-colors rounded"
                        >
                            Ir para Quartel-General (NC)
                        </Link>
                    </div>
                )}

            </div>

            {/* Footer Minimalista */}
            <footer className="w-full max-w-4xl mx-auto flex items-center justify-between border-t border-white/10 pt-4 text-[10px] text-white/40 uppercase tracking-widest">
                <span>TS1 • REQUISITOS TÉCNICOS TEMPORADA 2026</span>
                <span>PADRÃO PRIVATIVO @INITIAL_LASTNAME</span>
            </footer>

        </main>
    );
}

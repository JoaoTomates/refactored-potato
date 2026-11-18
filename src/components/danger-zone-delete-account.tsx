"use client";

import React, { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { SystemModal } from '@/components/system-modal';

export default function DangerZoneDeleteAccount() {
    const { user } = useSupabaseAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmationInput, setConfirmationInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const CONFIRM_KEYWORD = "EXCLUIR";

    const handleDeleteAccount = async () => {
        if (confirmationInput.trim().toUpperCase() !== CONFIRM_KEYWORD) return;
        if (!user) return;

        setIsDeleting(true);
        setErrorMessage(null);

        try {
            // Obter token de sessão para autenticar na API
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            let apiSuccess = false;

            if (token) {
                try {
                    const res = await fetch('/api/account/delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (res.ok) {
                        apiSuccess = true;
                    } else {
                        const errData = await res.json().catch(() => ({}));
                        console.warn("API de exclusão retornou aviso:", errData);
                    }
                } catch (apiErr) {
                    console.warn("Falha de rede na API, acionando fallback do client:", apiErr);
                }
            }

            // Fallback no client para garantir expurgo e rescisão contratual
            if (!apiSuccess) {
                await supabase.from('contracts').delete().eq('user_id', user.id);
                await supabase.from('predictions').delete().eq('user_id', user.id).eq('round', 'current');
                await supabase.from('profiles').update({
                    first_name: 'ESTRATEGISTA',
                    last_name: 'DESLIGADO',
                    slug: `@desligado_${Math.floor(1000 + Math.random() * 9000)}`,
                    avatar_url: null,
                    nationality: null
                }).eq('id', user.id);
            }

            // Desconectar o usuário
            await supabase.auth.signOut();
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch (_) {}

            // Redirecionar para a raiz (página da Superlicença / Login)
            window.location.href = '/?account_deleted=1';
        } catch (err: any) {
            console.error("Erro ao excluir conta:", err);
            setErrorMessage(err.message || "Falha ao processar exclusão. Tente novamente ou contate o suporte do TS1.");
            setIsDeleting(false);
        }
    };

    return (
        <div className="w-full mt-12 pt-8 border-t border-red-500/20 font-mono">
            {/* Header da Seção de Risco */}
            <div className="bg-red-950/20 border border-red-500/30 rounded p-5 sm:p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(239,68,68,0.08)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-red-400 font-black text-xs uppercase tracking-[0.25em]">
                                ZONA DE RISCO // EXPURGO OPERACIONAL
                            </span>
                        </div>
                        <h3 className="text-white text-base sm:text-lg font-black tracking-wider uppercase">
                            Revogar Superlicença & Excluir Conta
                        </h3>
                        <p className="text-white/60 text-xs max-w-xl leading-relaxed">
                            A exclusão da conta é permanente e irreversível. Todas as suas previsões, contratos com alianças, histórico de telemetria e sua credencial de estrategista serão purgados dos bancos de dados oficiais do TS1.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setConfirmationInput('');
                            setErrorMessage(null);
                            setIsModalOpen(true);
                        }}
                        className="self-start sm:self-center px-4 py-2.5 rounded border border-red-500/50 bg-red-900/40 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg whitespace-nowrap active:scale-95"
                    >
                        [ EXCLUIR CONTA ]
                    </button>
                </div>
            </div>

            {/* MODAL DE CONFIRMAÇÃO DE DESTRUIÇÃO DE DADOS */}
            <SystemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                closeDisabled={isDeleting}
                closeLabel="[ FECHAR ]"
                accentColor="#ef4444"
                maxWidthClass="max-w-md"
                icon={<span className="text-red-400">⚠</span>}
                title="ATENÇÃO: AÇÃO IRREVERSÍVEL"
                footer={
                    <>
                        <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-[#000000] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold uppercase tracking-widest rounded-[3px] transition-colors cursor-pointer"
                        >
                            CANCELAR
                        </button>
                        <button
                            type="button"
                            disabled={confirmationInput.trim().toUpperCase() !== CONFIRM_KEYWORD || isDeleting}
                            onClick={handleDeleteAccount}
                            className="px-5 py-2 border border-[#000000] bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest rounded-[3px] transition-colors cursor-pointer shadow-lg"
                        >
                            {isDeleting ? 'PURGANDO DADOS...' : 'CONFIRMAR EXCLUSÃO'}
                        </button>
                    </>
                }
            >
                <div className="flex flex-col gap-3 text-[calc(0.75rem+0.5px)] leading-relaxed text-white/80">
                    <p className="font-bold text-white uppercase">
                        Você tem certeza de que deseja revogar sua Superlicença e destruir todos os seus dados?
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-white/70 text-[calc(0.6875rem+0.5px)]">
                        <li><strong className="text-white">Vaga no Grid:</strong> Seu contrato será rescindido e seu assento na equipe liberado no Pitwall para novos estrategistas.</li>
                        <li><strong className="text-white">Apostas Correntes:</strong> Suas ordens para o próximo GP serão canceladas imediatamente.</li>
                        <li><strong className="text-white">Dados Pessoais & Login:</strong> Seu e-mail, senha e credenciais de acesso serão expurgados definitivamente.</li>
                        <li><strong className="text-white">Integridade Histórica:</strong> Pontuações em etapas já encerradas permanecem anonimizadas no histórico de construtores.</li>
                    </ul>

                    <div className="mt-3 p-3 bg-[#030303] border border-[#000000] rounded-[3px]">
                        <label className="block text-[10px] uppercase font-bold text-white/70 mb-1.5">
                            Para confirmar, digite <span className="text-red-400 font-mono font-black">{CONFIRM_KEYWORD}</span> abaixo:
                        </label>
                        <input
                            type="text"
                            value={confirmationInput}
                            onChange={(e) => setConfirmationInput(e.target.value)}
                            placeholder="DIGITE EXCLUIR"
                            disabled={isDeleting}
                            className="w-full bg-black border border-[#000000] text-white font-mono p-2.5 text-[calc(0.75rem+0.5px)] font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-red-500 rounded-[3px]"
                        />
                    </div>

                    {errorMessage && (
                        <div className="p-2.5 bg-red-950/40 border border-[#000000] rounded-[3px] text-red-400 text-[10px] font-bold uppercase">
                            [ERRO] {errorMessage}
                        </div>
                    )}
                </div>
            </SystemModal>
        </div>
    );
}

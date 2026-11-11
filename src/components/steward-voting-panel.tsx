"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { getDriverDetails } from '@/api/f1-data';
import { DriverPixelPortrait } from '@/components/positions-hybrid-ui';
import { SystemModal } from '@/components/system-modal';
import {
    CATEGORY_META,
    StewardReport,
    StewardReportVote,
    StewardVoteChoice,
    formatCanonicalPilotTag,
    formatRelativeTimePt,
} from '@/lib/steward-reports';
import {
    AlertTriangle,
    ArrowRight,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    PlusCircle,
    ShieldAlert,
    ThumbsDown,
    ThumbsUp,
    X,
} from 'lucide-react';

export function useStewardVoting() {
    const { user } = useSupabaseAuth();
    const [reports, setReports] = useState<StewardReport[]>([]);
    const [myVotes, setMyVotes] = useState<Record<string, StewardVoteChoice>>({});
    const [voterName, setVoterName] = useState<string>('ESTRATEGISTA');
    const [loading, setLoading] = useState(true);
    const [votingReportId, setVotingReportId] = useState<string | null>(null);
    const [voteError, setVoteError] = useState<string>('');

    const refresh = useCallback(async () => {
        setLoading(true);
        const { data: repData } = await supabase
            .from('steward_reports')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (repData) {
            setReports(repData as StewardReport[]);
        }

        if (user) {
            const [votesRes, profRes] = await Promise.all([
                supabase
                    .from('steward_report_votes')
                    .select('report_id, vote')
                    .eq('voter_id', user.id),
                supabase
                    .from('profiles')
                    .select('first_name, last_name, driver_number, slug, username')
                    .eq('id', user.id)
                    .maybeSingle(),
            ]);

            if (votesRes.data) {
                const map: Record<string, StewardVoteChoice> = {};
                (votesRes.data as Pick<StewardReportVote, 'report_id' | 'vote'>[]).forEach((v) => {
                    map[v.report_id] = v.vote;
                });
                setMyVotes(map);
            }

            if (profRes.data) {
                setVoterName(
                    formatCanonicalPilotTag(
                        profRes.data.first_name,
                        profRes.data.last_name,
                        profRes.data.driver_number,
                        profRes.data.slug || profRes.data.username || user.email?.split('@')[0]
                    )
                );
            }
        } else {
            setMyVotes({});
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const castVote = useCallback(
        async (reportId: string, vote: StewardVoteChoice) => {
            if (!user) {
                setVoteError('Entre com sua Superlicença para registrar seu voto.');
                return;
            }
            setVotingReportId(reportId);
            setVoteError('');

            const { data, error } = await supabase.rpc('cast_steward_vote', {
                p_report_id: reportId,
                p_vote: vote,
                p_voter_name: voterName,
            });

            setVotingReportId(null);

            if (error) {
                setVoteError(`Falha ao registrar voto: ${error.message}`);
                return;
            }

            setMyVotes((prev) => ({ ...prev, [reportId]: vote }));
            if (data) {
                const updated = data as StewardReport;
                setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            } else {
                await refresh();
            }
        },
        [user, voterName, refresh]
    );

    const pendingReports = useMemo(
        () => reports.filter((r) => r.status === 'pending'),
        [reports]
    );

    const unvotedPendingCount = useMemo(
        () => pendingReports.filter((r) => !myVotes[r.id]).length,
        [pendingReports, myVotes]
    );

    return {
        reports,
        pendingReports,
        unvotedPendingCount,
        myVotes,
        loading,
        votingReportId,
        voteError,
        isAuthenticated: Boolean(user),
        refresh,
        castVote,
    };
}

export function StewardAlertBanner({
    pendingReports,
    unvotedCount,
    onOpenVoting,
    onOpenReport,
}: {
    pendingReports: StewardReport[];
    unvotedCount: number;
    onOpenVoting: () => void;
    onOpenReport: () => void;
}) {
    if (pendingReports.length === 0) return null;

    const latest = pendingReports[0];
    const meta = CATEGORY_META[latest.category];

    return (
        <div className="max-w-[1500px] mx-auto px-3 md:px-6 pt-3">
            <div className="rounded-lg border border-[#fbaa19]/65 bg-gradient-to-r from-[#1a1103] via-[#0e0b05] to-[#080a0d] px-4 py-3 shadow-[0_0_25px_rgba(251,170,25,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-[#fbaa19]/20 border border-[#fbaa19]/60 flex items-center justify-center text-[#fbaa19] shrink-0">
                        <AlertTriangle className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#fbaa19]">
                                ALERTA DE DIREÇÃO DE PROVA // {pendingReports.length} EM VOTAÇÃO
                            </span>
                            {unvotedCount > 0 && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                                    {unvotedCount} AGUARDANDO SEU VOTO
                                </span>
                            )}
                            <span
                                className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border"
                                style={{
                                    color: meta.color,
                                    backgroundColor: meta.bg,
                                    borderColor: meta.border,
                                }}
                            >
                                {meta.short}
                            </span>
                        </div>
                        <p className="text-xs font-bold text-white truncate mt-0.5">
                            {latest.title} — <span className="text-white/50 font-normal">por {latest.reporter_name}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={onOpenVoting}
                        className="px-3.5 py-2 rounded bg-[#fbaa19] text-black hover:bg-white font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
                    >
                        VOTAR AGORA ({pendingReports.length})
                    </button>
                    <button
                        type="button"
                        onClick={onOpenReport}
                        className="px-3 py-2 rounded border border-white/20 bg-white/5 hover:border-[#fbaa19] hover:text-[#fbaa19] text-white/80 font-bold text-[10px] uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-1"
                    >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Report</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export function StewardVotingModal({
    isOpen,
    onClose,
    reports,
    myVotes,
    votingReportId,
    voteError,
    isAuthenticated,
    onVote,
    onOpenReport,
}: {
    isOpen: boolean;
    onClose: () => void;
    reports: StewardReport[];
    myVotes: Record<string, StewardVoteChoice>;
    votingReportId: string | null;
    voteError: string;
    isAuthenticated: boolean;
    onVote: (reportId: string, vote: StewardVoteChoice) => void;
    onOpenReport: () => void;
}) {
    const [tab, setTab] = useState<'pending' | 'history'>('pending');

    if (!isOpen) return null;

    const visibleReports = reports.filter((r) =>
        tab === 'pending' ? r.status === 'pending' : r.status !== 'pending'
    );

    return (
        <SystemModal
            isOpen={isOpen}
            onClose={onClose}
            zIndexClass="z-[120]"
            maxWidthClass="max-w-3xl"
            alignTop={true}
            accentColor="#fbaa19"
            icon={<ShieldAlert className="w-5 h-5 text-[#fbaa19]" />}
            title="STEWARD VOTING // CONFIRMAÇÃO DO GRID"
            subtitle="Confirme ou conteste alterações reportadas pela comunidade (quórum: 3 votos)"
            bodyClassName="p-0 flex flex-col overflow-hidden"
        >
                {/* Tabs + CTA Report */}
                <div className="px-4 sm:px-6 py-2.5 bg-black/60 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setTab('pending')}
                            className={`px-3 py-1.5 rounded-[3px] text-[10px] font-black uppercase tracking-wider border cursor-pointer ${
                                tab === 'pending'
                                    ? 'bg-[#fbaa19] text-black border-[#000000]'
                                    : 'bg-white/5 text-white/60 border-[#000000] hover:text-white'
                            }`}
                        >
                            Em Votação ({reports.filter((r) => r.status === 'pending').length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('history')}
                            className={`px-3 py-1.5 rounded-[3px] text-[10px] font-black uppercase tracking-wider border cursor-pointer ${
                                tab === 'history'
                                    ? 'bg-[#fbaa19] text-black border-[#000000]'
                                    : 'bg-white/5 text-white/60 border-[#000000] hover:text-white'
                            }`}
                        >
                            Resolvidos ({reports.filter((r) => r.status !== 'pending').length})
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onOpenReport();
                        }}
                        className="px-3 py-1.5 rounded-[3px] border border-[#000000] bg-[#fbaa19]/10 hover:bg-[#fbaa19] text-[#fbaa19] hover:text-black text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                    >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Novo Report</span>
                    </button>
                </div>

                {/* Lista de Reports */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
                    {!isAuthenticated && (
                        <div className="p-3 rounded-[3px] border border-[#000000] bg-[#fbaa19]/10 flex items-center justify-between gap-2 text-xs">
                            <span className="text-[#fbaa19] font-bold">
                                Faça login na sua Superlicença para registrar votos.
                            </span>
                            <Link
                                href="/superlicense"
                                className="px-3 py-1 rounded-[3px] bg-[#fbaa19] text-black font-black text-[10px] uppercase border border-[#000000]"
                            >
                                Entrar
                            </Link>
                        </div>
                    )}

                    {voteError && (
                        <div className="p-3 rounded-[3px] border border-[#000000] bg-red-950/40 text-red-300 text-xs font-bold">
                            {voteError}
                        </div>
                    )}

                    {visibleReports.length === 0 ? (
                        <div className="py-10 text-center text-xs text-white/45 flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400/60" />
                            <span>
                                {tab === 'pending'
                                    ? 'Nenhuma alteração aguardando votação no momento.'
                                    : 'Nenhum report finalizado ainda.'}
                            </span>
                        </div>
                    ) : (
                        visibleReports.map((rep) => {
                            const meta = CATEGORY_META[rep.category];
                            const myVote = myVotes[rep.id];
                            const isVoting = votingReportId === rep.id;
                            const confirmPct = Math.min(100, Math.round((rep.confirm_count / rep.threshold) * 100));

                            return (
                                <article
                                    key={rep.id}
                                    className="rounded-[3px] border border-[#000000] bg-[#030303] p-4 flex flex-col gap-3.5"
                                >
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                                className="text-[9px] font-black uppercase px-2 py-0.5 rounded border"
                                                style={{
                                                    color: meta.color,
                                                    backgroundColor: meta.bg,
                                                    borderColor: meta.border,
                                                }}
                                            >
                                                {meta.label}
                                            </span>
                                            {rep.session && (
                                                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-white/5 border border-white/15 text-white/70">
                                                    {rep.session}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-white/45">
                                                Por <strong className="text-white/80">{rep.reporter_name}</strong> ·{' '}
                                                {formatRelativeTimePt(rep.created_at)}
                                            </span>
                                        </div>

                                        <span
                                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                                rep.status === 'confirmed'
                                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                                    : rep.status === 'rejected'
                                                        ? 'bg-red-500/15 text-red-300 border-red-500/40'
                                                        : 'bg-[#fbaa19]/15 text-[#fbaa19] border-[#fbaa19]/40'
                                            }`}
                                        >
                                            {rep.status === 'pending'
                                                ? `QUÓRUM ${rep.confirm_count}/${rep.threshold}`
                                                : rep.status === 'confirmed'
                                                    ? 'CONFIRMADO PELO GRID'
                                                    : 'CONTESTADO / REJEITADO'}
                                        </span>
                                    </div>

                                    <h4 className="text-sm font-black text-white uppercase tracking-wide">
                                        {rep.title}
                                    </h4>

                                    {/* Visual Diff por Categoria */}
                                    {rep.category === 'driver_changes' && rep.payload?.out_driver && rep.payload?.in_driver && (
                                        <div className="flex items-center gap-3 p-3 rounded bg-white/[0.03] border border-white/10">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <DriverPixelPortrait
                                                    driverName={rep.payload.out_driver}
                                                    aspectClass="w-10 h-12 rounded border shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <span className="text-[8px] text-red-400 uppercase block font-bold">
                                                        SAI
                                                    </span>
                                                    <span className="text-xs font-black text-white truncate block">
                                                        {rep.payload.out_driver}
                                                    </span>
                                                </div>
                                            </div>

                                            <ArrowRight className="w-4 h-4 text-[#fbaa19] shrink-0" />

                                            <div className="flex items-center gap-2 min-w-0">
                                                <DriverPixelPortrait
                                                    driverName={
                                                        rep.payload.in_code === 'CAM' ? 'CAM' : rep.payload.in_driver
                                                    }
                                                    aspectClass="w-10 h-12 rounded border shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <span className="text-[8px] text-emerald-400 uppercase block font-bold">
                                                        ENTRA ({rep.payload.new_team || 'GRID'})
                                                    </span>
                                                    <span className="text-xs font-black text-white truncate block">
                                                        {rep.payload.in_driver}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {rep.category === 'penalties' && rep.payload?.driver && (
                                        <div className="flex items-center justify-between gap-3 p-3 rounded bg-red-950/20 border border-red-500/30">
                                            <div className="flex items-center gap-2.5">
                                                <DriverPixelPortrait
                                                    driverName={rep.payload.driver}
                                                    aspectClass="w-10 h-12 rounded border shrink-0"
                                                />
                                                <div>
                                                    <span className="text-xs font-black text-white block">
                                                        {rep.payload.driver}
                                                    </span>
                                                    <span className="text-[10px] text-white/50">
                                                        {getDriverDetails(rep.payload.driver).team}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-1 rounded bg-red-500/20 border border-red-500/50 text-red-300 text-[10px] font-black uppercase">
                                                {rep.payload.penalty_type}
                                            </span>
                                        </div>
                                    )}

                                    {rep.category === 'results' && Array.isArray(rep.payload?.top3) && (
                                        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30">
                                            {rep.payload.top3.map((d, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 rounded bg-black/70 border border-white/15 text-[10px] font-black text-white"
                                                >
                                                    <span className="text-emerald-400">P{idx + 1}:</span> {d}
                                                </span>
                                            ))}
                                            {rep.payload.pole_time && (
                                                <span className="px-2 py-1 rounded bg-[#fbaa19]/15 border border-[#fbaa19]/40 text-[10px] font-black text-[#fbaa19]">
                                                    POLE: {rep.payload.pole_time}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <p className="text-xs text-white/75 leading-relaxed bg-white/[0.02] p-2.5 rounded border border-white/5">
                                        {rep.details}
                                    </p>

                                    {/* Barra de Progresso + Botões de Voto */}
                                    <div className="flex flex-col gap-2.5 pt-1">
                                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-400 transition-all duration-300"
                                                style={{ width: `${confirmPct}%` }}
                                            />
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div className="flex items-center gap-3 text-[10px] font-bold">
                                                <span className="text-emerald-400">
                                                    ✔ {rep.confirm_count} CONFIRMAÇÕES
                                                </span>
                                                <span className="text-red-400">
                                                    ✕ {rep.reject_count} CONTESTAÇÕES
                                                </span>
                                            </div>

                                            {rep.status === 'pending' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={!isAuthenticated || isVoting}
                                                        onClick={() => onVote(rep.id, 'confirm')}
                                                        className={`px-3.5 py-2 rounded text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                                                            myVote === 'confirm'
                                                                ? 'bg-emerald-500 text-black border-emerald-400'
                                                                : 'bg-emerald-500/15 hover:bg-emerald-500 hover:text-black text-emerald-300 border-emerald-500/40'
                                                        }`}
                                                    >
                                                        {myVote === 'confirm' ? (
                                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                        ) : (
                                                            <ThumbsUp className="w-3.5 h-3.5" />
                                                        )}
                                                        <span>{myVote === 'confirm' ? 'CONFIRMADO' : 'CONFIRMAR'}</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={!isAuthenticated || isVoting}
                                                        onClick={() => onVote(rep.id, 'reject')}
                                                        className={`px-3.5 py-2 rounded text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                                                            myVote === 'reject'
                                                                ? 'bg-red-500 text-black border-red-400'
                                                                : 'bg-red-500/15 hover:bg-red-500 hover:text-black text-red-300 border-red-500/40'
                                                        }`}
                                                    >
                                                        <ThumbsDown className="w-3.5 h-3.5" />
                                                        <span>{myVote === 'reject' ? 'CONTESTADO' : 'NÃO PROCEDE'}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })
                    )}
                </div>
        </SystemModal>
    );
}

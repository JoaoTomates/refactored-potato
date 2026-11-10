"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import {
    F1_DRIVERS,
    F1_TEAM_COLORS,
    RESERVE_DRIVER_AVATARS,
    getDriverDetails,
    getF1TeamColor,
} from '@/api/f1-data';
import { DriverPixelPortrait } from '@/components/positions-hybrid-ui';
import {
    CATEGORY_META,
    StewardReport,
    StewardReportCategory,
    StewardReportPayload,
    formatCanonicalPilotTag,
    formatRelativeTimePt,
} from '@/lib/steward-reports';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Flag,
    RefreshCw,
    Send,
    ShieldAlert,
    Users,
    Wrench,
} from 'lucide-react';

type SessionType =
    | 'FP1'
    | 'FP2'
    | 'FP3'
    | 'Qualifying'
    | 'Sprint Qualifying'
    | 'Sprint Race'
    | 'Race';

const SESSIONS: SessionType[] = [
    'Race',
    'Sprint Race',
    'Qualifying',
    'Sprint Qualifying',
    'FP1',
    'FP2',
    'FP3',
];

const PENALTY_OPTIONS = [
    '+5s Time Penalty',
    '+10s Time Penalty',
    '+3 Grid Drop',
    '+5 Grid Drop',
    '+10 Grid Drop',
    'Pitlane Start',
    'DSQ (Desclassificado)',
];

const TEAM_NAMES = Object.keys(F1_TEAM_COLORS).filter(
    (k) => !['Mercedes-AMG', 'Scuderia Ferrari', 'Red Bull Racing', 'Williams Racing', 'Haas F1 Team', 'Audi'].includes(k)
);

interface ReportFormProps {
    onReportSubmitted?: () => void;
    onBackToDashboard?: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ onReportSubmitted, onBackToDashboard }) => {
    const { user } = useSupabaseAuth();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [category, setCategory] = useState<StewardReportCategory | null>(null);

    // Driver Changes fields
    const [outDriver, setOutDriver] = useState<string>(F1_DRIVERS[0]);
    const [incomingMode, setIncomingMode] = useState<'reserve_cam' | 'existing' | 'custom'>('reserve_cam');
    const [inDriverExisting, setInDriverExisting] = useState<string>(F1_DRIVERS[1]);
    const [inDriverCustom, setInDriverCustom] = useState<string>('R.CAMARA');
    const [targetTeam, setTargetTeam] = useState<string>('Haas');

    // Penalties fields
    const [penalizedDriver, setPenalizedDriver] = useState<string>(F1_DRIVERS[0]);
    const [penaltyType, setPenaltyType] = useState<string>(PENALTY_OPTIONS[0]);
    const [sessionType, setSessionType] = useState<SessionType>('Race');

    // Results fields
    const [top3, setTop3] = useState<[string, string, string]>(['M.VERSTAPPEN', 'L.NORRIS', 'C.LECLERC']);
    const [poleTime, setPoleTime] = useState<string>('');

    // Others / Common fields
    const [customTitle, setCustomTitle] = useState<string>('');
    const [details, setDetails] = useState<string>('');

    const [reporterName, setReporterName] = useState<string>('PILOTO');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string>('');
    const [recentReports, setRecentReports] = useState<StewardReport[]>([]);
    const [loadingReports, setLoadingReports] = useState(true);

    useEffect(() => {
        if (!user) return;
        supabase
            .from('profiles')
            .select('first_name, last_name, driver_number, slug, username')
            .eq('id', user.id)
            .maybeSingle()
            .then(({ data }) => {
                if (data) {
                    setReporterName(
                        formatCanonicalPilotTag(
                            data.first_name,
                            data.last_name,
                            data.driver_number,
                            data.slug || data.username || user.email?.split('@')[0]
                        )
                    );
                } else if (user.email) {
                    setReporterName(user.email.split('@')[0].toUpperCase());
                }
            });
    }, [user]);

    const fetchRecentReports = async () => {
        setLoadingReports(true);
        const { data } = await supabase
            .from('steward_reports')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(6);
        if (data) {
            setRecentReports(data as StewardReport[]);
        }
        setLoadingReports(false);
    };

    useEffect(() => {
        fetchRecentReports();
    }, []);

    const resolvedIncomingName = useMemo(() => {
        if (incomingMode === 'existing') return inDriverExisting;
        return (inDriverCustom || 'R.CAMARA').trim().toUpperCase();
    }, [incomingMode, inDriverExisting, inDriverCustom]);

    const generatedTitle = useMemo(() => {
        if (category === 'driver_changes') {
            return `TROCA DE PILOTO // ${outDriver} → ${resolvedIncomingName} (${targetTeam.toUpperCase()})`;
        }
        if (category === 'penalties') {
            return `PENALIDADE ${sessionType.toUpperCase()} // ${penalizedDriver} (${penaltyType})`;
        }
        if (category === 'results') {
            return `RESULTADO OFICIAL // ${sessionType.toUpperCase()} (${top3[0]} · ${top3[1]} · ${top3[2]})`;
        }
        return customTitle.trim() ? customTitle.trim().toUpperCase() : 'CORREÇÃO / REPORT DO GRID';
    }, [category, outDriver, resolvedIncomingName, targetTeam, sessionType, penalizedDriver, penaltyType, top3, customTitle]);

    const handleSelectCategory = (cat: StewardReportCategory) => {
        setCategory(cat);
        setSubmitError('');
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category) return;

        if (!user) {
            setSubmitError('Você precisa estar autenticado com sua Superlicença para enviar um report oficial.');
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        let payload: StewardReportPayload = {};
        let sessionValue: string | null = null;

        if (category === 'driver_changes') {
            payload = {
                out_driver: outDriver,
                in_driver: resolvedIncomingName,
                in_code: incomingMode === 'reserve_cam' ? 'CAM' : getDriverDetails(resolvedIncomingName).code || 'NEW',
                new_team: targetTeam,
            };
        } else if (category === 'penalties') {
            sessionValue = sessionType;
            payload = {
                driver: penalizedDriver,
                penalty_type: penaltyType,
            };
        } else if (category === 'results') {
            sessionValue = sessionType;
            payload = {
                top3: [...top3],
                pole_time: poleTime.trim() || undefined,
            };
        }

        const { error } = await supabase.from('steward_reports').insert({
            reporter_id: user.id,
            reporter_name: reporterName,
            category,
            session: sessionValue,
            round_label: 'GP ATUAL',
            title: generatedTitle,
            payload,
            details: details.trim(),
            status: 'pending',
            confirm_count: 0,
            reject_count: 0,
            threshold: 3,
        });

        setIsSubmitting(false);

        if (error) {
            setSubmitError(`Erro ao protocolar report: ${error.message}`);
            return;
        }

        await fetchRecentReports();
        if (onReportSubmitted) onReportSubmitted();
        setStep(3);
    };

    const resetForm = () => {
        setStep(1);
        setCategory(null);
        setCustomTitle('');
        setDetails('');
        setPoleTime('');
        setSubmitError('');
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 mt-2 font-mono">
            {/* Header do Terminal de Steward */}
            <header className="border border-[#fbaa19]/40 rounded-lg p-5 sm:p-6 bg-black/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-[#fbaa19] text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>DIREÇÃO DE PROVA // REPORT COMUNITÁRIO</span>
                    </div>
                    <h2 className="text-white text-xl sm:text-2xl font-black uppercase tracking-wider">
                        SUBMIT STEWARD REPORT
                    </h2>
                    <p className="text-white/55 text-xs mt-1">
                        Informe trocas de pilotos, penalidades pós-corrida ou resultados oficiais. Todos os pilotos recebem alerta no dashboard para confirmar via Voting.
                    </p>
                </div>

                {user && (
                    <div className="shrink-0 px-3 py-2 rounded bg-white/5 border border-white/10 text-right">
                        <span className="text-[9px] text-white/40 uppercase block">RELATOR</span>
                        <span className="text-xs font-black text-[#fbaa19]">{reporterName}</span>
                    </div>
                )}
            </header>

            {/* Formulário Principal */}
            <div className="bg-[#080a0e] border border-white/15 rounded-lg p-5 sm:p-6 shadow-2xl">
                {step === 1 && (
                    <div className="flex flex-col gap-5">
                        <div>
                            <h3 className="text-white font-black uppercase tracking-widest text-sm">
                                1. Selecione a Categoria da Ocorrência
                            </h3>
                            <p className="text-white/45 text-xs mt-1">
                                Cada report abre uma votação de validação para o grid no dashboard.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <button
                                type="button"
                                onClick={() => handleSelectCategory('driver_changes')}
                                className="p-4 rounded-md border border-white/15 bg-black/60 hover:border-blue-400 hover:bg-blue-500/10 text-left transition-all flex items-start gap-3.5 cursor-pointer group"
                            >
                                <div className="w-10 h-10 rounded bg-blue-500/15 border border-blue-500/35 flex items-center justify-center text-blue-400 shrink-0">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="block font-black text-white text-sm uppercase tracking-wider group-hover:text-blue-300">
                                        Mudança de Pilotos
                                    </span>
                                    <span className="text-[11px] text-white/50 block mt-1">
                                        Estreias (ex: CAM), reservas ou transferências entre escuderias.
                                    </span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectCategory('penalties')}
                                className="p-4 rounded-md border border-white/15 bg-black/60 hover:border-red-400 hover:bg-red-500/10 text-left transition-all flex items-start gap-3.5 cursor-pointer group"
                            >
                                <div className="w-10 h-10 rounded bg-red-500/15 border border-red-500/35 flex items-center justify-center text-red-400 shrink-0">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="block font-black text-white text-sm uppercase tracking-wider group-hover:text-red-300">
                                        Penalidades Pós-Corrida
                                    </span>
                                    <span className="text-[11px] text-white/50 block mt-1">
                                        +5s, +10s, perda de posições no grid, Pitlane ou DSQ.
                                    </span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectCategory('results')}
                                className="p-4 rounded-md border border-white/15 bg-black/60 hover:border-emerald-400 hover:bg-emerald-500/10 text-left transition-all flex items-start gap-3.5 cursor-pointer group"
                            >
                                <div className="w-10 h-10 rounded bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shrink-0">
                                    <Flag className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="block font-black text-white text-sm uppercase tracking-wider group-hover:text-emerald-300">
                                        Resultados Oficiais
                                    </span>
                                    <span className="text-[11px] text-white/50 block mt-1">
                                        Classificação final de Corrida, Sprint, Q3 ou Treinos Livres.
                                    </span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectCategory('others')}
                                className="p-4 rounded-md border border-white/15 bg-black/60 hover:border-[#fbaa19] hover:bg-[#fbaa19]/10 text-left transition-all flex items-start gap-3.5 cursor-pointer group"
                            >
                                <div className="w-10 h-10 rounded bg-[#fbaa19]/15 border border-[#fbaa19]/35 flex items-center justify-center text-[#fbaa19] shrink-0">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="block font-black text-white text-sm uppercase tracking-wider group-hover:text-[#fbaa19]">
                                        Outros / Correções
                                    </span>
                                    <span className="text-[11px] text-white/50 block mt-1">
                                        Atualização de calendário, correções gerais ou divergência de dados.
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && category && (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="text-white/50 hover:text-[#fbaa19] text-xs font-bold uppercase tracking-widest cursor-pointer"
                            >
                                « Voltar às Categorias
                            </button>
                            <span
                                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border"
                                style={{
                                    color: CATEGORY_META[category].color,
                                    backgroundColor: CATEGORY_META[category].bg,
                                    borderColor: CATEGORY_META[category].border,
                                }}
                            >
                                {CATEGORY_META[category].label}
                            </span>
                        </div>

                        {/* FORMULÁRIO ESPECÍFICO: MUDANÇA DE PILOTOS */}
                        {category === 'driver_changes' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded border border-white/10 bg-black/50 flex flex-col gap-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/60">
                                        Piloto que Sai / Substituído
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <DriverPixelPortrait
                                            driverName={outDriver}
                                            aspectClass="w-12 h-16 rounded border shrink-0"
                                        />
                                        <select
                                            value={outDriver}
                                            onChange={(e) => setOutDriver(e.target.value)}
                                            className="flex-1 bg-black border border-white/20 rounded p-2.5 text-xs font-bold uppercase text-white focus:border-[#fbaa19] outline-none"
                                        >
                                            {F1_DRIVERS.map((d) => {
                                                const info = getDriverDetails(d);
                                                return (
                                                    <option key={d} value={d}>
                                                        #{info.num} {info.name} ({info.team})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>

                                <div className="p-4 rounded border border-white/10 bg-black/50 flex flex-col gap-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/60">
                                        Piloto que Entra
                                    </label>

                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            { id: 'reserve_cam', label: 'Novo Piloto (CAM)' },
                                            { id: 'existing', label: 'Do Grid Atual' },
                                            { id: 'custom', label: 'Outro Nome' },
                                        ].map((m) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setIncomingMode(m.id as typeof incomingMode)}
                                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase border cursor-pointer ${
                                                    incomingMode === m.id
                                                        ? 'bg-[#fbaa19] text-black border-[#fbaa19]'
                                                        : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                                                }`}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {incomingMode === 'reserve_cam' ? (
                                            <img
                                                src={RESERVE_DRIVER_AVATARS[0].avatarUrl}
                                                alt="CAM"
                                                className="w-12 h-16 object-cover rounded border border-[#fbaa19]/60 shrink-0"
                                                style={{ imageRendering: 'pixelated' }}
                                            />
                                        ) : (
                                            <DriverPixelPortrait
                                                driverName={resolvedIncomingName}
                                                aspectClass="w-12 h-16 rounded border shrink-0"
                                            />
                                        )}

                                        {incomingMode === 'existing' ? (
                                            <select
                                                value={inDriverExisting}
                                                onChange={(e) => setInDriverExisting(e.target.value)}
                                                className="flex-1 bg-black border border-white/20 rounded p-2.5 text-xs font-bold uppercase text-white focus:border-[#fbaa19] outline-none"
                                            >
                                                {F1_DRIVERS.map((d) => {
                                                    const info = getDriverDetails(d);
                                                    return (
                                                        <option key={d} value={d}>
                                                            #{info.num} {info.name} ({info.team})
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={inDriverCustom}
                                                onChange={(e) => setInDriverCustom(e.target.value.toUpperCase())}
                                                placeholder="EX: R.CAMARA"
                                                required
                                                className="flex-1 bg-black border border-white/20 rounded p-2.5 text-xs font-black uppercase text-white focus:border-[#fbaa19] outline-none"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="md:col-span-2 flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/60">
                                        Escuderia de Destino
                                    </label>
                                    <select
                                        value={targetTeam}
                                        onChange={(e) => setTargetTeam(e.target.value)}
                                        className="bg-black border border-white/20 rounded p-2.5 text-xs font-bold uppercase text-white focus:border-[#fbaa19] outline-none"
                                        style={{ borderLeftColor: getF1TeamColor(targetTeam), borderLeftWidth: '4px' }}
                                    >
                                        {TEAM_NAMES.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* FORMULÁRIO ESPECÍFICO: PENALIDADES */}
                        {category === 'penalties' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 p-4 rounded border border-white/10 bg-black/50 flex items-center gap-3">
                                    <DriverPixelPortrait
                                        driverName={penalizedDriver}
                                        aspectClass="w-12 h-16 rounded border shrink-0"
                                    />
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/60">
                                            Piloto Penalizado
                                        </label>
                                        <select
                                            value={penalizedDriver}
                                            onChange={(e) => setPenalizedDriver(e.target.value)}
                                            className="w-full bg-black border border-white/20 rounded p-2.5 text-xs font-bold uppercase text-white focus:border-[#fbaa19] outline-none"
                                        >
                                            {F1_DRIVERS.map((d) => {
                                                const info = getDriverDetails(d);
                                                return (
                                                    <option key={d} value={d}>
                                                        #{info.num} {info.name} ({info.team})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>

                                <div className="p-4 rounded border border-white/10 bg-black/50 flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/60">
                                        Sessão / Tipo
                                    </label>
                                    <select
                                        value={sessionType}
                                        onChange={(e) => setSessionType(e.target.value as SessionType)}
                                        className="bg-black border border-white/20 rounded p-2 text-xs font-bold uppercase text-white outline-none"
                                    >
                                        {['Race', 'Sprint Race', 'Qualifying', 'Sprint Qualifying'].map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={penaltyType}
                                        onChange={(e) => setPenaltyType(e.target.value)}
                                        className="bg-black border border-red-500/40 rounded p-2 text-xs font-bold uppercase text-red-300 outline-none"
                                    >
                                        {PENALTY_OPTIONS.map((p) => (
                                            <option key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* FORMULÁRIO ESPECÍFICO: RESULTADOS OFICIAIS */}
                        {category === 'results' && (
                            <div className="flex flex-col gap-4 p-4 rounded border border-white/10 bg-black/50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/60">
                                            Sessão Oficial
                                        </label>
                                        <select
                                            value={sessionType}
                                            onChange={(e) => setSessionType(e.target.value as SessionType)}
                                            className="bg-black border border-white/20 rounded p-2.5 text-xs font-bold uppercase text-white outline-none"
                                        >
                                            {SESSIONS.map((s) => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/60">
                                            Poletime / Melhor Volta (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={poleTime}
                                            onChange={(e) => setPoleTime(e.target.value)}
                                            placeholder="Ex: 1:32.329"
                                            className="bg-black border border-white/20 rounded p-2.5 text-xs font-bold text-[#fbaa19] outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {[0, 1, 2].map((pos) => (
                                        <div key={pos} className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-emerald-400">
                                                P{pos + 1} OFICIAL
                                            </span>
                                            <select
                                                value={top3[pos]}
                                                onChange={(e) => {
                                                    const next: [string, string, string] = [...top3] as [string, string, string];
                                                    next[pos] = e.target.value;
                                                    setTop3(next);
                                                }}
                                                className="bg-black border border-white/20 rounded p-2 text-xs font-bold uppercase text-white outline-none"
                                            >
                                                {F1_DRIVERS.map((d) => (
                                                    <option key={d} value={d}>
                                                        {d}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* FORMULÁRIO ESPECÍFICO: OUTROS */}
                        {category === 'others' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/60">
                                    Título do Alerta
                                </label>
                                <input
                                    type="text"
                                    value={customTitle}
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                    required
                                    placeholder="Ex: Horário da Sprint alterado pela FIA"
                                    className="bg-black border border-white/20 rounded p-2.5 text-xs font-bold text-white focus:border-[#fbaa19] outline-none"
                                />
                            </div>
                        )}

                        {/* Detalhes / Fonte */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/60">
                                Detalhes / Justificativa para o Grid
                            </label>
                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                required
                                rows={3}
                                placeholder="Explique o motivo ou documento da FIA (ex: Troca por lesão, punição de 5s por track limits, resultado atualizado pós-verificação...)"
                                className="w-full bg-black/80 border border-white/20 rounded p-3 text-xs text-white focus:border-[#fbaa19] outline-none resize-none"
                            />
                        </div>

                        {/* Preview de como aparecerá no Dashboard */}
                        <div className="p-3 rounded border border-[#fbaa19]/30 bg-[#fbaa19]/[0.05] flex flex-col gap-1">
                            <span className="text-[9px] text-[#fbaa19] font-black uppercase tracking-widest">
                                PRÉVIA DO ALERTA NO DASHBOARD:
                            </span>
                            <span className="text-xs font-black text-white">{generatedTitle}</span>
                        </div>

                        {submitError && (
                            <div className="p-3 rounded border border-red-500/50 bg-red-950/40 text-red-300 text-xs font-bold">
                                {submitError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 rounded bg-[#fbaa19] text-black font-black uppercase tracking-widest text-xs hover:bg-white transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                            <span>
                                {isSubmitting
                                    ? 'TRANSMITINDO PARA O GRID...'
                                    : 'PROTOCOLAR REPORT & ABRIR VOTAÇÃO'}
                            </span>
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-5 text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">
                                Report Protocolado no Pitwall
                            </h3>
                            <p className="text-xs text-white/60 max-w-md mx-auto mt-1.5">
                                Um alerta foi disparado no dashboard de todos os pilotos para confirmação comunitária (Voting).
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {onBackToDashboard && (
                                <button
                                    type="button"
                                    onClick={onBackToDashboard}
                                    className="px-6 py-2.5 rounded bg-[#fbaa19] text-black font-black text-xs uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span>Ver Alerta & Votar no Dashboard</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-2.5 rounded border border-white/20 text-white hover:border-[#fbaa19] hover:text-[#fbaa19] font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
                            >
                                Enviar Outro Report
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Feed de Reports Recentes */}
            <div className="bg-black/80 border border-white/15 rounded-lg p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <span className="text-xs font-black uppercase tracking-widest text-white">
                        ÚLTIMOS REPORTS PROTOCOLADOS
                    </span>
                    <button
                        type="button"
                        onClick={fetchRecentReports}
                        className="text-[10px] text-white/50 hover:text-[#fbaa19] uppercase flex items-center gap-1 cursor-pointer"
                    >
                        <RefreshCw className={`w-3 h-3 ${loadingReports ? 'animate-spin' : ''}`} />
                        <span>Atualizar</span>
                    </button>
                </div>

                {recentReports.length === 0 ? (
                    <p className="text-xs text-white/40 py-3">
                        Nenhum report protocolado ainda. Seja o primeiro a testar enviando acima!
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {recentReports.map((rep) => {
                            const meta = CATEGORY_META[rep.category];
                            return (
                                <div
                                    key={rep.id}
                                    className="p-3 rounded border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                                className="text-[9px] font-black px-1.5 py-0.5 rounded border uppercase"
                                                style={{
                                                    color: meta.color,
                                                    backgroundColor: meta.bg,
                                                    borderColor: meta.border,
                                                }}
                                            >
                                                {meta.short}
                                            </span>
                                            <span className="text-xs font-bold text-white truncate">
                                                {rep.title}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-white/40 block mt-1">
                                            Por {rep.reporter_name} · {formatRelativeTimePt(rep.created_at)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 text-[10px] font-bold">
                                        <span className="text-emerald-400">✔ {rep.confirm_count}</span>
                                        <span className="text-red-400">✕ {rep.reject_count}</span>
                                        <span
                                            className={`px-2 py-0.5 rounded uppercase border ${
                                                rep.status === 'confirmed'
                                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                                    : rep.status === 'rejected'
                                                        ? 'bg-red-500/15 text-red-300 border-red-500/40'
                                                        : 'bg-[#fbaa19]/15 text-[#fbaa19] border-[#fbaa19]/40'
                                            }`}
                                        >
                                            {rep.status === 'pending'
                                                ? `VOTANDO (${rep.confirm_count}/${rep.threshold})`
                                                : rep.status === 'confirmed'
                                                    ? 'CONFIRMADO'
                                                    : 'REJEITADO'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportForm;

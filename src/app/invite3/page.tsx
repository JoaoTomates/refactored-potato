"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { INVITE_LOCALE, Locale } from '@/locales/invite';

type Step = 'LOADING' | 'DIALOG' | 'GROUP_SELECT' | 'TEAM_SELECT' | 'AUTH' | 'PROFILE' | 'PROCESSING';

const LOGOS: Record<string, string> = {
    MCL: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/MCL.png",
    MER: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/MER.png",
    WIL: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/WIL.png",
    AST: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/AST.png",
    ALP: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/ALP.png",
    FER: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/FER.png",
    HAA: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/HAA.png",
    AUD: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/AUD.png",
    CAD: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/CAD.png",
    RBR: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/RBR.png",
    RBA: "https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/teams/RBA.png"
};

const TEAM_COLORS: Record<string, string> = {
    MCL: '#FF8000', MER: '#00D2BE', WIL: '#005AFF', ALP: '#FD4BC7',
    FER: '#DC0000', HAA: '#FFFFFF', CAD: '#C8A2C8',
    RBR: '#0600EF', RBA: '#2B4562', AST: '#229971', AUD: '#F50537'
};

const LogoBadge = ({ code }: { code: string }) => (
    <div className="bg-white rounded-md p-2 h-12 flex items-center justify-center shrink-0 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
        <img src={LOGOS[code]} alt={code} className="max-w-full max-h-full object-contain" />
    </div>
);

function TypewriterLine({ text, onComplete, onReadyForNext, startDelay = 300 }: { text: string, onComplete?: () => void, onReadyForNext?: () => void, startDelay?: number }) {
    const [displayed, setDisplayed] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    const callbacksRef = useRef({ onComplete, onReadyForNext });

    useEffect(() => {
        callbacksRef.current = { onComplete, onReadyForNext };
    }, [onComplete, onReadyForNext]);
    
    useEffect(() => {
        let i = 0;
        let timeoutId: NodeJS.Timeout;
        let isCancelled = false;
        
        const typeNext = () => {
            if (isCancelled) return;
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1));
                const char = text.charAt(i);
                i++;
                
                // organic typing speed (slower)
                let delay = 50 + Math.random() * 30; // 50-80ms
                
                // pauses for punctuation
                if (char === '.' || char === '!' || char === '?') delay = 600;
                else if (char === ',') delay = 300;
                
                timeoutId = setTimeout(typeNext, delay);
            } else {
                setIsTyping(false);
                if (callbacksRef.current.onReadyForNext) callbacksRef.current.onReadyForNext();
                if (callbacksRef.current.onComplete) {
                    setTimeout(callbacksRef.current.onComplete, 1500); 
                }
            }
        };
        
        timeoutId = setTimeout(typeNext, startDelay); // initial delay before starting
        
        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [text, startDelay]);
    
    return (
        <span className="opacity-90 leading-relaxed relative">
            {displayed}
            {isTyping && <span className="text-[#fbaa19] animate-pulse ml-1 inline-block translate-y-[2px]">■</span>}
        </span>
    );
}

function InviteFlow3() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: authLoading } = useSupabaseAuth();
    
    const [lang, setLang] = useState<Locale>('en');
    const [step, setStep] = useState<Step>('LOADING');
    const [dialogIndex, setDialogIndex] = useState(0);
    const [typingComplete, setTypingComplete] = useState(false);
    const [waitingForClick, setWaitingForClick] = useState(false);
    const [introVisible, setIntroVisible] = useState(true);
    const [showCards, setShowCards] = useState(false);
    const [revealedCards, setRevealedCards] = useState(0);
    const [showQuestion, setShowQuestion] = useState(false);
    const [showActionButtons, setShowActionButtons] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (showCards) {
            setTimeout(() => setRevealedCards(1), 800);
            setTimeout(() => setRevealedCards(2), 1600);
            setTimeout(() => setRevealedCards(3), 2400);
            setTimeout(() => setShowQuestion(true), 3800);
        }
    }, [showCards]);
    
    useEffect(() => {
        if (step === 'DIALOG' && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [dialogIndex, step, step === 'GROUP_SELECT']);
    
    const [teams, setTeams] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [raceNumber, setRaceNumber] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const urlLang = searchParams.get('lang') as Locale;
        if (urlLang === 'pt' || urlLang === 'en') {
            setLang(urlLang);
        } else {
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith('pt')) setLang('pt');
        }
        
        const checkUserStatus = async () => {
            if (authLoading) return;
            if (user) {
                const { data } = await supabase.from('profiles').select('slug, setup_completed').eq('id', user.id).single();
                if (data?.setup_completed && data?.slug) {
                    window.location.replace(`/${data.slug}`);
                    return;
                }
            }
            setStep('DIALOG');
        };
        
        checkUserStatus();
    }, [searchParams, authLoading, user]);

    const dict = {
    dialog: [
        "Puxe uma cadeira e feche a porta",
        "Os relatórios da sua telemetria caíram na minha mesa e seus números são impressionantes.",
        "Você lê o traçado antes das luzes apagarem",
        "Mas na F1 talento sozinho não garante contrato — você precisa saber onde colocar sua ficha."
    ],
    proposals_intro: "E o novo regulamento de motores está virando o jogo de ponta-cabeça. E voce precisa escolher seu lado nessa guerra.",
    career_prompt: "CHOOSE YOUR PATH",
    groups: [
        { 
            id: 1, 
            title: "ALIANÇA DA ESTRELA", 
            teams: ['MER', 'MCL', 'ALP', 'WIL'], 
            hint: "A maior frota do grid. Domínio de engenharia e confiabilidade estabelecida." 
        },
        { 
            id: 2, 
            title: "O IMPÉRIO DE MARANELLO", 
            teams: ['FER', 'HAA', 'CAD'], 
            hint: "A fúria e o prestígio italiano unidos à nova força americana no grid." 
        },
        { 
            id: 3, 
            title: "VANGUARDA TECNOLÓGICA", 
            teams: ['RBR', 'RBA', 'AST', 'AUD'], 
            hint: "Motores inéditos, alto risco e a ousadia dos novos projetos de fábrica." 
        }
    ],
    team_prompt: "SELECT YOUR GARAGE",
    contact_prompt: "ENTER COMM LINK ID",
    profile_prompt: "REGISTER PILOT ID",
    email_placeholder: "EMAIL PROTOCOL",
    password_placeholder: "ENCRYPTION KEY",
    first_name_placeholder: "FIRST NAME",
    last_name_placeholder: "LAST NAME",
    number_placeholder: "RACE NUMBER",
    btn_continue: "SECURE CONNECTION",
    btn_sign: "SIGN CONTRACT",
    processing: "PROCESSING UPLOAD...",
    error_fallback: "TRANSMISSION ERROR"
};

    const pickTwoRandom = (arr: any[]) => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2);
    };

    const handleSelectGroup = async (groupId: number) => {
        setSelectedGroup(groupId);
        setStep('LOADING');
        
        try {
            const { data, error } = await supabase.from('teams').select('*').eq('is_available', true);
            if (error) throw error;
            
            let codes: string[] = [];
            if (groupId === 1) codes = ['MCL', 'MER', 'WIL', 'ALP'];
            else if (groupId === 2) codes = ['FER', 'HAA', 'CAD'];
            else if (groupId === 3) codes = ['RBR', 'RBA', 'AST', 'AUD'];

            const groupTeams = data.filter(t => codes.includes(t.code));
            setTeams(pickTwoRandom(groupTeams));
            setStep('TEAM_SELECT');
        } catch (err) {
            console.error(err);
            setErrorMsg(dict.error_fallback);
            setStep('GROUP_SELECT');
        }
    };

    const handleSelectTeam = (teamId: string) => {
        setSelectedTeamId(teamId);
        if (user) {
            setStep('PROCESSING');
            signInitialContract(teamId);
        } else {
            setStep('AUTH');
        }
    };

    const handleAuthSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('PROFILE');
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('PROCESSING');
        setErrorMsg("");

        try {
            let emailToUse = email.trim();
            if (!emailToUse.includes('@')) {
                emailToUse = `${emailToUse.replace(/[^0-9]/g, '')}@voltgrid.app`; 
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({ 
                email: emailToUse, 
                password 
            });

            if (authError) throw authError;

            if (authData.user && selectedTeamId) {
                const cleanFirstName = firstName.trim().charAt(0).toUpperCase();
                const cleanLastName = lastName.trim().toUpperCase();
                const slug = `@${cleanFirstName.toLowerCase().replace(/[^a-z0-9]/g, '')}${cleanLastName.toLowerCase().replace(/[^a-z0-9]/g, '')}${raceNumber}`;

                const { error: profileError } = await supabase.from('profiles').update({
                    first_name: cleanFirstName,
                    last_name: cleanLastName,
                    nationality: null,
                    org_color: '#000000',
                    setup_completed: true, 
                    slug: slug
                }).eq('id', authData.user.id);

                if (profileError) {
                    await supabase.from('profiles').upsert({
                        id: authData.user.id,
                        first_name: cleanFirstName,
                        last_name: cleanLastName,
                        nationality: null,
                        org_color: '#000000',
                        setup_completed: true,
                        slug: slug
                    });
                }
                
                await signInitialContract(selectedTeamId, slug);
            }
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || dict.error_fallback);
            setStep('PROFILE');
        }
    };

    const signInitialContract = async (teamId: string, slug?: string) => {
        try {
            const { error: rpcError } = await supabase.rpc('sign_initial_contract', { p_team_id: teamId });
            if (rpcError) throw rpcError;
            
            if (slug) {
                window.location.href = `/${slug}`;
            } else {
                const { data } = await supabase.from('profiles').select('slug').eq('id', user!.id).single();
                window.location.href = `/${data?.slug || 'superlicense'}`;
            }
        } catch (err: any) {
            console.error('RPC Error:', err);
            setErrorMsg(dict.error_fallback);
            setStep('TEAM_SELECT');
        }
    };

    return (
                <main className="w-full min-h-screen relative bg-black overflow-y-auto overflow-x-hidden select-none flex flex-col font-mono items-center justify-end pb-8 md:pb-16">
            
            {/* Pixel Art Background (Fixed Jitter) */}
            <img 
                src="/pixel_invite_bg_v2.jpg"
                alt=""
                className="fixed top-0 left-0 w-screen h-screen object-cover object-center z-0 opacity-60 md:opacity-80 pointer-events-none"
                style={{ imageRendering: 'pixelated', transform: 'translateZ(0)', willChange: 'transform' }}
            />

            {/* CRT Overlay Effects */}
            <div className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none opacity-30 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]" style={{ transform: 'translateZ(0)' }}></div>
            <div className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none bg-radial-gradient from-transparent via-black/40 to-black/90" style={{ transform: 'translateZ(0)' }}></div>
            
            {/* Widescreen terminal box */}
            <div className="relative z-10 w-[85%] md:w-[75%] max-w-6xl aspect-video bg-[rgba(0,0,0,0.97)] shadow-[0_50px_100px_rgba(0,0,0,1),0_80px_160px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden border-2 border-[#111]">
                
            </div>
        </main>
    );
}

export default function Invite2PageWrapper() {
    return (
        <Suspense fallback={<div className="w-full h-screen bg-black" />}>
            <InviteFlow3 />
        </Suspense>
    );
}
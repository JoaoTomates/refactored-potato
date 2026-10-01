"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import Settings from "@/components/settings";
import DashboardHome from '@/components/dashboard-home';
import SetupForm from "@/components/setup-form";
import Calendar from "@/components/calendar";
import ReportForm from "@/components/report-form";
import SillySeason from "@/components/silly-season";
import Onboarding from "@/components/onboarding";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/utils/supabase";

export default function SuperlicensePage() {
    const router = useRouter();
    const { user, isLoading, logout } = useSupabaseAuth();
    
    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/superlicense?mode=login');
        }
    }, [user, isLoading, router]);

    // Profile State
    const [profile, setProfile] = useState<any>(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    useEffect(() => {
        if (user) {
            setLoadingProfile(true);
            Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                supabase.from('contracts').select('team_id').eq('user_id', user.id).order('year', { ascending: false }).limit(1).maybeSingle()
            ])
            .then(([profileRes, contractRes]) => {
                if (profileRes.error || !profileRes.data) {
                    router.replace('/superlicense?mode=setup');
                } else {
                    const profileData = profileRes.data;
                    if (contractRes.data) {
                        profileData.team_id = contractRes.data.team_id;
                    }
                    setProfile(profileData);
                }
            })
            .finally(() => setLoadingProfile(false));
        } else {
            setProfile(null);
        }
    }, [user, router]);

    // Superlicense states
    const [activeView, setActiveView] = useState<"menu" | "settings" | "setup" | "calendar" | "report" | "silly_season">("menu");

    if (isLoading || !user) {
        return (
            <main className="w-full h-screen flex flex-col items-center justify-center bg-white dark:bg-black">
                <div className="w-12 h-12 rounded-full border-4 border-[#fbaa19] border-t-transparent animate-spin"></div>
                <p className="mt-4 text-[#fbaa19] font-black uppercase tracking-widest animate-pulse">Verifying...</p>
            </main>
        );
    }

    return (
        <main className="w-full max-w-5xl mx-auto p-4 md:p-8 pt-12 pb-24 flex flex-col items-center justify-start min-h-screen">
            {loadingProfile ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] py-8 gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-full border-4 border-[#fbaa19] border-t-transparent animate-spin mb-4"></div>
                    <p className="text-[#fbaa19] font-bold uppercase tracking-widest text-xs">LOADING PROFILE...</p>
                </div>
            ) : profile && profile.setup_completed === false ? (
                <Onboarding onComplete={() => setProfile({ ...profile, setup_completed: true })} />
            ) : activeView === "menu" ? (
                <DashboardHome profile={profile} setActiveView={setActiveView} logout={logout} />
            ) : (
                <div className="w-full animate-fade-in">
                    <div className="mb-4 flex justify-start">
                        <button 
                            onClick={() => setActiveView("menu")}
                            className="text-gray-500 hover:text-black dark:hover:text-white flex items-center gap-2 uppercase tracking-widest text-xs font-bold transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Dashboard
                        </button>
                    </div>
                    {activeView === "setup" && <SetupForm />}
                    {activeView === "settings" && <Settings />}
                    {activeView === "calendar" && <Calendar />}
                    {activeView === "report" && <ReportForm />}
                    {activeView === "silly_season" && <SillySeason />}
                </div>
            )}
        </main>
    );
}

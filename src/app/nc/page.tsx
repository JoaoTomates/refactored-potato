"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/utils/supabase";

export default function NcIndexPage() {
    const router = useRouter();
    const { user, isLoading } = useSupabaseAuth();

    useEffect(() => {
        if (isLoading) return;
        const redirectUser = async () => {
            if (user) {
                const { data } = await supabase.from('profiles').select('slug').eq('id', user.id).maybeSingle();
                if (data?.slug) {
                    const target = data.slug.startsWith('@') ? data.slug : `@${data.slug}`;
                    router.replace(`/nc/${target}`);
                    return;
                }
            }
            router.replace('/nc/@lgustavo88');
        };
        redirectUser();
    }, [user, isLoading, router]);

    return (
        <div className="w-full min-h-screen bg-[#050401] flex items-center justify-center font-mono text-white/50 text-xs">
            &gt;_ REDIRECIONANDO PARA O COCKPIT DO ESTRATEGISTA [NC]...
        </div>
    );
}

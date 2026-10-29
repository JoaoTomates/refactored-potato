"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewConceptDashboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/nc/@lgustavo88');
    }, [router]);

    return (
        <div className="w-full min-h-screen bg-[#050401] flex items-center justify-center font-mono text-white/50 text-xs">
            &gt;_ REDIRECIONANDO PARA /nc/@lgustavo88...
        </div>
    );
}

"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function VersionSwitchBar() {
    const pathname = usePathname() || '/';

    // Determina a versão atual e as rotas equivalentes V1 e V2
    const isV2 = pathname === '/nc' || pathname.startsWith('/nc/');
    
    let v1Path = '/';
    let v2Path = '/nc';

    if (isV2) {
        // Estamos na versão 2 (/nc/...)
        v2Path = pathname;
        if (pathname === '/nc') {
            v1Path = '/';
        } else if (pathname === '/nc/new-concept/dashboard') {
            v1Path = '/';
        } else {
            // Ex: /nc/@lgustavo88 -> /@lgustavo88, /nc/headquarters -> /headquarters
            v1Path = pathname.replace(/^\/nc\/?/, '/');
            if (!v1Path.startsWith('/')) v1Path = `/${v1Path}`;
        }
    } else {
        // Estamos na versão 1 (tradicional)
        v1Path = pathname;
        if (pathname === '/') {
            v2Path = '/nc';
        } else {
            // Ex: /@lgustavo88 -> /nc/@lgustavo88, /headquarters -> /nc/headquarters
            v2Path = `/nc${pathname.startsWith('/') ? '' : '/'}${pathname}`;
        }
    }

    return (
        <nav 
            aria-label="Alternar versão da página"
            className="m-0 p-0 w-full h-[10px] min-h-[10px] max-h-[10px] bg-black border-b border-white/15 flex items-center justify-center gap-1 font-mono text-[8px] leading-none select-none z-[99999] relative shrink-0"
            style={{ margin: 0, padding: 0, height: '10px' }}
        >
            <span className="text-white/40 tracking-wider text-[7px] uppercase mr-1">
                VERSÃO:
            </span>

            {/* Versão 1 (Original / Clássica) */}
            <Link
                href={v1Path}
                title={`Versão 1 (Clássica): ${v1Path}`}
                className={`h-[10px] px-1.5 flex items-center justify-center font-bold tracking-wider transition-colors ${
                    !isV2 
                        ? 'bg-[#fbaa19] text-black font-black' 
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
            >
                1
            </Link>

            <span className="text-white/20 text-[7px] leading-none">|</span>

            {/* Versão 2 (New Concept /nc/) */}
            <Link
                href={v2Path}
                title={`Versão 2 (New Concept): ${v2Path}`}
                className={`h-[10px] px-1.5 flex items-center justify-center font-bold tracking-wider transition-colors ${
                    isV2 
                        ? 'bg-[#fbaa19] text-black font-black' 
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
            >
                2
            </Link>

            <span className="text-white/30 text-[7px] ml-1 uppercase hidden sm:inline">
                ({isV2 ? 'NC ATIVO' : 'V1 PADRÃO'})
            </span>
        </nav>
    );
}

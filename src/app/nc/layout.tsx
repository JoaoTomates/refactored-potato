"use client";

import React from 'react';

export default function NewConceptLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen bg-[#050401] text-white font-mono selection:bg-[#fbaa19] selection:text-black">
            {children}
        </div>
    );
}

"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CrewView, { CrewCategory } from '@/components/views/crew-view';

function CrewPageContent() {
    const searchParams = useSearchParams();
    const typeParam = (searchParams.get('type') as CrewCategory) || 'senior';
    const idParam = searchParams.get('id');
    return <CrewView initialType={typeParam} initialId={idParam} />;
}

export default function CrewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#020202]" />}>
            <CrewPageContent />
        </Suspense>
    );
}

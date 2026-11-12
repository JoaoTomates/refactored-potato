"use client";

import React, { use } from 'react';
import F1ClassificationView from '@/components/views/f1-classification-view';

export default function F1ResultsPage({ params }: { params: Promise<{ round: string }> | { round: string } }) {
    const resolvedParams = params && typeof (params as any).then === 'function'
        ? use(params as Promise<{ round: string }>)
        : (params as { round: string });

    return <F1ClassificationView initialRound={resolvedParams?.round || '1'} />;
}

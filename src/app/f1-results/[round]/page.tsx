"use client";

import React from 'react';
import F1ClassificationView from '@/components/views/f1-classification-view';

export default function F1ResultsPage({ params }: { params: { round: string } }) {
    return <F1ClassificationView initialRound={params.round} />;
}

"use client";

import React, { Suspense } from 'react';
import { InviteFlow } from '@/components/invite-flow';

export default function Home() {
    return (
        <Suspense fallback={<div className="w-full h-screen bg-black" />}>
            <InviteFlow />
        </Suspense>
    );
}

import React, { Suspense } from 'react';
import { InviteFlow } from '@/components/invite-flow';

export const dynamic = 'force-dynamic';

export default function InvitePageWrapper() {
    return (
        <Suspense fallback={<div className="w-full h-screen bg-black" />}>
            <InviteFlow />
        </Suspense>
    );
}

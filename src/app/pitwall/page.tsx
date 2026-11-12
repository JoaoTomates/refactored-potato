import React from 'react';

export default function PitwallPage() {
    return (
        <main className="relative w-full min-h-screen overflow-hidden bg-[#050401]">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img
                    src="/pitwall_helicopter_bg.jpg"
                    alt="VoltGrid Pitwall Helicopter View"
                    className="w-full h-full object-cover object-center"
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>
        </main>
    );
}

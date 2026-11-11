"use client";
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { mockCalendar } from '@/api/f1-data';
import { getSystemBoxStyle } from '@/components/system-modal';

interface RaceRemoteControlProps {
    activeRound?: string;
    baseUrl?: string;
    onRoundSelect?: (round: string) => void;
}

export default function RaceRemoteControl({ activeRound, baseUrl = '/f1-results', onRoundSelect }: RaceRemoteControlProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            // using Math.ceil for decimal pixel values causing slight offset bugs
            setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200; // pixels to scroll
            const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    // Try to auto-scroll to the active round on mount
    useEffect(() => {
        if (activeRound && scrollContainerRef.current) {
            const activeElement = scrollContainerRef.current.querySelector('[data-active="true"]') as HTMLElement;
            if (activeElement) {
                const containerInfo = scrollContainerRef.current.getBoundingClientRect();
                const elementInfo = activeElement.getBoundingClientRect();
                
                // If element is out of view (left or right)
                if (elementInfo.left < containerInfo.left || elementInfo.right > containerInfo.right) {
                    const scrollPos = activeElement.offsetLeft - containerInfo.width / 2 + elementInfo.width / 2;
                    scrollContainerRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
                }
            }
        }
    }, [activeRound]);

    return (
        <div
            className="relative w-full flex items-center rounded-[3px] border border-[#000000] overflow-hidden font-mono"
            style={getSystemBoxStyle('#fbaa19')}
        >
            
            {/* LEFT ARROW & GRADIENT */}
            <div className={`absolute left-0 top-0 bottom-0 flex items-center transition-opacity duration-300 z-10 ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button 
                    onClick={() => scroll('left')}
                    className="h-full px-2 bg-[#030303]/95 hover:bg-[#fbaa19] text-white hover:text-black transition-colors flex items-center justify-center border-r border-white/10 cursor-pointer"
                    aria-label="Scroll left"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="h-full w-12 bg-gradient-to-r from-[#030303] to-transparent pointer-events-none"></div>
            </div>

            {/* SCROLL CONTAINER */}
            <div 
                ref={scrollContainerRef} 
                onScroll={checkScroll}
                className="w-full overflow-x-auto scrollbar-hide flex px-4 py-4 gap-2"
            >
                {mockCalendar.map((race) => {
                    const isActive = race.round === activeRound;
                    const code = race.name.split(' ')[0].substring(0, 3).toUpperCase();
                    
                    return (
                        <Link 
                            key={race.id}
                            href={`${baseUrl}/${race.round}`}
                            onClick={(e) => {
                                if (onRoundSelect) {
                                    e.preventDefault();
                                    onRoundSelect(race.round);
                                }
                            }}
                            data-active={isActive}
                            className={`flex flex-col items-center justify-center p-3 border min-w-[80px] shrink-0 rounded-[3px] transition-colors ${
                                isActive 
                                ? 'border-[#fbaa19] bg-[#fbaa19]/15 text-white' 
                                : 'border-white/10 bg-[#030303] text-white/50 hover:text-white hover:border-[#fbaa19]/60'
                            }`}
                        >
                            <span className="text-[10px] font-bold tracking-widest">R{race.round}</span>
                            <span className={`${isActive ? 'text-[#fbaa19]' : 'text-white/60'} font-black text-sm uppercase`}>
                                {code}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* RIGHT ARROW & GRADIENT */}
            <div className={`absolute right-0 top-0 bottom-0 flex items-center transition-opacity duration-300 z-10 ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="h-full w-12 bg-gradient-to-l from-[#030303] to-transparent pointer-events-none"></div>
                <button 
                    onClick={() => scroll('right')}
                    className="h-full px-2 bg-[#030303]/95 hover:bg-[#fbaa19] text-white hover:text-black transition-colors flex items-center justify-center border-l border-white/10 cursor-pointer"
                    aria-label="Scroll right"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
            
        </div>
    );
}

"use client";

import React, { useEffect, useState } from 'react';
import NewsInteractions from '@/components/news-interactions';
import { getSystemBoxStyle } from '@/components/system-modal';
import type { NewsItem } from '@/lib/news';

export interface NewsFeedViewProps {
    initialNews?: NewsItem[];
    embedded?: boolean;
    accentColor?: string;
}

export default function NewsFeedView({
    initialNews,
    embedded = false,
    accentColor = '#fbaa19',
}: NewsFeedViewProps) {
    const [news, setNews] = useState<NewsItem[]>(initialNews || []);
    const [loading, setLoading] = useState(!initialNews);

    useEffect(() => {
        if (initialNews) return;
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/news');
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled && Array.isArray(data.items)) {
                        setNews(data.items);
                    }
                }
            } catch (err) {
                console.error('Error loading paddock wire news:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [initialNews]);

    const content = (
        <div className={embedded ? 'w-full' : 'max-w-5xl mx-auto px-4 md:px-8'}>
            {/* Header */}
            <div className="mb-8 border-l-4 pl-5" style={{ borderColor: accentColor }}>
                <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1.5 font-mono" style={{ color: accentColor }}>
                    PADDOCK INSIDER
                </p>
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest font-display text-white drop-shadow-lg">
                    LATEST F1 NEWS
                </h1>
            </div>

            {loading ? (
                <div
                    className="p-16 text-center rounded-[3px] border border-[#000000] font-mono"
                    style={getSystemBoxStyle(accentColor)}
                >
                    <div
                        className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                        style={{ borderColor: `${accentColor} transparent transparent transparent` }}
                    />
                    <p className="text-xs uppercase tracking-widest text-white/60">
                        &gt;_ SINCRONIZANDO PADDOCK WIRE...
                    </p>
                </div>
            ) : news.length === 0 ? (
                <div
                    className="text-center text-gray-400 py-16 font-mono text-sm uppercase tracking-widest rounded-[3px] border border-[#000000]"
                    style={getSystemBoxStyle(accentColor)}
                >
                    Unable to load news at the moment. Please try again later.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
                    {news.map((item, index) => {
                        const dateObj = new Date(item.pubDate);
                        const formattedDate = dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
                        const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        const imageUrl = item.enclosure?.link || item.thumbnail || '/f1_hero_banner.jpg';
                        const cleanDescription = (item.description || '').replace(/<[^>]+>/g, '').split('Keep reading')[0].trim();

                        return (
                            <div
                                key={item.guid || index}
                                className="group border border-[#000000] rounded-[3px] overflow-hidden flex flex-col transition-all"
                                style={getSystemBoxStyle(accentColor)}
                            >
                                <div className="relative w-full h-48 md:h-52 overflow-hidden bg-black">
                                    <div className="absolute inset-0 bg-black/40 z-10" />
                                    <img
                                        src={imageUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div
                                        className="absolute top-3 left-3 z-20 text-black text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-[2px] shadow-md"
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        {item.sourceName}
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex items-center gap-2 text-[10px] text-white/45 font-bold uppercase tracking-widest mb-2.5 font-mono">
                                        <span>{formattedDate}</span>
                                        <span>•</span>
                                        <span>{formattedTime}</span>
                                    </div>

                                    <h2 className="text-base md:text-lg font-bold leading-tight mb-2.5 text-white">
                                        {item.title}
                                    </h2>

                                    <p className="text-xs md:text-sm text-white/60 line-clamp-3 mb-5">
                                        {cleanDescription}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <NewsInteractions newsId={item.guid || index.toString()} />
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:text-black px-3.5 py-2 border rounded-[3px] transition-all group/btn font-mono"
                                            style={{
                                                color: accentColor,
                                                borderColor: accentColor,
                                            }}
                                        >
                                            <span>Read full article</span>
                                            <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    if (embedded) {
        return <div className="w-full font-sans">{content}</div>;
    }

    return (
        <main className="w-full min-h-screen bg-[#020202] text-white pt-8 pb-24 font-sans">
            {content}
        </main>
    );
}

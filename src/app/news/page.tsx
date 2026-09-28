import React from 'react';
import NewsInteractions from '@/components/news-interactions';
import Image from 'next/image';

interface NewsItem {
    title: string;
    pubDate: string;
    link: string;
    guid: string;
    author: string;
    thumbnail: string;
    description: string;
    sourceName: string;
    enclosure?: {
        link: string;
        type: string;
    };
    categories: string[];
}

export const revalidate = 3600; // Revalidate every hour

async function fetchNews(): Promise<NewsItem[]> {
    const FEEDS = [
        { name: 'Motorsport.com', url: 'https://www.motorsport.com/rss/f1/news/' },
        { name: 'Autosport', url: 'https://www.autosport.com/rss/f1/news/' },
        { name: 'Sky Sports', url: 'https://www.skysports.com/rss/12433' },
        { name: 'BBC Sport', url: 'http://feeds.bbci.co.uk/sport/formula1/rss.xml' }
    ];

    let allNews: NewsItem[] = [];

    await Promise.allSettled(
        FEEDS.map(async (feed) => {
            try {
                const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.items) {
                        const itemsWithSource = data.items.map((item: any) => ({
                            ...item,
                            sourceName: feed.name
                        }));
                        allNews = [...allNews, ...itemsWithSource];
                    }
                }
            } catch (error) {
                console.error(`Error fetching news from ${feed.name}:`, error);
            }
        })
    );

    // Sort by pubDate (newest first)
    allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // Deduplicate by title (Motorsport and Autosport often share articles)
    const uniqueNews: NewsItem[] = [];
    const titles = new Set();
    for (const item of allNews) {
        if (!titles.has(item.title)) {
            titles.add(item.title);
            uniqueNews.push(item);
        }
    }

    return uniqueNews.slice(0, 30);
}

export default async function NewsPage() {
    const news = await fetchNews();

    return (
        <main className="w-full min-h-screen bg-[#050505] text-white pt-8 pb-24 font-sans">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                
                {/* Header */}
                <div className="mb-12 border-l-4 border-[#fbaa19] pl-6">
                    <p className="text-[#fbaa19] text-xs font-bold uppercase tracking-[0.2em] mb-2">PADDOCK INSIDER</p>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest font-display text-white drop-shadow-lg">
                        LATEST F1 NEWS
                    </h1>
                </div>

                {/* News Grid */}
                {news.length === 0 ? (
                    <div className="text-center text-gray-500 py-20 font-mono text-sm uppercase tracking-widest">
                        Unable to load news at the moment. Please try again later.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {news.map((item, index) => {
                            // Convert pubDate to a readable format
                            const dateObj = new Date(item.pubDate);
                            const formattedDate = dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
                            const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                            
                            // Use enclosure link for image if available
                            const imageUrl = item.enclosure?.link || item.thumbnail || '/f1_hero_banner.jpg'; // fallback image
                            
                            // Clean description from HTML tags
                            const cleanDescription = item.description.replace(/<[^>]+>/g, '').split('Keep reading')[0].trim();

                                                        return (
                                <div 
                                    key={item.guid || index} 
                                    className="group bg-[#0a0a0a] border border-[#1a1a1a] overflow-hidden flex flex-col transition-all shadow-lg"
                                >
                                    {/* Image Container */}
                                    <div className="relative w-full h-48 md:h-56 overflow-hidden bg-black">
                                        <div className="absolute inset-0 bg-black/40 z-10"></div>
                                        <img 
                                            src={imageUrl} 
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                            
                                        />
                                        {/* Source Badge */}
                                        <div className="absolute top-4 left-4 z-20 bg-[#fbaa19] text-black text-[9px] font-black uppercase tracking-widest px-2 py-1 shadow-md">
                                            {item.sourceName}
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 font-mono">
                                            <span>{formattedDate}</span>
                                            <span>•</span>
                                            <span>{formattedTime}</span>
                                        </div>
                                        
                                        <h2 className="text-lg md:text-xl font-bold leading-tight mb-3 text-white">
                                            {item.title}
                                        </h2>
                                        
                                        <p className="text-sm text-gray-400 line-clamp-3 mb-6">
                                            {cleanDescription}
                                        </p>

                                        <div className="mt-auto pt-4 border-t border-[#1a1a1a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <NewsInteractions newsId={item.guid || index.toString()} />
                                            <a 
                                                href={item.link} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-[#fbaa19] text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#fbaa19] hover:text-black px-4 py-2 border border-[#fbaa19] transition-all group/btn"
                                            >
                                                <span>Read full article</span>
                                                <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );;
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}


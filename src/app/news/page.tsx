import React from 'react';
import Image from 'next/image';

interface NewsItem {
    title: string;
    pubDate: string;
    link: string;
    guid: string;
    author: string;
    thumbnail: string;
    description: string;
    enclosure?: {
        link: string;
        type: string;
    };
    categories: string[];
}

export const revalidate = 3600; // Revalidate every hour

async function fetchNews(): Promise<NewsItem[]> {
    try {
        const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.motorsport.com/rss/f1/news/');
        if (!response.ok) {
            throw new Error('Failed to fetch news');
        }
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Error fetching news:", error);
        return [];
    }
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
                        NÃ£o foi possÃ­vel carregar as notÃ­cias no momento. Tente novamente mais tarde.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {news.map((item, index) => {
                            // Convert pubDate to a readable format
                            const dateObj = new Date(item.pubDate);
                            const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
                            const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            
                            // Use enclosure link for image if available
                            const imageUrl = item.enclosure?.link || item.thumbnail || '/f1_hero_banner.jpg'; // fallback image
                            
                            // Clean description from HTML tags
                            const cleanDescription = item.description.replace(/<[^>]+>/g, '').split('Keep reading')[0].trim();

                            return (
                                <a 
                                    key={item.guid || index} 
                                    href={item.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="group bg-[#0a0a0a] border border-[#1a1a1a] overflow-hidden flex flex-col hover:border-[#fbaa19] transition-all hover:-translate-y-1 shadow-lg"
                                >
                                    {/* Image Container */}
                                    <div className="relative w-full h-48 md:h-56 overflow-hidden bg-black">
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                                        <img 
                                            src={imageUrl} 
                                            alt={item.title}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                            
                                        />
                                        {/* Category Badge */}
                                        {item.categories && item.categories.length > 0 && (
                                            <div className="absolute top-4 left-4 z-20 bg-[#fbaa19] text-black text-[9px] font-black uppercase tracking-widest px-2 py-1">
                                                {item.categories[0]}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 font-mono">
                                            <span>{formattedDate}</span>
                                            <span>â€¢</span>
                                            <span>{formattedTime}</span>
                                        </div>
                                        
                                        <h2 className="text-lg md:text-xl font-bold leading-tight mb-3 group-hover:text-[#fbaa19] transition-colors">
                                            {item.title}
                                        </h2>
                                        
                                        <p className="text-sm text-gray-400 line-clamp-3 mb-6">
                                            {cleanDescription}
                                        </p>

                                        <div className="mt-auto pt-4 border-t border-[#1a1a1a] flex items-center justify-between text-[#fbaa19] text-[10px] font-bold uppercase tracking-widest">
                                            <span>Ler na Ã­ntegra</span>
                                            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                        </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}


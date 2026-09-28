import React from 'react';
import Link from 'next/link';

interface SocialItem {
    title: string;
    pubDate: string;
    link: string;
    guid: string;
    author: string;
    thumbnail: string;
    description: string;
    content: string;
    sourceName: string;
    sourceColor: string;
}

export const revalidate = 900; // Revalidate every 15 minutes

async function fetchSocialFeed(): Promise<SocialItem[]> {
    const FEEDS = [
        { name: 'r/formula1', url: 'https://www.reddit.com/r/formula1/hot.rss', color: '#ff4500' },
        { name: 'r/formuladank', url: 'https://www.reddit.com/r/formuladank/hot.rss', color: '#ffb000' },
        { name: 'r/F1Technical', url: 'https://www.reddit.com/r/F1Technical/hot.rss', color: '#0079d3' },
        // Added 'new' feed to get more volume for keyword filtering
        { name: 'r/formula1 (New)', url: 'https://www.reddit.com/r/formula1/new.rss', color: '#ff4500' }
    ];

    let allPosts: SocialItem[] = [];

    await Promise.allSettled(
        FEEDS.map(async (feed) => {
            try {
                const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.items) {
                        const itemsWithSource = data.items.map((item: any) => ({
                            ...item,
                            sourceName: feed.name,
                            sourceColor: feed.color
                        }));
                        allPosts = [...allPosts, ...itemsWithSource];
                    }
                }
            } catch (error) {
                console.error(`Error fetching social feed from ${feed.name}:`, error);
            }
        })
    );

    allPosts.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    const uniquePosts: SocialItem[] = [];
    const guids = new Set();
    for (const post of allPosts) {
        if (!guids.has(post.guid)) {
            guids.add(post.guid);
            uniquePosts.push(post);
        }
    }

    return uniquePosts;
}

function extractHighResImage(html: string): string | null {
    const match = html.match(/<img[^>]+src="([^">]+)"/);
    if (match && match[1]) {
        return match[1].replace(/&amp;/g, '&');
    }
    return null;
}

export default async function SocialMediaPage({ searchParams }: { searchParams: { tag?: string } }) {
    // Wait for searchParams to be available in Next.js 15+ (if applicable, but in standard App router, searchParams is synchronous in Page components until Next.js 15)
    // We are on Next 14/15. Let's just use it safely.
    const activeTag = searchParams?.tag || '';
    
    let posts = await fetchSocialFeed();

    // Hashtag Filtering Logic
    if (activeTag) {
        const lowerTag = activeTag.toLowerCase().replace('#', '');
        posts = posts.filter(post => 
            post.title.toLowerCase().includes(lowerTag) || 
            post.description.toLowerCase().includes(lowerTag) ||
            post.content.toLowerCase().includes(lowerTag)
        );
    } else {
        // If no filter, just show top 40 to avoid massive scroll
        posts = posts.slice(0, 40);
    }

    const trendingTags = ['MonzaGP', 'Ferrari', 'Hamilton', 'Verstappen', 'Crash', 'Tech'];

    return (
        <main className="w-full min-h-screen bg-[#050505] text-white pt-8 pb-24 font-sans">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8">
                
                {/* Header */}
                <div className="mb-8 border-l-4 border-[#fbaa19] pl-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <p className="text-[#fbaa19] text-xs font-bold uppercase tracking-[0.2em] mb-2">PADDOCK SOCIAL</p>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest font-display text-white drop-shadow-lg">
                            {activeTag ? `#${activeTag.replace('#', '').toUpperCase()}` : 'SOCIAL HUB'}
                        </h1>
                    </div>
                </div>

                {/* Hashtag Filters */}
                <div className="flex flex-wrap gap-3 mb-10 border-b border-[#1a1a1a] pb-6">
                    <Link 
                        href="/socialmedia"
                        className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors border ${!activeTag ? 'bg-[#fbaa19] text-black border-[#fbaa19]' : 'bg-transparent text-gray-400 border-[#1a1a1a] hover:border-[#fbaa19] hover:text-[#fbaa19]'}`}
                    >
                        Tudo
                    </Link>
                    {trendingTags.map(tag => (
                        <Link 
                            key={tag}
                            href={`/socialmedia?tag=${tag}`}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors border ${activeTag.toLowerCase() === tag.toLowerCase() ? 'bg-[#fbaa19] text-black border-[#fbaa19]' : 'bg-transparent text-gray-400 border-[#1a1a1a] hover:border-[#fbaa19] hover:text-[#fbaa19]'}`}
                        >
                            #{tag}
                        </Link>
                    ))}
                </div>

                {/* Masonry Grid */}
                {posts.length === 0 ? (
                    <div className="text-center text-gray-500 py-20 font-mono text-sm uppercase tracking-widest">
                        {activeTag ? `Nenhum post recente encontrado para #${activeTag}.` : 'Não foi possível conectar ao Hub Social no momento.'}
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                        {posts.map((post, index) => {
                            const dateObj = new Date(post.pubDate);
                            const timeAgo = Math.floor((new Date().getTime() - dateObj.getTime()) / (1000 * 60 * 60));
                            const timeDisplay = timeAgo === 0 ? 'Agora mesmo' : `${timeAgo}h atrás`;

                            const imageUrl = extractHighResImage(post.content || post.description) || post.thumbnail;

                            return (
                                <a 
                                    key={post.guid || index} 
                                    href={post.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="break-inside-avoid group bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden flex flex-col hover:border-[#fbaa19] transition-all hover:-translate-y-1 shadow-xl block"
                                >
                                    <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between bg-black/40">
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-2 h-2 rounded-full" 
                                                style={{ backgroundColor: post.sourceColor }}
                                            ></div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 truncate max-w-[120px]">
                                                {post.sourceName}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-mono shrink-0">
                                            {timeDisplay}
                                        </span>
                                    </div>

                                    {imageUrl && imageUrl.trim() !== '' && (
                                        <div className="relative w-full overflow-hidden bg-black max-h-[500px] flex items-center justify-center">
                                            <img 
                                                src={imageUrl} 
                                                alt={post.title}
                                                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}

                                    <div className="p-5 flex flex-col flex-1">
                                        <h2 className="text-sm md:text-base font-bold leading-snug mb-3 group-hover:text-[#fbaa19] transition-colors">
                                            {post.title}
                                        </h2>
                                        
                                        <div className="mt-auto flex items-center gap-2 text-gray-500 text-xs">
                                            <span className="font-mono bg-[#1a1a1a] px-2 py-1 rounded truncate max-w-full">
                                                {post.author.replace('/u/', '@')}
                                            </span>
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

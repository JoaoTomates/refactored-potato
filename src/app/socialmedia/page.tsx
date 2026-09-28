import React from 'react';

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
        { name: 'r/F1Technical', url: 'https://www.reddit.com/r/F1Technical/hot.rss', color: '#0079d3' }
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

    // Sort by pubDate (newest first)
    allPosts.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // Deduplicate by GUID
    const uniquePosts: SocialItem[] = [];
    const guids = new Set();
    for (const post of allPosts) {
        if (!guids.has(post.guid)) {
            guids.add(post.guid);
            uniquePosts.push(post);
        }
    }

    return uniquePosts.slice(0, 40); // Top 40 posts
}

function extractHighResImage(html: string): string | null {
    // Try to find the image in the HTML content
    const match = html.match(/<img[^>]+src="([^">]+)"/);
    if (match && match[1]) {
        // Decode HTML entities (e.g. &amp; to &)
        return match[1].replace(/&amp;/g, '&');
    }
    return null;
}

export default async function SocialMediaPage() {
    const posts = await fetchSocialFeed();

    return (
        <main className="w-full min-h-screen bg-[#050505] text-white pt-8 pb-24 font-sans">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8">
                
                {/* Header */}
                <div className="mb-12 border-l-4 border-[#fbaa19] pl-6">
                    <p className="text-[#fbaa19] text-xs font-bold uppercase tracking-[0.2em] mb-2">PADDOCK SOCIAL</p>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest font-display text-white drop-shadow-lg">
                        SOCIAL HUB
                    </h1>
                </div>

                {/* Masonry Grid */}
                {posts.length === 0 ? (
                    <div className="text-center text-gray-500 py-20 font-mono text-sm uppercase tracking-widest">
                        Não foi possível conectar ao Hub Social no momento.
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                        {posts.map((post, index) => {
                            const dateObj = new Date(post.pubDate);
                            const timeAgo = Math.floor((new Date().getTime() - dateObj.getTime()) / (1000 * 60 * 60));
                            const timeDisplay = timeAgo === 0 ? 'Agora mesmo' : `${timeAgo}h atrás`;

                            // Extract the best image
                            const imageUrl = extractHighResImage(post.content || post.description) || post.thumbnail;

                            // If there is no image and the title is very short, it might be a boring text post.
                            // But on Reddit, many posts have images. Let's render nicely!

                            return (
                                <a 
                                    key={post.guid || index} 
                                    href={post.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="break-inside-avoid group bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden flex flex-col hover:border-[#fbaa19] transition-all hover:-translate-y-1 shadow-xl block"
                                >
                                    {/* Author and Source Bar */}
                                    <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between bg-black/40">
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-2 h-2 rounded-full" 
                                                style={{ backgroundColor: post.sourceColor }}
                                            ></div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                                                {post.sourceName}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            {timeDisplay}
                                        </span>
                                    </div>

                                    {/* Post Image */}
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

                                    {/* Post Content */}
                                    <div className="p-5 flex flex-col flex-1">
                                        <h2 className="text-sm md:text-base font-bold leading-snug mb-3 group-hover:text-[#fbaa19] transition-colors">
                                            {post.title}
                                        </h2>
                                        
                                        <div className="mt-auto flex items-center gap-2 text-gray-500 text-xs">
                                            <span className="font-mono bg-[#1a1a1a] px-2 py-1 rounded">
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

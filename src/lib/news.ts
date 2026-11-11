export interface NewsItem {
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

export async function fetchNews(): Promise<NewsItem[]> {
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
                const response = await fetch(
                    `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`,
                    { next: { revalidate: 3600 } }
                );
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

    allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    const uniqueNews: NewsItem[] = [];
    const titles = new Set<string>();
    for (const item of allNews) {
        if (!titles.has(item.title)) {
            titles.add(item.title);
            uniqueNews.push(item);
        }
    }

    return uniqueNews.slice(0, 30);
}

import { Metadata } from 'next';
import React from 'react';
import { fetchNews } from '@/lib/news';
import NewsFeedView from '@/components/views/news-feed-view';

export const metadata: Metadata = { title: 'News' };
export const revalidate = 3600;

export default async function NewsPage() {
    const news = await fetchNews();
    return <NewsFeedView initialNews={news} />;
}

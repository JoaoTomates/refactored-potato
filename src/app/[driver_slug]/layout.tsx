import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ driver_slug: string }> | { driver_slug: string } }): Promise<Metadata> {
    const raw = params && typeof (params as any).then === 'function' ? (await params).driver_slug : (params as any)?.driver_slug;
    const slug = raw ? String(raw) : '';
    if (!slug || /\.(ico|png|jpg|jpeg|gif|svg|webp|txt|xml|json|map|js|css|woff2?|ttf|eot)$/i.test(slug) || slug.startsWith('_')) {
        return { title: 'BAEFF1' };
    }
    return {
        title: `@${slug.toUpperCase()}`,
    };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

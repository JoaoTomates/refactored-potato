import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ driver_slug: string }> | { driver_slug: string } }): Promise<Metadata> {
    // Next 15 requires params to be awaited if we use standard types, but Next 13/14 uses direct object.
    // Handling carefully:
    const slug = (await params).driver_slug;
    return {
        title: `@${slug.toUpperCase()}`,
    };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

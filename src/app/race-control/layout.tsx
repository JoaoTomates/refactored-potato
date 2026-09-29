import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Race Control',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

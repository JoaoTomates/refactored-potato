import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pitwall',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

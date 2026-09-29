import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'F1 Standings',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

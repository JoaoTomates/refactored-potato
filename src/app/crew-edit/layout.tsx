import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Crew Edit // Admin',
    description: 'Painel administrativo para redefinir funções, especialidades e atribuições dos personagens do TS1.',
};

export default function CrewEditLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

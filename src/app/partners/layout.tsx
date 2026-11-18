import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Partners',
    description: 'Quer ser um parceiro do The Strategist One ? Conheça os parceiros globais estilizados no ecossistema The Strategist One / TS1.',
};

export default function PartnersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

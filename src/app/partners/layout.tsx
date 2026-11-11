import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Partners',
    description: 'Quer ser um parceiro da VoltGrid ? Conheça os parceiros globais estilizados no ecossistema VoltGrid / BAEFF1.',
};

export default function PartnersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

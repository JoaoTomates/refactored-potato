import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'TS1 // Next Race Telemetry & Intelligence',
    description: 'Dossiê tático completo da próxima etapa da Fórmula 1 2026: condições de pista, meteorologia, pneus, telemetria e parâmetros para embasamento de prognósticos.',
};

export default function NextRaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

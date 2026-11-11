import { ALLIANCE_DISPATCH_DIALOGS } from '@/data/dialogues';

export interface TeamOffer {
    id: string;
    name: string;
    code: string;
    color: string;
    occupied: number;
    engineSpec: string;
    perk: string;
    description: string;
    seatTitle: string;
    groupName: string;
    groupId: number;
}

export interface FactionData {
    id: 'A' | 'B' | 'C';
    badge: string;
    title: string;
    sub: string;
    engineSpec: string;
    teamsString: string;
    teams: string[];
    teamDetails: { code: string; name: string; color: string }[];
    fantasyPerk: string;
    directorResponse: string;
}

export const TEAM_SPECS: Record<string, { engineSpec: string; perk: string; description: string; seatTitle: string }> = {
    MER: {
        engineSpec: 'Mercedes-AMG M16 E Performance V6 Turbo Hybrid',
        //perk: '+15% de rendimento em previsões de consistência cirúrgica de corrida.',
        description: 'A matriz alemã de Brackley. Máxima cobrança por perfeição matemática, ritmo implacável e confiabilidade de aço.',
        seatTitle: 'ESTRATEGISTA CHEFE MERCEDES'
    },
    MCL: {
        engineSpec: 'Mercedes M16 High Performance Customer PU',
        //perk: '+15% de bônus em previsões de volta mais rápida e top speed.',
        description: 'O time de Woking em ascensão meteórica. Exige decisões agressivas de pitwall e arrojo nas ultrapassagens.',
        seatTitle: 'ESTRATEGISTA CHEFE McLAREN'
    },
    ALP: {
        engineSpec: 'Mercedes High Output Customer Specification',
        //perk: '+20% de rendimento ao acertar estratégias alternativas de undercut.',
        description: 'A esquadra de Enstone em reformulação tática com motores da estrela para retomar o pelotão da frente.',
        seatTitle: 'ESTRATEGISTA CHEFE ALPINE'
    },
    WIL: {
        engineSpec: 'Mercedes-AMG V6 Turbo Hybrid Standard Spec',
        //perk: '+25% de retorno em apostas de azarão e disputas no pelotão intermediário.',
        description: 'A lendária garagem britânica de Grove com alta eficiência em retas e sede de retomada histórica.',
        seatTitle: 'ESTRATEGISTA CHEFE WILLIAMS'
    },
    FER: {
        engineSpec: 'Ferrari 067/3 Hybrid E-Turbo Speciale',
        //perk: 'Bônus dobrado (2x) em apostas arriscadas de Pole Position (Poletime).',
        description: 'A mística sagrada de Maranello. Tolerância zero ao erro estratégico sob a vigilância obsessiva dos tifosi.',
        seatTitle: 'ESTRATEGISTA CHEFE FERRARI'
    },
    HAA: {
        engineSpec: 'Ferrari 067/3 Customer Powertrain Package',
        //perk: '+20% de rendimento em antecipação de Safety Car e estratégias de largada.',
        description: 'Operação pragmática ítalo-americana focada em ataques cirúrgicos e pontuações em janelas caóticas.',
        seatTitle: 'ESTRATEGISTA CHEFE HAAS'
    },
    CAD: {
        engineSpec: 'Cadillac-Ferrari Powertrain Joint Venture',
        //perk: '+25% de rendimento em primeiras voltas e duelos roda a roda.',
        description: 'A nova potência americana desembarcando no paddock com o suporte de Maranello para desafiar os gigantes.',
        seatTitle: 'ESTRATEGISTA CHEFE CADILLAC'
    },
    RBR: {
        engineSpec: 'Red Bull Ford Powertrains V6 Hybrid PU',
        //perk: '+25% de rendimento ao antecipar cenários de caos e paradas relâmpago.',
        description: 'Milton Keynes e a máquina impiedosa de vitórias. Exige postura predatória na leitura de telemetria.',
        seatTitle: 'ESTRATEGISTA CHEFE RED BULL'
    },
    RBA: {
        engineSpec: 'Red Bull Ford Powertrains Spec-B Development PU',
        //perk: '+20% de bônus na evolução de posições entre largada e chegada.',
        description: 'A divisão dinâmica de Faenza especializada em forjar táticas inovadoras no coração do grid.',
        seatTitle: 'ESTRATEGISTA CHEFE RACING BULLS'
    },
    AST: {
        engineSpec: 'AMR-Honda Factory Works Turbo Hybrid',
        //perk: '+15% de rendimento na gestão cirúrgica de desgaste de pneus.',
        description: 'Silverstone aliada à disciplina de ponta da engenharia japonesa da Honda para desafiar o topo do mundo.',
        seatTitle: 'ESTRATEGISTA CHEFE ASTON MARTIN'
    },
    AUD: {
        engineSpec: 'Audi F1 PowerUnit Prototype V6 Hybrid',
        //perk: '+30% de rendimento em corridas sob chuva ou condições climáticas mutáveis.',
        description: 'A gigante de Ingolstadt invadindo a Fórmula 1 com engenharia do zero e ambição implacável de domínio.',
        seatTitle: 'ESTRATEGISTA CHEFE AUDI'
    }
};

export const ALLIANCE_KEYS: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

export const ENGINE_FACTIONS: Record<'A' | 'B' | 'C', FactionData> = {
    A: {
        id: 'A',
        badge: 'BLOCO A',
        title: 'CONSÓRCIO DA ESTRELA',
        sub: '"Confiabilidade de Aço & Engenharia Teutônica"',
        engineSpec: 'Mercedes-AMG High Performance Powertrains V6 Hybrid',
        teamsString: 'Mercedes • McLaren • Alpine • Williams',
        teams: ['MER', 'MCL', 'ALP', 'WIL'],
        teamDetails: [
            { code: 'MER', name: 'Mercedes', color: '#00D2BE' },
            { code: 'MCL', name: 'McLaren', color: '#FF8000' },
            { code: 'ALP', name: 'Alpine', color: '#FD4BC7' },
            { code: 'WIL', name: 'Williams', color: '#005AFF' }
        ],
        //fantasyPerk: '+15% de rendimento em previsões de consistência cirúrgica.',
        directorResponse: ALLIANCE_DISPATCH_DIALOGS.A || '“Escolha metódica. Você optou pela maior frota de motores da Alemanha. Quatro garagens trocando dados e confiabilidade de aço. Aqui a cobrança é por perfeição matemática nas previsões. Não me desaponte.”'
    },
    B: {
        id: 'B',
        badge: 'BLOCO B',
        title: 'A DINASTIA DE MARANELLO',
        sub: '"Potência Máxima & A Frente Ítalo-Americana"',
        engineSpec: 'Ferrari 067/3 Hybrid E-Turbo Speciale',
        teamsString: 'Ferrari • Haas • Cadillac',
        teams: ['FER', 'HAA', 'CAD'],
        teamDetails: [
            { code: 'FER', name: 'Ferrari', color: '#DC0000' },
            { code: 'HAA', name: 'Haas', color: '#E6002B' },
            { code: 'CAD', name: 'Cadillac', color: '#FFC80C' }
        ],
        //fantasyPerk: 'Bônus dobrado (2x) em apostas arriscadas de Pole Position.',
        directorResponse: ALLIANCE_DISPATCH_DIALOGS.B || '“Sangue quente. Você escolheu a paixão de Maranello e a agressividade da nova parceira americana. Aqui não existe desculpa para o segundo lugar: ou suas previsões nos colocam na frente ou a torcida te destrói.”'
    },
    C: {
        id: 'C',
        badge: 'BLOCO C',
        title: 'A VANGUARDA TECNOLOGICA',
        sub: '"Ousadia, estratégia & A Força do Caos"',
        engineSpec: 'Red Bull Ford Powertrains / Honda / Audi F1 PU',
        teamsString: 'Red Bull • Racing Bulls • Aston Martin • Audi',
        teams: ['RBR', 'RBA', 'AST', 'AUD'],
        teamDetails: [
            { code: 'RBR', name: 'Red Bull', color: '#3671C6' },
            { code: 'RBA', name: 'Racing Bulls', color: '#6692FF' },
            { code: 'AST', name: 'Aston Martin', color: '#229971' },
            { code: 'AUD', name: 'Audi', color: '#F50537' }
        ],
        //fantasyPerk: '+25% de rendimento ao antecipar cenários de caos no traçado.',
        directorResponse: ALLIANCE_DISPATCH_DIALOGS.C || '“Adoro a ousadia. Você foi direto no terreno desconhecido da Ford, da Honda e da Audi. Motores inéditos trazem riscos brutais, mas é no caos que os maiores estrategistas da história constroem dinastias.”'
    }
};

export const TEAM_COLORS: Record<string, string> = {
    MCL: '#FF8000',
    MER: '#00D2BE',
    WIL: '#005AFF',
    ALP: '#FD4BC7',
    FER: '#DC0000',
    HAA: '#E6002B',
    CAD: '#FFC80C',
    RBR: '#3671C6',
    RBA: '#6692FF',
    AST: '#229971',
    AUD: '#F50537'
};

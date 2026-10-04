// Os 34 primeiros Grupos Fantasy recebem simbolicamente o nome de um campeão
// mundial de F1, em ordem cronológica do primeiro título.
export const CHAMPION_GROUP_NAMES: string[] = [
    'G. FARINA',
    'J. M. FANGIO',
    'A. ASCARI',
    'M. HAWTHORN',
    'J. BRABHAM',
    'P. HILL',
    'G. HILL',
    'J. CLARK',
    'J. SURTEES',
    'D. HULME',
    'J. STEWART',
    'J. RINDT',
    'E. FITTIPALDI',
    'N. LAUDA',
    'J. HUNT',
    'M. ANDRETTI',
    'J. SCHECKTER',
    'A. JONES',
    'N. PIQUET',
    'K. ROSBERG',
    'A. PROST',
    'A. SENNA',
    'N. MANSELL',
    'M. SCHUMACHER',
    'D. HILL',
    'J. VILLENEUVE',
    'M. HÄKKINEN',
    'F. ALONSO',
    'K. RÄIKKÖNEN',
    'L. HAMILTON',
    'J. BUTTON',
    'S. VETTEL',
    'N. ROSBERG',
    'M. VERSTAPPEN',
];

/** Retorna o nome simbólico do grupo (1-indexado). Após o 34º, usa numeração. */
export function getChampionGroupName(groupId: number | null | undefined): string {
    if (!groupId || groupId < 1) return 'GRUPO —';
    return CHAMPION_GROUP_NAMES[groupId - 1] ?? `GRUPO ${groupId}`;
}

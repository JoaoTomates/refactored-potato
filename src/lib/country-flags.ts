/**
 * Utilitário para mapeamento e renderização de bandeiras de países
 * Suporta códigos ISO alfa-2 e nomes/nacionalidades comuns em português e inglês.
 */

const NATIONALITY_TO_CODE: Record<string, string> = {
    // Brasil
    brazilian: 'br',
    brasil: 'br',
    brazil: 'br',
    brasileiro: 'br',
    brasileira: 'br',
    br: 'br',
    bra: 'br',

    // Itália
    italian: 'it',
    italiano: 'it',
    italiana: 'it',
    italy: 'it',
    italia: 'it',
    it: 'it',
    ita: 'it',

    // Reino Unido / Grã-Bretanha
    british: 'gb',
    britanico: 'gb',
    britânico: 'gb',
    britanica: 'gb',
    britânica: 'gb',
    uk: 'gb',
    gb: 'gb',
    gbr: 'gb',
    england: 'gb',
    ingles: 'gb',
    inglês: 'gb',

    // Espanha
    spanish: 'es',
    espanhol: 'es',
    espanhola: 'es',
    spain: 'es',
    espanha: 'es',
    es: 'es',
    esp: 'es',

    // França
    french: 'fr',
    frances: 'fr',
    francês: 'fr',
    francesa: 'fr',
    france: 'fr',
    frança: 'fr',
    fr: 'fr',
    fra: 'fr',

    // Alemanha
    german: 'de',
    alemao: 'de',
    alemão: 'de',
    alema: 'de',
    alemã: 'de',
    germany: 'de',
    alemanha: 'de',
    de: 'de',
    deu: 'de',
    ger: 'de',

    // Holanda / Países Baixos
    dutch: 'nl',
    holandes: 'nl',
    holandês: 'nl',
    holandesa: 'nl',
    netherlands: 'nl',
    holanda: 'nl',
    nl: 'nl',
    ned: 'nl',

    // Mônaco
    monegasque: 'mc',
    monagasco: 'mc',
    monégasque: 'mc',
    monaco: 'mc',
    mônaco: 'mc',
    mc: 'mc',
    mon: 'mc',

    // México
    mexican: 'mx',
    mexicano: 'mx',
    mexicana: 'mx',
    mexico: 'mx',
    méxico: 'mx',
    mx: 'mx',
    mex: 'mx',

    // Austrália
    australian: 'au',
    australiano: 'au',
    australiana: 'au',
    australia: 'au',
    austrália: 'au',
    au: 'au',
    aus: 'au',

    // Canadá
    canadian: 'ca',
    canadense: 'ca',
    canada: 'ca',
    canadá: 'ca',
    ca: 'ca',
    can: 'ca',

    // Estados Unidos
    american: 'us',
    usa: 'us',
    us: 'us',
    'united states': 'us',
    estadosunidos: 'us',
    estadunidense: 'us',
    norteamericano: 'us',
    norteamericana: 'us',

    // Japão
    japanese: 'jp',
    japones: 'jp',
    japonês: 'jp',
    japonesa: 'jp',
    japan: 'jp',
    japao: 'jp',
    japão: 'jp',
    jp: 'jp',
    jpn: 'jp',

    // Argentina
    argentine: 'ar',
    argentino: 'ar',
    argentina: 'ar',
    ar: 'ar',
    arg: 'ar',

    // Áustria
    austrian: 'at',
    austriaco: 'at',
    austríaco: 'at',
    austria: 'at',
    áustria: 'at',
    at: 'at',
    aut: 'at',

    // Suíça
    swiss: 'ch',
    suico: 'ch',
    suíço: 'ch',
    suica: 'ch',
    suíça: 'ch',
    switzerland: 'ch',
    ch: 'ch',
    sui: 'ch',

    // Bélgica
    belgian: 'be',
    belga: 'be',
    belgium: 'be',
    bélgica: 'be',
    be: 'be',
    bel: 'be',

    // Finlândia
    finnish: 'fi',
    finlandes: 'fi',
    finlandês: 'fi',
    finland: 'fi',
    finlandia: 'fi',
    finlândia: 'fi',
    fi: 'fi',
    fin: 'fi',

    // Dinamarca
    danish: 'dk',
    dinamarques: 'dk',
    dinamarquês: 'dk',
    denmark: 'dk',
    dinamarca: 'dk',
    dk: 'dk',
    dnk: 'dk',

    // Portugal
    portuguese: 'pt',
    portugues: 'pt',
    português: 'pt',
    portuguesa: 'pt',
    portugal: 'pt',
    pt: 'pt',
    prt: 'pt',

    // Nova Zelândia
    'new zealand': 'nz',
    neozelandes: 'nz',
    neozelandês: 'nz',
    nz: 'nz',
    nzl: 'nz',

    // Suécia
    swedish: 'se',
    sueco: 'se',
    sueca: 'se',
    sweden: 'se',
    suécia: 'se',
    suecia: 'se',
    se: 'se',
    swe: 'se',

    // Tailândia
    thai: 'th',
    tailandes: 'th',
    tailandês: 'th',
    thailand: 'th',
    tailandia: 'th',
    tailândia: 'th',
    th: 'th',
    tha: 'th',

    // China
    chinese: 'cn',
    chines: 'cn',
    chinês: 'cn',
    china: 'cn',
    cn: 'cn',
    chn: 'cn',
};

export interface CountryFlagInfo {
    code: string;
    flagUrl: string;
}

/**
 * Retorna as informações de bandeira (código ISO minúsculo e URL de imagem CDN)
 * com base na string de nacionalidade ou país informada.
 */
export function getCountryFlag(nationalityOrCountry?: string | null): CountryFlagInfo | null {
    if (!nationalityOrCountry) return null;
    const clean = nationalityOrCountry.trim().toLowerCase();
    if (!clean) return null;

    // Se já for código ISO de 2 letras
    if (clean.length === 2 && /^[a-z]{2}$/.test(clean)) {
        return {
            code: clean,
            flagUrl: `https://flagcdn.com/w40/${clean}.png`
        };
    }

    const code = NATIONALITY_TO_CODE[clean];
    if (code) {
        return {
            code,
            flagUrl: `https://flagcdn.com/w40/${code}.png`
        };
    }

    return null;
}

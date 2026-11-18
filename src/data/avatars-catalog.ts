// Catálogo Oficial de Avatares do TS1 carregados no Supabase Storage
// Gerado automaticamente por scripts/upload-avatars-to-supabase.js

export interface AvatarEngineer {
    id: string;
    num: number;
    name: string;
    role: string;
    age: string;
    nationality: string;
    profile: string;
    style?: string;
    category: 'eng';
    fileName: string;
    publicUrl: string;
    localUrl: string;
}

export interface AvatarDriver {
    id: string;
    num: number;
    name: string;
    role: string;
    age: string;
    nationality: string;
    history: string;
    adviceStyle: string;
    category: 'ex_drivers';
    fileName: string;
    publicUrl: string;
    localUrl: string;
}

export interface AvatarAllianceChief {
    id: string;
    num: number;
    name: string;
    role: string;
    age: string;
    nationality: string;
    profile: string;
    keyAttribute: string;
    category: 'others';
    fileName: string;
    publicUrl: string;
    localUrl: string;
}

export interface AvatarsCatalog {
    generatedAt: string;
    totalAvatars: number;
    engineers: AvatarEngineer[];
    exDrivers: AvatarDriver[];
    allianceChiefs: AvatarAllianceChief[];
}

import catalogJson from './avatars-catalog.json';

export const AVATARS_CATALOG: AvatarsCatalog = catalogJson as unknown as AvatarsCatalog;
export default AVATARS_CATALOG;

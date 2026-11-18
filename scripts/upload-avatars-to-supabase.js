const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Lê credenciais de .env.local
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const env = envContent.split('\n').reduce((acc, line) => {
    const [k, ...v] = line.trim().split('=');
    if (k && v.length) acc[k] = v.join('=');
    return acc;
}, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('ERRO: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente em .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// Diretório base
const avatarBaseDir = path.join(__dirname, '..', 'public', 'avatar');

// Helper para ler arquivos recursivamente
function getFilesRecursively(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFilesRecursively(fullPath));
        } else {
            results.push(fullPath);
        }
    }
    return results;
}

// Determinar Content-Type
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.webp':
            return 'image/webp';
        case '.svg':
            return 'image/svg+xml';
        case '.txt':
            return 'text/plain; charset=utf-8';
        default:
            return 'application/octet-stream';
    }
}

// Parser de metadados de engenheiros (Avatar_Data.txt)
function parseEngineerData(txtPath) {
    if (!fs.existsSync(txtPath)) return [];
    const content = fs.readFileSync(txtPath, 'utf-8');
    const sections = content.split(/\n(?=\d+\.\s+)/);
    const result = [];

    for (const sec of sections) {
        const lines = sec.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length) continue;

        const headerMatch = lines[0].match(/^(\d+)\.\s*(.+)$/);
        if (!headerMatch) continue;

        const idNum = parseInt(headerMatch[1], 10);
        const name = headerMatch[2].trim();

        let role = '';
        let age = '';
        let nationality = '';
        let profile = '';
        let style = '';

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('Função:')) role = line.replace('Função:', '').trim();
            else if (line.startsWith('Idade:')) age = line.replace('Idade:', '').trim();
            else if (line.startsWith('Nacionalidade:')) nationality = line.replace('Nacionalidade:', '').trim();
            else if (line.startsWith('Perfil:')) profile = line.replace('Perfil:', '').trim();
            else if (line.startsWith('Estilo:')) style = line.replace('Estilo:', '').trim();
        }

        result.push({
            id: `eng_${idNum}`,
            num: idNum,
            name,
            role,
            age,
            nationality,
            profile,
            style,
            category: 'eng',
            fileName: `avatar_${idNum}.jpg`
        });
    }

    return result;
}

// Parser de metadados de ex-pilotos / mentores (avatar_drivers_data.txt)
function parseDriverData(txtPath) {
    if (!fs.existsSync(txtPath)) return [];
    const content = fs.readFileSync(txtPath, 'utf-8');
    const sections = content.split(/\n(?=\d+\.\s*[A-Z])/);
    const result = [];

    for (const sec of sections) {
        const lines = sec.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length) continue;

        const headerMatch = lines[0].match(/^(\d+)\.\s*(.+)$/);
        if (!headerMatch) continue;

        const idNum = parseInt(headerMatch[1], 10);
        const name = headerMatch[2].trim();

        let age = '';
        let nationality = '';
        let history = '';
        let adviceStyle = '';

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('Idade:')) age = line.replace('Idade:', '').trim();
            else if (line.startsWith('Nacionalidade:')) nationality = line.replace('Nacionalidade:', '').trim();
            else if (line.startsWith('Histórico:')) history = line.replace('Histórico:', '').trim();
            else if (line.startsWith('Estilo de Conselhos:')) adviceStyle = line.replace('Estilo de Conselhos:', '').trim();
        }

        result.push({
            id: `driver_${idNum}`,
            num: idNum,
            name,
            role: 'Estrategista Sênior / Mentor Lendário',
            age,
            nationality,
            history,
            adviceStyle,
            category: 'ex_drivers',
            fileName: `avatar_driver_${idNum}.jpg`
        });
    }

    return result;
}

// Parser de metadados das alianças (others/data.txt)
function parseOthersData(txtPath) {
    if (!fs.existsSync(txtPath)) return [];
    const content = fs.readFileSync(txtPath, 'utf-8');
    const sections = content.split(/\n(?=\d+\.\s+[A-Z])/);
    const result = [];

    // Mapeamento dos arquivos de imagem:
    // 1 -> alianca_1_a.jpg
    // 2 -> alianca_1_b.jpg
    // 3 -> alianca_2_a.jpg
    // 4 -> alianca_2_b.jpg
    // 5 -> alianca_3_a.jpg
    // 6 -> alianca_3_b.jpg
    const fileMapping = [
        'alianca_1_a.jpg',
        'alianca_1_b.jpg',
        'alianca_2_a.jpg',
        'alianca_2_b.jpg',
        'alianca_3_a.jpg',
        'alianca_3_b.jpg'
    ];

    for (const sec of sections) {
        const lines = sec.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length) continue;

        const headerMatch = lines[0].match(/^(\d+)\.\s*(.+)$/);
        if (!headerMatch) continue;

        const idNum = parseInt(headerMatch[1], 10);
        const name = headerMatch[2].trim();

        let role = '';
        let age = '';
        let nationality = '';
        let profile = '';
        let keyAttribute = '';

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('Função:')) role = line.replace('Função:', '').trim();
            else if (line.startsWith('Idade:')) age = line.replace('Idade:', '').trim();
            else if (line.startsWith('Nacionalidade:')) nationality = line.replace('Nacionalidade:', '').trim();
            else if (line.startsWith('Perfil Técnico:')) profile = line.replace('Perfil Técnico:', '').trim();
            else if (line.startsWith('Atributo Chave:')) keyAttribute = line.replace('Atributo Chave:', '').trim();
        }

        result.push({
            id: `alliance_chief_${idNum}`,
            num: idNum,
            name,
            role,
            age,
            nationality,
            profile,
            keyAttribute,
            category: 'others',
            fileName: fileMapping[idNum - 1] || `alianca_${idNum}.jpg`
        });
    }

    return result;
}

async function uploadAllAvatars() {
    console.log('--- INICIANDO UPLOAD DE AVATARES PARA SUPABASE STORAGE [avatars] ---');
    const allFiles = getFilesRecursively(avatarBaseDir);
    console.log(`Total de arquivos encontrados localmente em public/avatar: ${allFiles.length}`);

    let uploadedCount = 0;
    let errorCount = 0;
    const uploadedManifest = [];

    for (const filePath of allFiles) {
        const relativePath = path.relative(avatarBaseDir, filePath).replace(/\\/g, '/');
        const fileBuffer = fs.readFileSync(filePath);
        const contentType = getContentType(filePath);

        // Upload preservando o subcaminho relativo: eng/avatar_1.jpg, ex_drivers/..., others/...
        const storagePath = relativePath;
        process.stdout.write(`Uploadando [${storagePath}]... `);

        const { data, error } = await supabase.storage.from('avatars').upload(storagePath, fileBuffer, {
            contentType,
            upsert: true
        });

        if (error) {
            console.log(`ERRO: ${error.message}`);
            errorCount++;
        } else {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(storagePath);
            console.log(`OK -> ${urlData.publicUrl}`);
            uploadedCount++;
            uploadedManifest.push({
                localPath: `/avatar/${relativePath}`,
                storagePath,
                publicUrl: urlData.publicUrl,
                contentType,
                sizeBytes: fileBuffer.length
            });
        }

        // Upload duplicado com prefixo 'avatar/' para garantir compatibilidade caso alguém use /avatar/...
        const aliasPath = `avatar/${relativePath}`;
        await supabase.storage.from('avatars').upload(aliasPath, fileBuffer, {
            contentType,
            upsert: true
        });
    }

    console.log('\n--- UPLOAD FINALIZADO ---');
    console.log(`Sucessos: ${uploadedCount} / Falhas: ${errorCount}`);

    // Parse dos metadados e compilação do catálogo estruturado
    console.log('\n--- PARSEANDO METADADOS E GERANDO CATÁLOGO ESTRUTURADO ---');
    const engMetadata = parseEngineerData(path.join(avatarBaseDir, 'eng', 'Avatar_Data.txt'));
    const driverMetadata = parseDriverData(path.join(avatarBaseDir, 'ex_drivers', 'avatar_drivers_data.txt'));
    const othersMetadata = parseOthersData(path.join(avatarBaseDir, 'others', 'data.txt'));

    const enrichItem = (item, categoryFolder) => {
        const relativeStorage = `${categoryFolder}/${item.fileName}`;
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(relativeStorage);
        return {
            ...item,
            publicUrl: urlData.publicUrl,
            localUrl: `/avatar/${relativeStorage}`
        };
    };

    const fullCatalog = {
        generatedAt: new Date().toISOString(),
        totalAvatars: engMetadata.length + driverMetadata.length + othersMetadata.length,
        engineers: engMetadata.map(m => enrichItem(m, 'eng')),
        exDrivers: driverMetadata.map(m => enrichItem(m, 'ex_drivers')),
        allianceChiefs: othersMetadata.map(m => enrichItem(m, 'others')),
        manifest: uploadedManifest
    };

    // Salva JSON
    const jsonPath = path.join(__dirname, '..', 'src', 'data', 'avatars-catalog.json');
    fs.writeFileSync(jsonPath, JSON.stringify(fullCatalog, null, 2), 'utf-8');
    console.log(`Catálogo JSON salvo em: ${jsonPath}`);

    // Salva TypeScript com tipagem completa
    const tsContent = `// Catálogo Oficial de Avatares do TS1 carregados no Supabase Storage
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
`;

    const tsPath = path.join(__dirname, '..', 'src', 'data', 'avatars-catalog.ts');
    fs.writeFileSync(tsPath, tsContent, 'utf-8');
    console.log(`Catálogo TypeScript salvo em: ${tsPath}`);

    console.log('\n--- TODOS OS AVATARES FORAM ENVIADOS AO SUPABASE E CATALOGADOS COM SUCESSO! ---');
}

uploadAllAvatars().catch(err => {
    console.error('Erro crítico no upload:', err);
    process.exit(1);
});

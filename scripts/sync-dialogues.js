/**
 * Script de Sincronização Automática de Diálogos
 * Lê DIALOGUES_SCRIPT_MASTER.md e gera src/data/dialogues.ts e src/data/dialogues.json
 */

const fs = require('fs');
const path = require('path');

const markdownPath = path.join(__dirname, '..', 'DIALOGUES_SCRIPT_MASTER.md');
const dataDir = path.join(__dirname, '..', 'src', 'data');
const jsonOutputPath = path.join(dataDir, 'dialogues.json');
const tsOutputPath = path.join(dataDir, 'dialogues.ts');

if (!fs.existsSync(markdownPath)) {
    console.error('Arquivo DIALOGUES_SCRIPT_MASTER.md não encontrado!');
    process.exit(1);
}

const markdown = fs.readFileSync(markdownPath, 'utf8');

function cleanSpeechLine(text) {
    return text
        .replace(/^>\s*/gm, '')
        .trim()
        .replace(/^\*+/, '')
        .replace(/\*+$/, '')
        .trim()
        .replace(/^[“"']+/, '')
        .replace(/[”"']+$/, '')
        .replace(/^\*+/, '')
        .replace(/\*+$/, '')
        .trim();
}

function extractActions(line) {
    const actions = [];
    const buttonRegex = /\[\s*([A-Z0-9\sÁÉÍÓÚÂÊÔÃÕÇ\.\-\/]+)\s*\](?:\s*»|\s*->\s*([^\s\)]+))?/gi;
    let match;
    while ((match = buttonRegex.exec(line)) !== null) {
        actions.push({
            label: match[1].trim(),
            target: match[2]?.trim(),
            type: match[2]?.trim() ? 'link' : 'advance'
        });
    }
    return actions;
}

function toId(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function parseScript(md) {
    const lines = md.split(/\r?\n/);
    const scenes = {};
    const inviteV2Boxes = [];

    let currentScene = null;
    let currentPhase = null;
    let currentBox = null;
    let isInsideInviteV2 = false;

    const flushBox = () => {
        if (!currentBox) return;
        if (currentPhase) {
            currentPhase.boxes.push(currentBox);
        } else if (currentScene) {
            currentScene.rawBoxes.push(currentBox);
        }
        currentBox = null;
    };

    const flushPhase = () => {
        flushBox();
        if (currentPhase && currentScene) {
            currentScene.phases.push(currentPhase);
        }
        currentPhase = null;
    };

    const flushScene = () => {
        flushPhase();
        if (currentScene) {
            scenes[currentScene.id] = currentScene;
        }
        currentScene = null;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('## ')) {
            flushScene();
            const title = line.replace(/^##\s*/, '').trim();
            currentScene = { id: toId(title), title, phases: [], rawBoxes: [] };
            isInsideInviteV2 = false;
            continue;
        }

        if (line.startsWith('### ')) {
            if (line.includes('1.2 Versão 2.0')) {
                isInsideInviteV2 = true;
            } else if (!line.includes('1.2')) {
                isInsideInviteV2 = false;
            }

            // Em seções como 1.1, 2, 5, 6 e 7, ### representa um sub-bloco/fase
            if (currentScene && !line.includes('1.2 Versão 2.0')) {
                flushPhase();
                const title = line.replace(/^###\s*/, '').trim();
                currentPhase = { id: toId(title), title, boxes: [] };
            }
            continue;
        }

        if (line.startsWith('#### ')) {
            flushPhase();
            const title = line.replace(/^####\s*/, '').trim();
            currentPhase = { id: toId(title), title, boxes: [] };
            continue;
        }

        const boxMatch = line.match(/^-\s*\*\*([^*]+)\*\*:?/);
        if (boxMatch) {
            flushBox();

            const boxName = boxMatch[1].replace(/:$/, '').trim();
            const numMatch = boxName.match(/Box\s*(\d+)/i);
            const boxNum = numMatch ? parseInt(numMatch[1], 10) : undefined;

            currentBox = {
                id: toId(boxName),
                boxNumber: boxNum,
                title: boxName,
                speaker: 'DIRETOR DE OPERAÇÕES',
                text: '',
                actions: []
            };

            // Captura eventual fala ou texto inline na mesma linha após ":"
            const afterLabel = line.slice(boxMatch[0].length).trim();
            if (afterLabel) {
                const inlineSpeech = cleanSpeechLine(afterLabel);
                if (inlineSpeech) {
                    currentBox.text = inlineSpeech;
                }
            }
            continue;
        }

        if (line.startsWith('>')) {
            const speechText = cleanSpeechLine(line);
            if (currentBox && speechText) {
                currentBox.text = currentBox.text
                    ? `${currentBox.text}\n${speechText}`
                    : speechText;

                if (isInsideInviteV2) {
                    if (currentBox.boxNumber !== undefined) {
                        inviteV2Boxes[currentBox.boxNumber] = currentBox.text;
                    } else if (currentBox.id.includes('intro')) {
                        inviteV2Boxes[0] = currentBox.text;
                    }
                }
            }
            continue;
        }

        if (line.startsWith('*(') && line.endsWith(')*') && currentBox) {
            const inner = line.slice(2, -2).trim();
            if (inner.toLowerCase().startsWith('tom:')) {
                currentBox.tone = inner.replace(/^tom:\s*/i, '').trim();
            }
            const actions = extractActions(inner);
            if (actions.length > 0) {
                currentBox.actions.push(...actions);
            }
            continue;
        }

        const directActions = extractActions(line);
        if (directActions.length > 0 && currentBox) {
            currentBox.actions.push(...directActions);
        }
    }

    flushScene();

    const cleanInviteV2 = [
        inviteV2Boxes[0] || 'Entre e feche a porta.',
        inviteV2Boxes[1] || 'Os relatórios da sua telemetria caíram na minha mesa e os números são impressionantes. Você lê o traçado antes das luzes apagarem.',
        inviteV2Boxes[2] || 'O mercado procura estrategistas capazes de cravar o tempo da pole position, prever a linha de chegada, os principais escaladores do grid e antecipar quem é o piloto dominante nos duelos internos.',
        inviteV2Boxes[3] || "Diga-me com franqueza: você tem frieza para cravar, 'SIM ou NÃO', até 50% do seu orçamento, se M.VERSTAPPEN fará a volta mais rápida da corrida?",
        inviteV2Boxes[4] || 'Mas o novo regulamento de motores da Fórmula 1 deflagrou uma verdadeira guerra fria nos bastidores. Três grandes alianças dividiram o grid, compartilham dados estratégicos e exigem lealdade absoluta.',
        inviteV2Boxes[5] || 'Chegou o momento. Escolha sua aliança, requisite sua vaga no pitwall e assuma o controle das operações.'
    ];

    // Seção 3: Despacho dos Chefes de Consórcio (A, B, C)
    const sec3 = scenes['3_despacho_dos_chefes_de_cons_rcio'];
    const allianceDispatch = { A: '', B: '', C: '' };
    if (sec3) {
        const allSec3Boxes = [...sec3.rawBoxes, ...sec3.phases.flatMap((p) => p.boxes)];
        for (const b of allSec3Boxes) {
            if (!b.text) continue;
            if (b.title.includes('Bloco A')) allianceDispatch.A = b.text;
            else if (b.title.includes('Bloco B')) allianceDispatch.B = b.text;
            else if (b.title.includes('Bloco C')) allianceDispatch.C = b.text;
        }
    }

    // Seção 4: Homologação no Quartel-General (/headquarters)
    const sec4 = scenes['4_homologa_o_no_quartel_general_headquarters_'];
    let headquartersSpeech = '';
    if (sec4) {
        const allSec4Boxes = [...sec4.rawBoxes, ...sec4.phases.flatMap((p) => p.boxes)];
        const parts = allSec4Boxes.map((b) => b.text).filter(Boolean);
        if (parts.length > 0) {
            headquartersSpeech = parts.join('\n\n');
        }
    }

    // Seção 5: Hospitalidade Oficial dos 11 Chefes de Equipe (mapeados pelo código ex: T.WOLFF)
    const sec5 = scenes['5_hospitalidade_oficial_os_11_chefes_de_equipe'];
    const teamPrincipalWelcomes = {};
    if (sec5) {
        for (const phase of sec5.phases) {
            const codeMatch = phase.title.match(/`([A-Z]\.[A-Z]+)`/);
            const welcomeBox = phase.boxes.find((b) => b.title.toLowerCase().includes('hospitality welcome') && b.text);
            if (codeMatch && welcomeBox) {
                teamPrincipalWelcomes[codeMatch[1]] = welcomeBox.text;
            }
        }
    }

    // Seção 6: Ciclo de 7 Dias da Race Week
    const sec6 = scenes['6_o_ciclo_de_7_dias_da_race_week'];
    const raceWeekDialogs = {};
    const dayMap = {
        'dia 1': 'mon',
        'dia 2': 'tue',
        'dia 3': 'wed',
        'dia 4': 'thu',
        'dia 5': 'fri',
        'dia 6': 'sat',
        'dia 7': 'sun'
    };
    if (sec6) {
        for (const phase of sec6.phases) {
            const lowerTitle = phase.title.toLowerCase();
            const dayEntry = Object.entries(dayMap).find(([k]) => lowerTitle.includes(k));
            if (!dayEntry) continue;
            const dayId = dayEntry[1];

            const normalBox = phase.boxes.find((b) => {
                const t = b.title.toLowerCase();
                return t.includes('diálogo de paddock') && !t.includes('sprint');
            });
            const sprintBox = phase.boxes.find((b) => {
                const t = b.title.toLowerCase();
                return t.includes('diálogo de paddock') && t.includes('sprint');
            });
            const targetBox = phase.boxes.find((b) => b.title.toLowerCase().includes('alvo tático'));

            raceWeekDialogs[dayId] = {
                message: normalBox?.text || '',
                sprintMessage: sprintBox?.text || undefined,
                tacticalObjective: targetBox?.text || undefined
            };
        }
    }

    // Seção 7: Monitor de Relações (Reações por Chefe/Equipe)
    const sec7 = scenes['7_monitor_de_rela_es_rea_es_din_micas_p_s_resultado'];
    const teamPrincipalReactions = {};
    if (sec7) {
        const teamMap = {
            mercedes: 'MER',
            ferrari: 'FER',
            mclaren: 'MCL',
            'red bull': 'RBR'
        };
        for (const phase of sec7.phases) {
            const pLower = phase.title.toLowerCase();
            const tier = pLower.includes('vitória') ? 'victory'
                : pLower.includes('mediano') ? 'average'
                : pLower.includes('abaixo') ? 'poor'
                : null;
            if (!tier) continue;

            for (const box of phase.boxes) {
                if (!box.text) continue;
                const bLower = box.title.toLowerCase();
                const teamEntry = Object.entries(teamMap).find(([k]) => bLower.includes(k));
                if (!teamEntry) continue;
                const teamCode = teamEntry[1];
                if (!teamPrincipalReactions[teamCode]) teamPrincipalReactions[teamCode] = {};
                teamPrincipalReactions[teamCode][tier] = box.text;
            }
        }
    }

    return {
        scenes,
        inviteV2Dialogs: cleanInviteV2,
        allianceDispatch,
        headquartersSpeech,
        teamPrincipalWelcomes,
        teamPrincipalReactions,
        raceWeekDialogs
    };
}

const parsed = parseScript(markdown);

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 1. Grava JSON
fs.writeFileSync(jsonOutputPath, JSON.stringify(parsed, null, 2), 'utf8');

// 2. Grava Módulo TypeScript Tipado
const tsContent = `/**
 * ARQUIVO GERADO AUTOMATICAMENTE VIA "npm run sync-dialogues"
 * Fonte canônica: DIALOGUES_SCRIPT_MASTER.md
 * NÃO EDITE DIRETAMENTE ESTE ARQUIVO. EDITE O MARKDOWN E EXECUTE O SCRIPT.
 */

export interface DialogueAction {
    label: string;
    target?: string;
    type?: 'link' | 'advance' | 'modal' | 'submit';
}

export interface DialogueBox {
    id: string;
    boxNumber?: number;
    title?: string;
    speaker: string;
    role?: string;
    text: string;
    tone?: string;
    actions: DialogueAction[];
    autoAdvanceSec?: number;
}

export interface DialoguePhase {
    id: string;
    title: string;
    boxes: DialogueBox[];
}

export interface DialogueScene {
    id: string;
    title: string;
    phases: DialoguePhase[];
    rawBoxes: DialogueBox[];
}

export interface RaceWeekDayDialog {
    message: string;
    sprintMessage?: string;
    tacticalObjective?: string;
}

export interface MasterScriptData {
    scenes: Record<string, DialogueScene>;
    inviteV2Dialogs: string[];
    allianceDispatch: Record<'A' | 'B' | 'C', string>;
    headquartersSpeech: string;
    teamPrincipalWelcomes: Record<string, string>;
    teamPrincipalReactions: Record<string, Partial<Record<'victory' | 'average' | 'poor', string>>>;
    raceWeekDialogs: Record<string, RaceWeekDayDialog>;
}

export const MASTER_DIALOGUES_DATA: MasterScriptData = ${JSON.stringify(parsed, null, 2)};

export const INVITE_V2_DIALOGS: string[] = MASTER_DIALOGUES_DATA.inviteV2Dialogs;
export const ALLIANCE_DISPATCH_DIALOGS: Record<'A' | 'B' | 'C', string> = MASTER_DIALOGUES_DATA.allianceDispatch;
export const HEADQUARTERS_DIALOG_TEXT: string = MASTER_DIALOGUES_DATA.headquartersSpeech;
export const TEAM_PRINCIPAL_WELCOMES: Record<string, string> = MASTER_DIALOGUES_DATA.teamPrincipalWelcomes;
export const TEAM_PRINCIPAL_REACTIONS: Record<string, Partial<Record<'victory' | 'average' | 'poor', string>>> = MASTER_DIALOGUES_DATA.teamPrincipalReactions;
export const RACE_WEEK_DIALOGS: Record<string, RaceWeekDayDialog> = MASTER_DIALOGUES_DATA.raceWeekDialogs;

export function getDialogueScene(sceneId: string): DialogueScene | undefined {
    return MASTER_DIALOGUES_DATA.scenes[sceneId];
}
`;

fs.writeFileSync(tsOutputPath, tsContent, 'utf8');
console.log('✓ Sincronização concluída com sucesso!');
console.log(`- JSON gerado em: ${jsonOutputPath}`);
console.log(`- TypeScript gerado em: ${tsOutputPath}`);
console.log(`- ${parsed.inviteV2Dialogs.length} falas do Invite V2 indexadas com perfeição.`);

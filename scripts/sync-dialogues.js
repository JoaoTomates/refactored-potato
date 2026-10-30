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

function cleanSpeechText(text) {
    return text
        .replace(/^>\s*/gm, '')
        .replace(/^\s*[\*“"']\s*/, '')
        .replace(/\s*[\*“"']\s*$/, '')
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

function parseScript(md) {
    const lines = md.split(/\r?\n/);
    const scenes = {};
    const inviteV2Boxes = [];

    let currentScene = null;
    let currentPhase = null;
    let currentBox = null;
    let isInsideInviteV2 = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('## ')) {
            if (currentBox && currentPhase) currentPhase.boxes.push(currentBox);
            if (currentPhase && currentScene) currentScene.phases.push(currentPhase);
            if (currentScene) scenes[currentScene.id] = currentScene;

            const title = line.replace(/^##\s*/, '').trim();
            const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
            currentScene = { id, title, phases: [], rawBoxes: [] };
            currentPhase = null;
            currentBox = null;
            isInsideInviteV2 = false;
            continue;
        }

        if (line.includes('1.2 Versão 2.0')) {
            isInsideInviteV2 = true;
        } else if (line.startsWith('### ') && !line.includes('1.2')) {
            isInsideInviteV2 = false;
        }

        if (line.startsWith('#### ')) {
            if (currentBox && currentPhase) currentPhase.boxes.push(currentBox);
            if (currentPhase && currentScene) currentScene.phases.push(currentPhase);

            const title = line.replace(/^####\s*/, '').trim();
            const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
            currentPhase = { id, title, boxes: [] };
            currentBox = null;
            continue;
        }

        const boxMatch = line.match(/^-\s*\*\*([^*]+)\*\*:/);
        if (boxMatch) {
            if (currentBox && currentPhase) currentPhase.boxes.push(currentBox);

            const boxName = boxMatch[1].trim();
            const numMatch = boxName.match(/Box\s*(\d+)/i);
            const boxNum = numMatch ? parseInt(numMatch[1], 10) : undefined;

            currentBox = {
                id: boxName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                boxNumber: boxNum,
                title: boxName,
                speaker: 'DIRETOR DE OPERAÇÕES',
                text: '',
                actions: []
            };
            continue;
        }

        if (line.startsWith('>')) {
            const speechText = cleanSpeechText(line);
            if (currentBox && speechText) {
                currentBox.text = currentBox.text 
                    ? `${currentBox.text}\n${speechText}` 
                    : speechText;

                if (isInsideInviteV2) {
                    if (currentBox.boxNumber !== undefined) {
                        inviteV2Boxes[currentBox.boxNumber] = speechText;
                    } else if (currentBox.id.includes('intro')) {
                        inviteV2Boxes[0] = speechText;
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

    if (currentBox && currentPhase) currentPhase.boxes.push(currentBox);
    if (currentPhase && currentScene) currentScene.phases.push(currentPhase);
    if (currentScene) scenes[currentScene.id] = currentScene;

    const cleanInviteV2 = [
        inviteV2Boxes[0] || "Entre e feche a porta.",
        inviteV2Boxes[1] || "O mercado procura estrategistas capazes de • cravar o Poletime - ou pelo menos ficar dentro da margem de 5 segundos, • prever a linha de chegada, • os principais escaladores do grid e antecipar • quem é o piloto dominante nos duelos internos.",
        inviteV2Boxes[2] || "Diga-me com franqueza: você tem frieza para apostar, em 'SIM ou NÃO', até 50% do seu orçamento, se M.VERSTAPPEN fará a volta mais rápida da corrida?",
        inviteV2Boxes[3] || "Mas o novo regulamento de motores da Fórmula 1 deflagrou uma verdadeira guerra fria nos bastidores. Três grandes alianças dividiram o grid e exigem lealdade absoluta.",
        inviteV2Boxes[4] || "Chegou o momento. Escolha sua aliança, requisite sua vaga no pitwall e assuma o controle das operações."
    ];

    return {
        scenes,
        inviteV2Dialogs: cleanInviteV2
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

export interface MasterScriptData {
    scenes: Record<string, DialogueScene>;
    inviteV2Dialogs: string[];
}

export const MASTER_DIALOGUES_DATA: MasterScriptData = ${JSON.stringify(parsed, null, 2)};

export const INVITE_V2_DIALOGS: string[] = MASTER_DIALOGUES_DATA.inviteV2Dialogs;

export function getDialogueScene(sceneId: string): DialogueScene | undefined {
    return MASTER_DIALOGUES_DATA.scenes[sceneId];
}
`;

fs.writeFileSync(tsOutputPath, tsContent, 'utf8');
console.log('✓ Sincronização concluída com sucesso!');
console.log(`- JSON gerado em: ${jsonOutputPath}`);
console.log(`- TypeScript gerado em: ${tsOutputPath}`);
console.log(`- ${parsed.inviteV2Dialogs.length} falas do Invite V2 indexadas com perfeição.`);

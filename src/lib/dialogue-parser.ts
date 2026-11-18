/**
 * TS1 Markdown Dialogue & Narrative Parser
 * 
 * Converte o arquivo canônico DIALOGUES_SCRIPT_MASTER.md em estruturas
 * de dados tipadas para consumo direto pela interface e fluxos operacionais.
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
    inviteV2Dialogs: string[]; // Array pronto para consumo no InviteFlow
}

/**
 * Remove formatações de blockquote e aspas externas do texto de diálogo
 */
function cleanSpeechText(text: string): string {
    return text
        .replace(/^>\s*/gm, '')
        .replace(/^[\s*“"'`]+/, '')
        .replace(/[\s*”"'`]+$/, '')
        .trim();
}

/**
 * Extrai rótulos de botão no padrão [ BOTAO ] » ou [ BOTAO ]
 */
function extractActions(line: string): DialogueAction[] {
    const actions: DialogueAction[] = [];
    const buttonRegex = /\[\s*([A-Z0-9\sÁÉÍÓÚÂÊÔÃÕÇ\.\-\/]+)\s*\](?:\s*»|\s*->\s*([^\s\)]+))?/gi;
    let match;
    while ((match = buttonRegex.exec(line)) !== null) {
        const label = match[1].trim();
        const target = match[2]?.trim();
        actions.push({
            label,
            target,
            type: target ? 'link' : 'advance'
        });
    }
    return actions;
}

/**
 * Analisa o conteúdo Markdown do DIALOGUES_SCRIPT_MASTER.md
 */
export function parseDialogueScript(markdown: string): MasterScriptData {
    const lines = markdown.split(/\r?\n/);
    const scenes: Record<string, DialogueScene> = {};
    const inviteV2Boxes: string[] = [];

    let currentScene: DialogueScene | null = null;
    let currentPhase: DialoguePhase | null = null;
    let currentBox: DialogueBox | null = null;

    let isInsideInviteV2 = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detecta Seção Principal (H2)
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

        // Detecta Versão 2.0 do Convite
        if (line.includes('1.2 Versão 2.0')) {
            isInsideInviteV2 = true;
        } else if (line.startsWith('### ') && !line.includes('1.2')) {
            isInsideInviteV2 = false;
        }

        // Detecta Fases (H4)
        if (line.startsWith('#### ')) {
            if (currentBox && currentPhase) currentPhase.boxes.push(currentBox);
            if (currentPhase && currentScene) currentScene.phases.push(currentPhase);

            const title = line.replace(/^####\s*/, '').trim();
            const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
            currentPhase = { id, title, boxes: [] };
            currentBox = null;
            continue;
        }

        // Detecta início de Box: "- **Box 1..." ou "- **Fase INTRO:**"
        const boxMatch = line.match(/^-\s*\*\*([^*]+)\*\*:?/);
        if (boxMatch) {
            if (currentBox && currentPhase) currentPhase.boxes.push(currentBox);

            const boxName = boxMatch[1].replace(/:$/, '').trim();
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

        // Detecta citação de texto (Fala do personagem)
        if (line.startsWith('>')) {
            const speechText = cleanSpeechText(line);
            if (currentBox && speechText) {
                currentBox.text = currentBox.text 
                    ? `${currentBox.text}\n${speechText}` 
                    : speechText;

                if (isInsideInviteV2) {
                    // Se estiver no Invite V2, alimenta a lista plana ordenada de diálogos
                    if (currentBox.boxNumber !== undefined) {
                        inviteV2Boxes[currentBox.boxNumber] = speechText;
                    } else if (currentBox.id.includes('intro')) {
                        inviteV2Boxes[0] = speechText;
                    }
                }
            }
            continue;
        }

        // Detecta Tom / Ação entre parênteses
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

        // Detecta botões expressos na linha
        const directActions = extractActions(line);
        if (directActions.length > 0 && currentBox) {
            currentBox.actions.push(...directActions);
        }
    }

    // Fecha pendências finais
    if (currentBox && currentPhase) currentPhase.boxes.push(currentBox);
    if (currentPhase && currentScene) currentScene.phases.push(currentPhase);
    if (currentScene) scenes[currentScene.id] = currentScene;

    // Normaliza os 5 diálogos sequenciais do Invite V2
    const cleanInviteV2: string[] = [
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

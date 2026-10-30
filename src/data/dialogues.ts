/**
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

export const MASTER_DIALOGUES_DATA: MasterScriptData = {
  "scenes": {
    "_ndice": {
      "id": "_ndice",
      "title": "Índice",
      "phases": [],
      "rawBoxes": []
    },
    "1_onboarding_o_chamado_confidencial": {
      "id": "1_onboarding_o_chamado_confidencial",
      "title": "1. Onboarding & O Chamado Confidencial",
      "phases": [
        {
          "id": "sequ_ncia_do_di_logo_",
          "title": "Sequência do Diálogo:",
          "boxes": []
        },
        {
          "id": "fase_1_recep_o_inicial_caminhada_ao_motorhome_",
          "title": "Fase 1: Recepção Inicial (Caminhada ao Motorhome)",
          "boxes": []
        },
        {
          "id": "fase_2_m_rito_t_cnico_telemetria_a_provoca_o_do_bankroll_p_gina_1_",
          "title": "Fase 2: Mérito Técnico, Telemetria & A Provocação do Bankroll (Página 1)",
          "boxes": []
        },
        {
          "id": "fase_3_a_nova_ordem_e_a_tomada_de_posi_o_p_gina_2_",
          "title": "Fase 3: A Nova Ordem e a Tomada de Posição (Página 2)",
          "boxes": []
        },
        {
          "id": "fase_4_o_dossi_das_alian_as_p_gina_3_",
          "title": "Fase 4: O Dossiê das Alianças (Página 3)",
          "boxes": []
        },
        {
          "id": "fase_5_resposta_imediata_da_diretoria_emiss_o_da_superlicen_a_fase_enlist_",
          "title": "Fase 5: Resposta Imediata da Diretoria & Emissão da Superlicença (Fase ENLIST)",
          "boxes": []
        },
        {
          "id": "fase_6_confirma_o_designa_o_do_mentor_fase_email_sent_",
          "title": "Fase 6: Confirmação & Designação do Mentor (Fase EMAIL_SENT)",
          "boxes": []
        }
      ],
      "rawBoxes": []
    },
    "2_guerra_fria_dos_motores_2026_manifesto_dos_blocos": {
      "id": "2_guerra_fria_dos_motores_2026_manifesto_dos_blocos",
      "title": "2. Guerra Fria dos Motores 2026: Manifesto dos Blocos",
      "phases": [],
      "rawBoxes": []
    },
    "3_despacho_dos_chefes_de_cons_rcio": {
      "id": "3_despacho_dos_chefes_de_cons_rcio",
      "title": "3. Despacho dos Chefes de Consórcio",
      "phases": [],
      "rawBoxes": []
    },
    "4_homologa_o_no_quartel_general_headquarters_": {
      "id": "4_homologa_o_no_quartel_general_headquarters_",
      "title": "4. Homologação no Quartel-General (`/headquarters`)",
      "phases": [],
      "rawBoxes": []
    },
    "5_hospitalidade_oficial_os_11_chefes_de_equipe": {
      "id": "5_hospitalidade_oficial_os_11_chefes_de_equipe",
      "title": "5. Hospitalidade Oficial: Os 11 Chefes de Equipe",
      "phases": [],
      "rawBoxes": []
    },
    "6_o_ciclo_de_7_dias_da_race_week": {
      "id": "6_o_ciclo_de_7_dias_da_race_week",
      "title": "6. O Ciclo de 7 Dias da Race Week",
      "phases": [],
      "rawBoxes": []
    },
    "7_monitor_de_rela_es_rea_es_din_micas_p_s_resultado": {
      "id": "7_monitor_de_rela_es_rea_es_din_micas_p_s_resultado",
      "title": "7. Monitor de Relações: Reações Dinâmicas Pós-Resultado",
      "phases": [
        {
          "id": "a_vit_ria_p_dio_acerto_cravado_no_poletime_moral_alta_",
          "title": "A. Vitória / Pódio / Acerto Cravado no Poletime (Moral Alta ▲)",
          "boxes": []
        },
        {
          "id": "b_desempenho_mediano_dentro_da_meta_esperada_moral_est_vel_",
          "title": "B. Desempenho Mediano / Dentro da Meta Esperada (Moral Estável ▬)",
          "boxes": []
        },
        {
          "id": "c_abaixo_da_meta_erro_cr_tico_na_estrat_gia_moral_em_queda_press_o_",
          "title": "C. Abaixo da Meta / Erro Crítico na Estratégia (Moral em Queda / Pressão ▼)",
          "boxes": []
        }
      ],
      "rawBoxes": []
    },
    "8_sabedoria_t_tica_dos_estrategistas_s_niores": {
      "id": "8_sabedoria_t_tica_dos_estrategistas_s_niores",
      "title": "8. Sabedoria Tática dos Estrategistas Sêniores",
      "phases": [],
      "rawBoxes": []
    },
    "9_transmiss_es_ao_vivo_de_r_dio_no_pit_wall": {
      "id": "9_transmiss_es_ao_vivo_de_r_dio_no_pit_wall",
      "title": "9. Transmissões ao Vivo de Rádio no Pit Wall",
      "phases": [],
      "rawBoxes": []
    }
  },
  "inviteV2Dialogs": [
    "Entre e feche a porta.",
    "O mercado procura estrategistas capazes de • cravar o Poletime - ou pelo menos ficar dentro da margem de 5 segundos, • prever a linha de chegada, • os principais escaladores do grid e antecipar • quem é o piloto dominante nos duelos internos.",
    "Diga-me com franqueza: você tem frieza para apostar, em 'SIM ou NÃO', até 50% do seu orçamento, se M.VERSTAPPEN fará a volta mais rápida da corrida?",
    "Mas o novo regulamento de motores da Fórmula 1 deflagrou uma verdadeira guerra fria nos bastidores. Três grandes alianças dividiram o grid e exigem lealdade absoluta.",
    "Chegou o momento. Escolha sua aliança, requisite sua vaga no pitwall e assuma o controle das operações."
  ]
};

export const INVITE_V2_DIALOGS: string[] = MASTER_DIALOGUES_DATA.inviteV2Dialogs;

export function getDialogueScene(sceneId: string): DialogueScene | undefined {
    return MASTER_DIALOGUES_DATA.scenes[sceneId];
}

export type Locale = 'en' | 'pt';

export const INVITE_LOCALE = {
  en: {
    dialog: [
      "Pull up a chair and close the door. Your reports crossed my desk and the numbers are impressive.",
      "But no one wins alone. The new engine regulations turned the game upside down, and you need to pick a side in this war.",
      "So, where are you placing your chips?"
    ],
    career_prompt: "Which path would you take?",
    groups: [
      { id: 1, title: "ALIANÇA MERCEDES", teams: ["MER", "MCL", "ALP", "WIL"], hint: "Foco em dados, potência de fábrica estabelecida e consistência de pontuação." },
      { id: 2, title: "BLOCO FERRARI", teams: ["FER", "HAA", "CAD"], hint: "Tradição de Maranello, forte integração técnica e a nova força americana no grid." },
      { id: 3, title: "A VANGUARDA (FORD, HONDA & AUDI)", teams: ["RBR", "RBA", "AST", "AUD"], hint: "Motores inéditos, alto risco e ambição máxima das novas fabricantes." }
    ],
    dialog2: [
      "I understand perfectly. Well, since we are a Fantasy RPG and contracts are dynamic, I have these two invitations from your chosen path... plus a third, unexpected option."
    ],
    team_prompt: "Which garage are we taking over?",
    contact_prompt: "I need a secure line. Drop your email below so we can lock this in.",
    email_placeholder: "EMAIL ADDRESS",
    password_placeholder: "SECURE PASSWORD",
    profile_prompt: "Last piece of paperwork. Who am I representing today?",
    first_name_placeholder: "FIRST NAME",
    last_name_placeholder: "LAST NAME",
    number_placeholder: "RACE NUMBER (0-99)",
    btn_continue: "TURN PAGE RIGHT >",
    btn_sign: "SIGN THE CONTRACT",
    processing: "PROCESSING...",
    error_fallback: "Bloody hell, something went wrong. Let's try that again."
  },
  pt: {
    dialog: [
      "Puxe uma cadeira e feche a porta. Os seus relatórios caíram na minha mesa e os números são impressionantes.",
      "Mas ninguém vence sozinho. E o novo regulamento de motores virou o jogo de ponta-cabeça e você precisa escolher seu lado nessa guerra.",
      "Então, onde você vai colocar suas fichas?"
    ],
    career_prompt: "Qual caminho seguiria?",
    groups: [
      { id: 1, title: "ALIANÇA MERCEDES", teams: ["MER", "MCL", "ALP", "WIL"], hint: "Foco em dados, potência de fábrica estabelecida e consistência de pontuação." },
      { id: 2, title: "BLOCO FERRARI", teams: ["FER", "HAA", "CAD"], hint: "Tradição de Maranello, forte integração técnica e a nova força americana no grid." },
      { id: 3, title: "A VANGUARDA (FORD, HONDA & AUDI)", teams: ["RBR", "RBA", "AST", "AUD"], hint: "Motores inéditos, alto risco e ambição máxima das novas fabricantes." }
    ],
    dialog2: [
      "Entendo perfeitamente. Bem, somos um Fantasy RPG. Consegui esses dois convites da sua escolha... e mais uma terceira opção inusitada."
    ],
    team_prompt: "Qual garagem vamos assumir?",
    contact_prompt: "Preciso de uma linha segura. Informe seu email abaixo para garantirmos a vaga.",
    email_placeholder: "ENDEREÇO DE EMAIL",
    password_placeholder: "SENHA SEGURA",
    profile_prompt: "Última papelada. Quem estou representando hoje?",
    first_name_placeholder: "NOME",
    last_name_placeholder: "SOBRENOME",
    number_placeholder: "Nº DO CARRO (0-99)",
    btn_continue: "VIRAR A PÁGINA >",
    btn_sign: "ASSINAR CONTRATO",
    processing: "PROCESSANDO...",
    error_fallback: "Maldição, algo deu errado. Vamos tentar novamente."
  }
};

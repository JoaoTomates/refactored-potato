export type Locale = 'en' | 'pt';

export const INVITE_LOCALE = {
  en: {
    dialog: [
      "Listen closely, mate. The grid is bleeding for fresh talent, and your numbers crossed my desk. I've got three syndicates ready to back a rookie. We just need to make a choice."
    ],
    career_prompt: "Select your Career Path",
    groups: [
      { id: 1, title: "Apex Predators", desc: "MCL / MER / WIL", hint: "High stakes, massive budgets." },
      { id: 2, title: "Scuderia Veloce", desc: "FER / HAA / AUD / CAD", hint: "Passion, history, and raw speed." },
      { id: 3, title: "Neon Racing", desc: "RBR / RBA / AST / ALP", hint: "Disruptors and pure performance." }
    ],
    team_prompt: "Which garage are we taking over?",
    contact_prompt: "I need a secure line. Drop your email below so we can lock this in.",
    email_placeholder: "EMAIL ADDRESS",
    password_placeholder: "SECURE PASSWORD",
    profile_prompt: "Last piece of paperwork. Who am I representing today?",
    first_name_placeholder: "FIRST NAME",
    last_name_placeholder: "LAST NAME",
    number_placeholder: "RACE NUMBER (0-99)",
    btn_continue: "CONTINUE",
    btn_sign: "SIGN THE CONTRACT",
    processing: "PROCESSING...",
    error_fallback: "Bloody hell, something went wrong. Let's try that again."
  },
  pt: {
    dialog: [
      "Preste atenção. O grid está sedento por sangue novo, e os seus números caíram na minha mesa. Tenho três grupos dispostos a bancar um novato. Só precisamos fazer uma escolha."
    ],
    career_prompt: "Escolha sua Carreira",
    groups: [
      { id: 1, title: "Predadores", desc: "MCL / MER / WIL", hint: "Orçamentos gigantes e muita pressão." },
      { id: 2, title: "Scuderia Veloce", desc: "FER / HAA / AUD / CAD", hint: "Paixão, história e velocidade bruta." },
      { id: 3, title: "Neon Racing", desc: "RBR / RBA / AST / ALP", hint: "Disruptores de alta performance." }
    ],
    team_prompt: "Qual garagem vamos assumir?",
    contact_prompt: "Preciso de uma linha segura. Informe seu email abaixo para garantirmos a vaga.",
    email_placeholder: "ENDEREÇO DE EMAIL",
    password_placeholder: "SENHA SEGURA",
    profile_prompt: "Última papelada. Quem estou representando hoje?",
    first_name_placeholder: "NOME",
    last_name_placeholder: "SOBRENOME",
    number_placeholder: "Nº DO CARRO (0-99)",
    btn_continue: "CONTINUAR",
    btn_sign: "ASSINAR CONTRATO",
    processing: "PROCESSANDO...",
    error_fallback: "Maldição, algo deu errado. Vamos tentar novamente."
  }
};

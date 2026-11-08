# Roteiro Canônico de Diálogos & Narrativa // BAEFF1 Paddock Intelligence
> **Documento Oficial de Consulta e Edição de Diálogos**  
> *Versão:* 2.0 (Guerra dos Motores & Temporada 2026)  
> *Tom Narrativo:* Cyberpunk Noir, Terminal de Pitwall, Alta Fidelidade F1, Thriller Corporativo.

---

## Índice
1. [Onboarding & O Chamado Confidencial (`/invite`, `/superlicense`)](#1-onboarding--o-chamado-confidencial)
2. [Guerra Fria dos Motores 2026: Manifesto dos Blocos](#2-guerra-fria-dos-motores-2026-manifesto-dos-blocos)
3. [Despacho dos Chefes de Consórcio](#3-despacho-dos-chefes-de-consórcio)
4. [Homologação no Quartel-General (`/headquarters`)](#4-homologação-no-quartel-general)
5. [Hospitalidade Oficial: Os 11 Chefes de Equipe](#5-hospitalidade-oficial-os-11-chefes-de-equipe)
6. [O Ciclo de 7 Dias da Race Week (Briefings & Rádio de Paddock)](#6-o-ciclo-de-7-dias-da-race-week)
7. [Monitor de Relações: Reações Dinâmicas Pós-Resultado](#7-monitor-de-relações-reações-dinâmicas-pós-resultado)
8. [Sabedoria Tática dos Estrategistas Sêniores (Mentores Ex-Pilotos)](#8-sabedoria-tática-dos-estrategistas-sêniores)
9. [Transmissões ao Vivo de Rádio no Pit Wall](#9-transmissões-ao-vivo-de-rádio-no-pit-wall)

---

## 1. Onboarding & O Chamado Confidencial

---

### 1.1 Versão 1.0 (Clássica / Roteiro Original do Onboarding)
*Cenário:* Uma sala fechada com vista chuvosa para o pitlane noturno. O silêncio é quebrado apenas pelos cliques de relés mecânicos e monitores âmbar.  
*Personagem:* **Diretor de Operações BAEFF1**  
*Arquivo Fonte:* `src/locales/invite.ts`, `src/app/lore/page.tsx`

#### Sequência do Diálogo:
- **Linha 1:**  
  > *“Puxe uma cadeira e feche a porta.”*  
  *(Tom: Seco, sério, confidencial. Estabelece a gravidade do momento.)*
- **Linha 2:**  
  > *“Os relatórios da sua telemetria caíram na minha mesa e os números são impressionantes. Você lê o traçado antes das luzes apagarem.”*  
  *(Tom: Reconhecimento contido de talento acima da média.)*
- **Linha 3:**  
  > *“Mas ninguém vence sozinho neste esporte. O novo regulamento de motores virou o jogo de ponta-cabeça e deflagrou uma verdadeira guerra fria nos bastidores. As fronteiras foram traçadas e três grandes alianças se formaram no grid.”*  
  *(Tom: Geopolítico, tenso, introduzindo a Era 2026.)*
- **Linha 4:**  
  > *“Então... onde você vai colocar suas fichas?”*  
  *(Gatilho: Desbloqueio da seleção das 3 alianças técnicas.)*
- **Linha 5 (Após seleção do bloco):**  
  > *“Entendo perfeitamente sua escolha. Como os contratos na BAEFF1 são dinâmicos e disputados a tapa, consegui duas ofertas oficiais dentro do seu bloco... mais uma opção inusitada da diretoria.”*  
  *(Gatilho: Ofertas de garagens vagas.)*
- **Linha 6 (Formalização da Superlicença):**  
  > *“Preciso de uma linha criptografada e da sua assinatura digital. Quem estou representando hoje no Pit Wall?”*

---

### 1.2 Versão 2.0 (Atual Dinâmica — Implementada em `/invite` e `InviteFlow`)
*Cenário:* O jogador caminha em pixel art rumo ao motorhome da BAEFF1 (`/pixel_invite_walk.jpg`) e entra na central de dados iluminada por telas de telemetria CRT (`/pixel_invite_bg_v2.jpg`). O ritmo é pontuado por som de máquina mecânica (`PitWallSoundEngine`), paginação de tela limpa e contagem de transição automática de 10 segundos.  
*Personagem:* **Diretor Executivo de Operações BAEFF1**  
*Arquivo Fonte:* `src/components/invite-flow.tsx`

#### Fase 1: Recepção Inicial (Caminhada ao Motorhome)
- **Fase INTRO:**
  > *“Entre e feche a porta.”*  
  *(Ação do usuário: Clicar para avançar ou aguardar digitação do teletipo retro.)*

#### Fase 2: Mérito Técnico, Telemetria & A Provocação do Bankroll (Página 1)
- **Box 1 (Perfil de Estrategista & Habilidades-Chave):**  
  > *“O mercado procura estrategistas capazes de cravar o tempo da pole position, prever a linha de chegada, os principais escaladores do grid e antecipar quem é o piloto dominante nos duelos internos.”*  
  *(Tom: Profissional, desafiador, definindo as quatro mecânicas do fantasy.)*
- **Box 2 (O Teste de Nervos de Aço):**  
  > *“Diga-me com franqueza: você tem frieza para apostar, em 'SIM ou NÃO', até 50% do seu orçamento, se M.VERSTAPPEN fará a volta mais rápida da corrida?”*  
  *(Tom: Provocativo e visceral. Coloca o jogador sob teste psicológico de risco financeiro.)*  
  *(Transição: Contagem regressiva de 10s com botão `[ AVANÇAR ] »` disponível.)*

#### Fase 3: A Nova Ordem e a Tomada de Posição (Página 2)
- **Box 3 (Guerra Fria dos Motores):**  
  > *“Mas o novo regulamento de motores da Fórmula 1 deflagrou uma verdadeira guerra fria nos bastidores. Três grandes alianças dividiram o grid, compartilham dados estratégicos e exigem lealdade absoluta.”*  
  *(Tom: Geopolítica de paddock, tensão entre as montadoras.)*
- **Box 4 (O Chamado às Armas):**  
  > *“Chegou o momento. Escolha sua aliança, requisite sua vaga no pitwall e assuma o controle das operações.”*  
  *(Ação: Abre a seleção das 3 frentes de motores com botão `[ VER ALIANÇAS ] »`.)*

#### Fase 4: O Dossiê das Alianças (Página 3)
- **Opção 1 — [BLOCO A] CONSÓRCIO DA ESTRELA:**  
  > *EQUIPES: Mercedes, McLaren, Alpine, Williams*  
  > *SPEC: Mercedes-AMG M16 E Performance V6 Turbo Hybrid*  
  > *“CONFIABILIDADE DE AÇO & DOMÍNIO DE FROTA”*  
  
- **Opção 2 — [BLOCO B] A DINASTIA DE MARANELLO:**  
  > *EQUIPES: Ferrari, Haas, Cadillac*  
  > *SPEC: Ferrari 067/3 Hybrid E-Turbo Speciale*  
  > *“POTÊNCIA, TRADIÇÃO & A FRENTE AMERICANA”*  
  
- **Opção 3 — [BLOCO C] A VANGUARDA:**  
  > *EQUIPES: Red Bull Racing, Racing Bulls, Aston Martin, Audi*  
  > *“AMBIÇÃO EXTREMA E RISCO TECNOLÓGICO”*  
  > *SPEC: Red Bull Powertrains-Ford / Honda HRC / Audi PU*  
  
#### Fase 5: Resposta Imediata da Diretoria & Emissão da Superlicença (Fase ENLIST)
- O Diretor responde imediatamente de acordo com o bloco selecionado:
  - *Bloco A:* `“Escolha metódica. Você optou pela maior frota de motores da Alemanha...”`
  - *Bloco B:* `“Sangue quente. Você escolheu a paixão de Maranello e a agressividade da nova parceira americana...”`
  - *Bloco C:* `Gostei da sua ousadia. Você foi direto no terreno desconhecido da Ford, da Honda e da Audi...”`
- **Formulário de Cadastro:**
  > *(Os campos de Nome e Sobrenome e E-mail surgem com efeito fade-in após a conclusão da fala).*  
  *(Gera automaticamente o código do piloto no padrão `L.GUSTAVO88` e o slug `@lgustavo88` a partir de Nome e Sobrenome).*

#### Fase 6: Confirmação & Designação do Mentor (Fase EMAIL_SENT)
- **Despacho Operacional:**  
  > *“VERIFIQUE SEU E-MAIL: Um link de homologação foi transmitido. Clique no link de confirmação para validar sua Superlicença e desbloquear as duas vagas de equipe no pitwall.”*
- **Sorteio do Conselheiro Sênior do Pitwall:**  
  > *Um dos 24 Estrategistas Sêniores (ex: `M.AMON`, `T.WARWICK`) é sorteado para ser o mentor exclusivo do piloto, já exibindo sua frase de impacto e índice de assertividade histórica.*  
- **Painel Financeiro BAEFF1:**  
  > *BÔNUS INICIAL (MILESIMUS): +000.100 mls creditados na conta do estrategista.*  
  > *ESTADO: AGUARDANDO CLIQUE NO LINK DO E-MAIL.*  
  > *PRÓXIMA ETAPA: CENTRAL DE OPERAÇÕES // ESCOLHA DE EQUIPE (`/headquarters`).*

---

## 2. Guerra Fria dos Motores 2026: Manifesto dos Blocos
*Cenário:* Análise de inteligência das três forças motoras do grid.  
*Arquivo Fonte:* `src/utils/alliance-data.ts`, `src/app/lore/page.tsx`

### [BLOCO A] CONSÓRCIO DA ESTRELA
- **Motores:** Mercedes-AMG Power Unit
- **Garagens:** Mercedes, McLaren, Alpine, Williams
- **Lema Tático:** *“Confiabilidade de Aço & Domínio de Frota”*
- **Doutrina:** Quatro garagens trocando telemetria de alta densidade em tempo real. Cobrança por precisão germânica, consistência matemática e erro delta zero.

### [BLOCO B] A DINASTIA DE MARANELLO
- **Motores:** Ferrari 067/3 Hybrid E-Turbo
- **Garagens:** Ferrari, Haas, Cadillac
- **Lema Tático:** *“Potência de Pico & A Frente Americana”*
- **Doutrina:** A mística passional italiana aliada à agressividade do novo consórcio americano. Tolerância zero com o segundo lugar; vitória ou crise sob os olhos da imprensa global.

### [BLOCO C] A VANGUARDA
- **Motores:** Red Bull Powertrains-Ford, Honda HRC, Audi Turbo Hybrid
- **Garagens:** Red Bull Racing, Racing Bulls, Aston Martin, Audi
- **Lema Tático:** *“Ambição Extrema e Risco Tecnológico”*
- **Doutrina:** Fabricantes pioneiras e motores inéditos. O risco de falha mecânica é alto, mas quem domina o caos dita as regras do campeonato.

---

## 3. Despacho dos Chefes de Consórcio
*Momento:* Imediatamente após o jogador selecionar sua aliança de motores no onboarding.  
*Arquivo Fonte:* `src/utils/alliance-data.ts`, `src/app/lore/page.tsx`

- **Chefe do Consórcio da Estrela (Bloco A):**  
  > *“Escolha metódica. Você optou pela maior frota de motores da Alemanha. Quatro garagens trocando dados e confiabilidade de aço. Aqui a cobrança é por perfeição matemática nas previsões. Não me desaponte.”*

- **Chefe da Dinastia de Maranello (Bloco B):**  
  > *“Sangue quente. Você escolheu a paixão de Maranello e a agressividade da nova parceira americana. Aqui não existe desculpa para o segundo lugar: ou suas previsões nos colocam na frente ou a torcida te destrói.”*

- **Chefe da Vanguarda (Bloco C):**  
  > *“Adoro a ousadia. Você foi direto no terreno desconhecido da Ford, da Honda e da Audi. Motores inéditos trazem riscos brutais, mas é no caos que os maiores estrategistas da história constroem dinastias.”*

---

## 4. Homologação no Quartel-General (`/headquarters`)
*Cenário:* Despacho executivo de alocação de assentos na mureta de boxes.  
*Personagem:* **Agente de Contratos & Carreira**  
*Arquivo Fonte:* `src/app/headquarters/page.tsx`

- **Mensagem de Abertura:**  
  > *“Identificação confirmada. Seus canal de e-mail foi homologado na BAEFF1. Temos garagens oficiais com vagas abertas na nossa aliança dentro do seu grupo.”*
- **Exigências da Diretoria para a Temporada:**  
  > *“Antes de assinar, preste atenção no que a diretoria exige de você nesta temporada:*  
  > *1. MÁXIMA PRECISÃO NO FORMULÁRIO TOP 10 FINISH: Leitura cirúrgica de ritmo de corrida, desgaste de pneus e previsão de pitstops em cada GP fará diferença na sua trajetória;*  
  > *2. CLASSIFICAÇÃO DE ELITE NA COMPETIÇÃO MILESIMUS: Faça o máximo de pontos possíveis nos finais de semana de Grand Prix e traga MLS para a equipe;*  
  > *3. LIDERANÇA ABSOLUTA NO MUNDIAL DE MOTORES: Colocar nossa aliança técnica no topo do campeonato.”*
- **Despacho das Ofertas:**  
  > *“Duas propostas caíram na sua mesa. Assine com uma das garagens para desbloquear sua credencial no Pit Wall. A outra vaga será preenchida por um rival.”*

---

## 5. Hospitalidade Oficial: Os 11 Chefes de Equipe
*Cenário:* Reunião privada no Motorhome / Hospitality de cada escuderia.  
*Arquivo Fonte:* `src/lib/paddock-crew.ts`

### 1. Mercedes-AMG F1 — Toto Wolff (`T.WOLFF`)
- **Cargo:** Chefe de Equipe & Diretor Executivo
- **Perfil:** Cirúrgico, calculista, intransigente com falhas operacionais.
- **Hospitality Welcome:**  
  > *“Bem-vindo à nossa garagem. Aqui em Brackley nós não toleramos desculpas, toleramos dados. Se a sua telemetria for precisa, você terá o pit wall mais respeitado do grid.”*
- **Foco do Briefing:** Máxima precisão de ritmo de corrida e consistência matemática de paradas.

### 2. Scuderia Ferrari — Frédéric Vasseur (`F.VASSEUR`)
- **Cargo:** Diretor Geral & Chefe de Equipe
- **Perfil:** Pragmático, direto e com nervos de aço sob a pressão histórica de Maranello.
- **Hospitality Welcome:**  
  > *“Benvenuto a Maranello. Você agora representa a paixão de milhões de tifosi. Não procure inventar estratégias mirabolantes: faça o simples com perfeição cirúrgica.”*
- **Foco do Briefing:** Evitar armadilhas de tráfego e acertar o momento exato do pit stop.

### 3. McLaren F1 Team — Andrea Stella (`A.STELLA`)
- **Cargo:** Chefe de Equipe & Líder Técnico
- **Perfil:** Científico, humilde, focado na cultura de evolução contínua e velocidade bruta.
- **Hospitality Welcome:**  
  > *“Seja bem-vindo a Woking. Nosso monoposto é rápido, mas quem transforma aerodinâmica em troféu é o estrategista no pit wall. Confie na telemetria.”*
- **Foco do Briefing:** Gestão agressiva de pneus macios e extração da volta mais rápida.

### 4. Red Bull Racing — Christian Horner (`C.HORNER`)
- **Cargo:** Chief Executive & Team Principal
- **Perfil:** Combativo, agressivo nas apostas de pit stop e obstinado pela liderança mundial.
- **Hospitality Welcome:**  
  > *“Você está na garagem que não teme arriscar. Se tivermos que fazer três paradas para vencer, faremos. Seja ousado na mureta.”*
- **Foco do Briefing:** Undercuts rápidos e domínio absoluto dos duelos roda a roda.

### 5. Williams Racing — James Vowles (`J.VOWLES`)
- **Cargo:** Chefe de Equipe & Estrategista Executivo
- **Perfil:** Estrategista nato, pedagógico e mestre em extrair resultados com orçamentos enxutos.
- **Hospitality Welcome:**  
  > *“A Williams tem alma e história. Cada ponto conquistado aqui vale o dobro. Analise os gaps de pista com frieza e colheremos os frutos.”*
- **Foco do Briefing:** Apostas inteligentes de azarão e aproveitamento de falhas dos gigantes.

### 6. Aston Martin F1 — Mike Krack (`M.KRACK`)
- **Cargo:** Team Principal
- **Perfil:** Metódico, sereno e pressionado por resultados imediatos da diretoria verde.
- **Hospitality Welcome:**  
  > *“Nossa infraestrutura em Silverstone é de ponta. Esperamos de você uma leitura refinada de corrida para honrar esse investimento.”*
- **Foco do Briefing:** Equilíbrio térmico e ultrapassagens estratégicas no pelotão intermediário.

### 7. Alpine F1 Team — Oliver Oakes (`O.OAKES`)
- **Cargo:** Team Principal
- **Perfil:** Jovem, direto, avesso a desculpas corporativas e exigente com resultados rápidos.
- **Hospitality Welcome:**  
  > *“Esqueça a política, foque na pista. Quero ver você comandando a mureta com atitude e decisões firmes no rádio.”*
- **Foco do Briefing:** Overcuts oportunos e agressividade em pistas de alta aderência.

### 8. Haas F1 Team — Ayao Komatsu (`A.KOMATSU`)
- **Cargo:** Team Principal
- **Perfil:** Engenheiro puro-sangue, avesso a politicagem e focado em ritmo puro sem drama.
- **Hospitality Welcome:**  
  > *“Sem dramas aqui. Menos conversa e mais telemetria limpa. Se os números fizerem sentido, você terá todo o meu apoio.”*
- **Foco do Briefing:** Sobrevivência de pneus e aproveitar qualquer incidente na pista.

### 9. Audi F1 Project — Mattia Binotto (`M.BINOTTO`)
- **Cargo:** Chief Operating & Chief Technical Officer
- **Perfil:** Engenheiro cerebral, focado em processos alemães e precisão estrutural de longo prazo.
- **Hospitality Welcome:**  
  > *“Bem-vindo ao projeto mais ambicioso do automobilismo. A Audi exige padrões de precisão absoluta em cada setor.”*
- **Foco do Briefing:** Telemetria de trem de força e consistência volta a volta.

### 10. Cadillac F1 Team — Michael Andretti (`M.ANDRETTI`)
- **Cargo:** Team Principal & Racing Icon
- **Perfil:** Voz icônica de corridas americanas, sangue nos olhos e vontade imensa de vencer na F1.
- **Hospitality Welcome:**  
  > *“Entramos nessa categoria para brigar com os melhores do planeta. Mostre que o nosso pit wall tem coragem de vencer.”*
- **Foco do Briefing:** Agressividade na relargada e arrojo nas paradas com pneus novos.

### 11. Racing Bulls (RB) — Laurent Mekies (`L.MEKIES`)
- **Cargo:** Team Principal
- **Perfil:** Ágil, comunicativo e focado em formar e testar talentos no limite do grid.
- **Hospitality Welcome:**  
  > *“Nossa equipe é dinâmica e não tem medo de testar novidades. Se você tiver uma leitura diferente do pelotão, fale no rádio.”*
- **Foco do Briefing:** Velocidade de reação a bandeiras amarelas e duelos com equipes de ponta.

---

## 6. O Ciclo de 7 Dias da Race Week
*Arquivo Fonte:* `src/components/race-week-schedule.tsx`

### Dia 1 — Segunda-feira (Logística & Desembarque)
- **Voz:** Chefe de Equipe
- **Diálogo de Paddock:**  
  > *“Nossas cargas tocaram o solo do autódromo. A garagem está sendo montada. Comece alinhando os parâmetros do Grande Prêmio. A semana de GP é curta e cada erro de telemetria custa caro.”*
- **Alvo Tático:** Alinhamento com o Chefe de Equipe e introdução das características de downforce do traçado.
- **Boletim BAEFF1:** `BAEFF1-SYS // B101-INIT` — Sincronização de satélites e servidores locais. Abertura do Book de Mercados em modo pre-race.

### Dia 2 — Terça-feira (Pit Wall & Mecânica)
- **Voz:** Estrategista Sênior (Mentor)
- **Diálogo de Paddock:**  
  > *“O motor está no chassi. A fábrica está simulando janelas de degradação térmica para as retas do circuito. Acompanhe o clima previsto antes de definir os alvos de tempo.”*
- **Alvo Tático:** Estimular análise de clima e direção dos ventos para poletime e corrida.
- **Boletim BAEFF1:** `BAEFF1-SYS // B102-INFRA` — Validação de frequências de rádio e cotações MLS base.

### Dia 3 — Quarta-feira (Track Walk & Pneus Pirelli)
- **Voz:** Estrategista Sênior (Mentor)
- **Diálogo de Paddock:**  
  > *“Caminhamos pelo asfalto esta manhã. As zebras externas exigem cuidado com assoalho. Ajuste sua estimativa de desgaste e paradas de box no terminal.”*
- **Alvo Tático:** Fornecer dados técnicos de pista para refinar o Top 10 e Duelos H2H.
- **Boletim BAEFF1:** `BAEFF1-SYS // B103-COMPOUNDS` — Divulgação oficial dos compostos C1-C5 e zonas de DRS. Abertura das previsões de Poletime.

### Dia 4 — Quinta-feira (Media Day & Escrutínio Técnico)
- **Voz:** Estrategista Sênior (Mentor)
- **Diálogo de Paddock:**  
  > *“Monopostos aprovados na balança sem infrações. O alvo de Poletime projetado pela nossa equipe fica na faixa recomendada. Abra seu formulário e faça as primeiras marcações.”*
- **Alvo Tático:** Pressionar o estrategista a registrar seu Poletime antes dos treinos decisivos.
- **Boletim BAEFF1:** `BAEFF1-SYS // B104-SCRUTINEER` — Homologação dos monopostos. Contagem regressiva oficial.

### Dia 5 — Sexta-feira (Treinos Livres / Sprint Shootout)
- **Voz:** Estrategista Sênior (Mentor)
- **Diálogo de Paddock (Fim de semana Normal):**  
  > *“A telemetria do FP2 confirmou o ritmo das equipes líderes nos stints médios. Observe quem conserva os pneus dianteiros para definir o Top 10.”*
- **Diálogo de Paddock (Fim de semana Sprint):**  
  > *“Semana Sprint não perdoa hesitação: apenas 60 minutos de FP1 e entramos direto na disputa do grid Sprint. Olhe a velocidade máxima nos setores e crave seu palpite!”*
- **Alvo Tático:** Entregar o insider de ritmo real para guiar a seleção de Top 10 e Duelos H2H.
- **Boletim BAEFF1:** `BAEFF1-SYS // B105-PRACTICE` — Relatório de telemetria pós-treinos liberado. Alerta: Janela Poletime fecha no início do Q1.

### Dia 6 — Sábado (Classificação Oficial & Parque Fechado)
- **Voz:** Chefe de Equipe
- **Diálogo de Paddock:**  
  > *“O grid de largada está homologado e os carros entram em regime de Parque Fechado. A diretoria espera precisão total na montagem do Top 10 e nas apostas de duelo. Mostre seu valor no pit wall.”*
- **Alvo Tático:** Conectar resultado da classificação com o Poletime e preparar as previsões de domingo.
- **Boletim BAEFF1:** `BAEFF1-SYS // B106-GRID` — Fechamento definitivo do Poletime e abertura de Duelos e Volta Rápida.

### Dia 7 — Domingo (Dia do GP & Pós-Bandeirada)
- **Voz:** Chefe de Equipe
- **Diálogo de Paddock:**  
  > *“Bandeirada quadriculada no Grande Prêmio! As decisões de pit stop definiram o resultado. Acesse o extrato de Milesimus (MLS) no seu painel: os dividendos das posições homologadas já estão disponíveis.”*
- **Alvo Tático:** Debriefing da rodada, cálculo de dividendos MLS e atualização do ranking Master.
- **Boletim BAEFF1:** `BAEFF1-SYS // B107-RESULTS` — Auditoria das apostas, liquidação de dividendos MLS e atualização do ranking geral.

---

## 7. Monitor de Relações: Reações Dinâmicas Pós-Resultado
*Lógica Operacional:* O desempenho real do jogador na rodada altera o nível de moral perante o Chefe de Equipe (`src/lib/paddock-crew.ts`).

### Reações dos Chefes por Cenário:

#### A. Vitória / Pódio / Acerto Cravado no Poletime (Moral Alta ▲)
- **Toto Wolff (Mercedes):**  
  > *“Brilhante leitura de corrida! Seus números nos deram a vantagem exata que precisávamos. O consórcio da estrela reconhece seu valor.”*
- **Fred Vasseur (Ferrari):**  
  > *“Mamma mia! Essa é a Ferrari que o mundo quer ver! A mureta dos boxes esteve impecável hoje. Desfrute do pódio, você mereceu.”*
- **Andrea Stella (McLaren):**  
  > *“Ritmo espetacular! A correlação entre os seus cálculos e a pista foi perfeita. Essa vitória é sua tanto quanto dos nossos pilotos.”*
- **Christian Horner (Red Bull):**  
  > *“Simplesmente implacável! Você leu a janela de Safety Car com maestria. A Vanguarda está no topo onde pertence!”*

#### B. Desempenho Mediano / Dentro da Meta Esperada (Moral Estável ▬)
- **Toto Wolff (Mercedes):**  
  > *“Pontos importantes para o campeonato, mas deixamos tempo valioso no segundo stint. Quero ver os dados de degradação térmica antes do debriefing.”*
- **Fred Vasseur (Ferrari):**  
  > *“Um resultado razoável, mas a diretoria em Maranello quer troféus, não apenas estatísticas seguras. Vamos analisar as janelas de undercut perdidas.”*
- **Andrea Stella (McLaren):**  
  > *“Coletamos bons dados, mas nossa telemetria indicava que o segundo lugar era possível. Vamos revisar a tomada de decisão no rádio.”*
- **Christian Horner (Red Bull):**  
  > *“Não entramos na F1 para ser figurantes no pelotão intermediário. Ajuste os cálculos de desgaste para a próxima etapa.”*

#### C. Abaixo da Meta / Erro Crítico na Estratégia (Moral em Queda / Pressão ▼)
- **Toto Wolff (Mercedes):**  
  > *“Inaceitável. Nossa aliança técnica não constrói um motor deste calibre para perdermos posições por hesitação tática. Espero uma reação imediata no próximo GP.”*
- **Fred Vasseur (Ferrari):**  
  > *“A pressão dos tifosi vai ser impiedosa esta semana, e com razão. Nós erramos na leitura da pista. Não há espaço para outra corrida assim.”*
- **Andrea Stella (McLaren):**  
  > *“Ficamos presos no tráfego e queimamos borracha sem necessidade. Precisamos de respostas claras para a próxima rodada.”*
- **Christian Horner (Red Bull):**  
  > *“Um desastre estratégico. A diretoria austríaca já está pedindo explicações. Recupere esses pontos no próximo final de semana.”*

---

## 8. Sabedoria Tática dos Estrategistas Sêniores
*Personagens:* Veteranos calejados das décadas de 50 a 80 que pontuaram e subiram ao pódio na F1, mas nunca venceram um GP.  
*Arquivo Fonte:* `src/lib/race-directors.ts`

- **M. Amon (`M.AMON` — 96 GPs, 11 Pódios, 5 Poles):**  
  > *“Eu liderei Grandes Prêmios com 30 segundos de vantagem até o motor explodir a três voltas do fim. Conheço cada armadilha invisível deste asfalto. Ouça a telemetria antes de apostar.”*  
  *Especialidade:* Extração de aderência em voltas de qualificação e temperatura de pneus.

- **T. Warwick (`T.WARWICK` — 146 GPs, 4 Pódios, 2 Voltas Rápidas):**  
  > *“Bati roda contra os maiores campeões da era turbo com carros que quebravam todo domingo. Sei exatamente quem vai arriscar ultrapassagem quando os pneus começarem a escorregar.”*  
  *Especialidade:* Gestão de combustível e emboscadas táticas de pit stop.

- **A. de Cesaris (`A.DECESARIS` — 208 GPs, 5 Pódios, 1 Pole):**  
  > *“Agressividade é tudo, mas agressividade cega destrói sua suspensão na primeira zebra alta. Olhe o delta dos setores antes de cravar seu piloto no Top 3.”*  
  *Especialidade:* Leitura de duelos Head-to-Head e alvos de escalada (EVO).

---

## 9. Transmissões ao Vivo de Rádio no Pit Wall
*Arquivo Fonte:* `src/app/lore/page.tsx`, `src/app/[driver_slug]/page.tsx`

- **Engenheiro de Pista (Alerta de Chuva / Janela de Box):**  
  > *“Box, box! A previsão do delta indicou chuva em 3 voltas. Entrando agora estamos com ar limpo.”*
- **Engenheiro de Telemetria (Setor Roxo no Poletime):**  
  > *“Confirmação da FIA: seu piloto acabou de fechar o setor 2 no roxo. A pontuação de pole está subindo no quadro!”*
- **Estrategista de Tráfego (Undercut Confirmado):**  
  > *“Ele saiu dos boxes atrás de você! O undercut funcionou perfeitamente. Posição ganha na pista!”*
- **Conselheiro de Paddock (Final de Semana Sprint):**  
  > *“Parque Fechado trancado até amanhã de manhã. O acerto que você escolheu agora vai ter que aguentar a Sprint inteira. Sem choro na mureta.”*

---
*Este documento pode ser editado livremente para calibrar tons, criar novos diálogos de eventos especiais e expandir a mitologia corporativa do BAEFF1.*

# Guia de Estilo Narrativo & Tom de Voz — VoltGrid
## Estética: Cinemática Tática em Terminal Noir

Este documento estabelece a diretriz oficial de tom de voz, redação, narrativa e atmosfera visual para o **VoltGrid**. Todos os fluxos, interfaces, e-mails, comunicados de rádio e mensagens imersivas do projeto devem seguir rigorosamente estes pilares.

---

### 1. Pilares Narrativos Fundamentais

#### I. Narrativa *Noir* & Thriller de Bastidores (Intriga Política e Corporativa)
- **Tom Confidencial e Conspiratório:** O jogador nunca é tratado como um simples usuário preenchendo formulários web. Ele é um estrategista de elite convocado para uma sala fechada no fundo do motorhome ou na central de telemetria.
- **Linguagem Direta e Sem Eufemismos:** Frases curtas, cortantes, imperativas e com peso dramático. Sem jargões corporativos genéricos ou infantilização.
- **Exemplo de Tom:**
  > *"Puxe uma cadeira e feche a porta."*  
  > *"Os relatórios da sua telemetria caíram na minha mesa. Seus números são impressionantes."*

#### II. Terminal Tático / Retrofuturismo de Pitwall (CLI Cypherpunk)
- **Interface como Ferramenta Operacional:** A plataforma simula um terminal confidencial de telemetria e dados criptografados.
- **Prefixo de Linha de Comando:** Linhas de diálogo e blocos de dados utilizam os marcadores de prompt:
  - `>_` para comandos de sistema e diálogos do diretor.
  - `> -` para opções táticas selecionáveis, relatórios e parâmetros.
  - Cursor pulsante (`■` ou `_`) acompanhado por feedback auditivo analógico discreto (cliques mecânicos).
- **Tipografia:** Monospace (`font-mono`), com contrastes secos em preto puro (`#050401` / `bg-black/80`), acentos em âmbar/ouro telemétrico (`#fbaa19`), e detalhes em branco cirúrgico (`text-white`).

#### III. Épico Tecnológico / RPG de Facções ("Guerra Fria dos Motores")
- **As Alianças como Impérios Geopolíticos:** Fornecedores de motores e escuderias não são simples listas numéricas; são frentes de batalha com doutrinas e filosofias próprias:
  - **Bloco A (Consórcio da Estrela — Mercedes PU):** Precisão teutônica, engenharia metódica, confiabilidade implacável, cobrança por perfeição matemática.
  - **Bloco B (Dinastia de Maranello — Ferrari PU):** Paixão implacável, pressão extrema, potência bruta no limite, tolerância zero ao erro sob os olhos do mundo.
  - **Bloco C (A Vanguarda — Ford / Honda / Audi PU):** Ousadia, agressividade tecnológica, o caos como vetor de oportunidade, inovação radical.
- **Reconhecimento da Competência:** O texto valida a inteligência do estrategista (*"Você lê o traçado antes das luzes se apagarem"*), colocando o peso da vitória ou da derrota em suas decisões.

#### IV. Imersão em Primeira Pessoa (*In Media Res*)
- O texto dispensa saudações banais ("Bem-vindo ao Fantasy"). O usuário é jogado imediatamente dentro da ação e da tensão do paddock.
- Toda ação burocrática vira um ato narrativo:
  - Cadastro vira **Emissão da Superlicença**.
  - Escolha de equipe vira **Homologação de Contrato no Grid**.
  - Apostas viram **Telemetria de Pole Position (Poletime)** e **Duelos Táticos da Liga Master**.

---

### 2. Manual de Redação e Vocabulário

| Evitar (Linguagem Comum) | Preferir (Estilo VoltGrid Noir) |
| :--- | :--- |
| Criar conta / Registrar | Emitir Superlicença / Assinar Contrato |
| Escolha seu time | Requisite sua vaga no grid / Escolha sua aliança |
| Regras do jogo | Regulamento da FIA / Briefing Tático |
| Fazer aposta | Transmitir previsão de telemetria / Traçado do Q3 |
| Erro no formulário | Falha de transmissão / Dados inconsistentes |
| Pontos do Fantasy | Índice de Rendimento / XP de Temporada |

---

### 3. Padrão Visual dos Boxes e Componentes

Todos os contêineres de interação narrativa devem respeitar a estrutura:
```tsx
<div className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest hover:border-[#fbaa19] transition-all">
  <span className="opacity-50 mr-3 text-[#fbaa19]">&gt; -</span>
  ...
</div>
```
- Cores de destaque: Dourado Âmbar (`#fbaa19`), Branco puro (`#ffffff`), e cores oficiais das escuderias para dados técnicos.
- Nomes dos blocos/alianças sempre em **branco** com a insígnia entre colchetes em **âmbar** (`[BLOCO A]`).

---
*VoltGrid — Confidential Technical Telemetry Protocol*

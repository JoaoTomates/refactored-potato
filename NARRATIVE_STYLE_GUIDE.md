# Guia de Estilo Narrativo, Visual & Design System — BAEFF1
## Cinemática Tática em Terminal Noir: Cyberpunk, Pixel Art & Pregão Financeiro

Este documento é a diretriz canônica e definitiva de tom de voz, redação, direção de arte visual e padrões de interface para o **BAEFF1**. Todos os módulos, fluxos de onboarding, dashboards, tabelas de telemetria, relatórios e comunicações do sistema devem seguir rigorosamente este manual.

---

### 1. Pilares Narrativos Fundamentais

#### I. Narrativa *Noir* & Thriller de Bastidores (Intriga Política e Corporativa)
- **Tom Confidencial e Conspiratório:** O jogador nunca é tratado como um simples usuário preenchendo formulários web. Ele é um estrategista de elite convocado para uma sala fechada no fundo do motorhome ou na central de telemetria secreta.
- **Linguagem Direta e Sem Eufemismos:** Frases curtas, cortantes, imperativas e com peso dramático. Sem jargões corporativos genéricos ou infantilização.
- **Exemplo de Tom:**
  > *"Puxe uma cadeira e feche a porta."*  
  > *"Os relatórios da sua telemetria caíram na minha mesa. Seus números são impressionantes."*

#### II. Terminal Tático / Retrofuturismo de Pitwall (CLI Cypherpunk)
- **Interface como Ferramenta Operacional:** A plataforma simula um terminal confidencial de telemetria e dados criptografados.
- **Prefixos de Linha de Comando:**
  - `>_` para comandos de sistema, instruções operacionais e diálogos de diretores.
  - `> -` para opções táticas selecionáveis, relatórios e parâmetros.
  - Cursor pulsante analógico (`■` ou `_`) com som discreto de chave mecânica/relé.
- **Tipografia:** Estritamente Monospace (`font-mono`), garantindo alinhamento de colunas, números tabulares e atmosfera técnica de computação avançada dos anos 80/90.

#### III. Épico Tecnológico / RPG de Facções ("Guerra Fria dos Motores")
- **As Alianças como Impérios Geopolíticos:** Fornecedores de motores e escuderias não são simples listas numéricas; são frentes de batalha com doutrinas e filosofias próprias:
  - **Bloco A (Consórcio da Estrela — Mercedes PU):** Precisão teutônica, engenharia metódica, confiabilidade implacável, cobrança por perfeição matemática.
  - **Bloco B (Dinastia de Maranello — Ferrari PU):** Paixão implacável, pressão extrema, potência bruta no limite, tolerância zero ao erro sob os olhos do mundo.
  - **Bloco C (A Vanguarda — Ford / Honda / Audi PU):** Ousadia, agressividade tecnológica, o caos como vetor de oportunidade, inovação radical.

#### IV. Imersão em Primeira Pessoa (*In Media Res*)
- O usuário é jogado imediatamente dentro da ação e da tensão do paddock. Toda ação operacional possui significado dramático:
  - Cadastro vira **Emissão da Superlicença**.
  - Escolha de equipe vira **Homologação de Contrato no Grid**.
  - Apostas viram **Telemetria de Pole Position (Poletime)** e **Duelos Táticos da Liga Master**.

---

### 2. Direção de Arte Visual: Backgrounds em Pixel Art

O universo visual do BAEFF1 combina interfaces de dados de alta precisão com **cenários ricos em Pixel Art atmosférica (16-bit / 32-bit)**:

1. **Atmosfera dos Cenários:**
   - Centrais de telemetria noturnas iluminadas apenas pelo brilho de monitores CRT e telas âmbar.
   - Salas de reunião de chefes de equipe fechadas com vista panorâmica para o pitlane chuvoso.
   - Garagens e pitwalls analógicos repletos de cabos, transmissores de rádio, relés e instrumentos mecânicos.
2. **Propriedades Técnicas de Renderização:**
   - Imagens de fundo devem preservar a nitidez clássica de pixel art:
     ```css
     image-rendering: pixelated;
     ```
   - Uso de overlay de escurecimento translúcido sobre o background:
     ```tsx
     <img 
       src="/pixel_invite_bg_v2.jpg" 
       alt="" 
       className="fixed top-0 left-0 w-screen h-screen object-cover z-0 opacity-70 pointer-events-none"
       style={{ imageRendering: 'pixelated' }}
     />
     ```
   - Os cartões e caixas de dados devem repousar sobre o background com vidros escurecidos (`bg-black/80 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl`), criando profundidade e garantindo 100% de legibilidade de dados.

---

### 3. Paleta de Cores Oficial do Projeto (BAEFF1 Core Palette)

A identidade cromática equilibra a escuridão do paddock com acentos de telemetria analógica e cores oficiais do automobilismo:

#### Cores de Base & Identidade
| Nome | Hex | Uso Principal |
| :--- | :--- | :--- |
| **Black Void / Asfalto** | `#050401` / `#000000` | Background geral da aplicação, superfícies primárias. |
| **Terminal Gold / Âmbar** | `#fbaa19` | Cor assinatura BAEFF1, cursor `>_`, botões primários, colchetes `[BLOCO A]`, alertas táticos. |
| **Pure Surgical White** | `#ffffff` | Títulos principais de blocos, dados de telemetria, texto de alta ênfase. |
| **Console Dimmed** | `rgba(255,255,255,0.7)` | Subtítulos, descrições técnicas, dados secundários. |
| **Subtle Border** | `rgba(251,170,25,0.3)` / `rgba(255,255,255,0.15)` | Bordas finas de caixas de terminal e divisórias. |

#### Cores de Mercado & Indicadores de Performance
| Tipo | Hex | Aplicação |
| :--- | :--- | :--- |
| **Market Bull / Disponível** | `#10b981` (Verde Esmeralda) | Vagas abertas, alta de cotação (▲), lucros de rendimento, status operacional ativo. |
| **Market Bear / Esgotado** | `#ef4444` (Vermelho) | Vagas esgotadas, baixa de cotação (▼), penalidades, limites de motor estourados. |
| **Order Pending / Atenção** | `#f59e0b` (Âmbar Alerta) | Vagas em negociação, transferências sob análise da FIA. |

#### Paleta Oficial das Escuderias do Grid (Cores Homologadas)
- **Mercedes-AMG:** `#00D2BE`
- **Scuderia Ferrari:** `#DC0000`
- **McLaren:** `#FF8000`
- **Red Bull Racing:** `#3671C6`
- **Aston Martin:** `#229971`
- **Williams Racing:** `#005AFF`
- **Alpine:** `#FD4BC7`
- **Haas F1 Team:** `#E6002B`
- **Racing Bulls (RB):** `#6692FF`
- **Audi F1 Team:** `#F50537`
- **Cadillac F1:** `#FFC80C`

---

### 4. Componentes Estilo Bolsa de Valores (Stock Exchange & Financial Terminal)

O grid do BAEFF1 é tratado conceitualmente como um **pregão financeiro de velocidade e capital técnico (Wall Street / Bloomberg Terminal do Paddock)**. Equipes, motores, pilotos e contratos operam sob as convenções estéticas de mercados de capitais:

#### I. Painéis de Cotação & Livro de Ofertas (Order Book / Ticker Tape)
- **Letreiros Monospaçados Contínuos:** Tickers com código do ativo (`TICKER`), preço/cotação atual e variação percentual (Δ%).
  - Exemplo: `[MER $32.4M ▲ +2.4%] [FER $38.1M ▼ -1.1%] [RBR $35.0M ▲ +0.8%] [AST $21.2M ▬ 0.0%]`
- **Status de Pregão:** Cabeçalhos indicando estado da sessão:
  - `MARKET: OPEN` • `SESSION: LIVE Q3` • `SPREAD: 0.014s` • `ORDERS MATCHED: 22/22`

#### II. Tabelas Densas de Dados Financeiros (Bloomberg Style Tables)
- Tipografia monospace com números tabulares alinhados à direita (`tabular-nums text-right`).
- Cabeçalhos curtos em caixa alta com tracking amplo (`text-[10px] uppercase tracking-widest text-white/50`).
- Linhas compactas com divisórias sutis (`border-b border-white/5 hover:bg-white/[0.02]`).
- Estrutura de colunas típica:
  ```
  | ASSET | SPEC / DIVISÃO | POS / VAGAS | COTAÇÃO | VARIAÇÃO 24H | STATUS |
  | FER   | MARANELLO 067  | 0 / 2       | 38.2M   | +4.12% ▲     | [LOCKED] |
  | MER   | ESTRELA V6 HYB | 2 / 2       | 32.5M   | +1.08% ▲     | [OPEN]   |
  | AST   | VANGUARDA PU   | 1 / 2       | 21.0M   | -0.45% ▼     | [BIDDING]|
  ```

#### III. Ações & Botões de Execução Financeira
- Botões que remetem a ordens de compra e liquidação:
  - `[ COMPRAR CONTRATO ]` ou `[ REQUISITAR ORDEM DE PITWALL ]`.
  - `[ VER OFERTA ] »` (análise de prospecto e balanço antes da ordem).
  - `[ CONFIRMAR LIQUIDAÇÃO & ASSINAR ]`.

---

### 5. Manual de Redação e Vocabulário

| Evitar (Linguagem Comum) | Preferir (Estilo BAEFF1 Terminal / Stock Noir) |
| :--- | :--- |
| Criar conta / Registrar | Emitir Superlicença / Abrir Custódia de Piloto |
| Escolha seu time | Requisite sua vaga no grid / Escolha sua aliança |
| Regras do jogo | Regulamento da FIA / Briefing Tático Operacional |
| Fazer aposta | Transmitir previsão de telemetria / Ordem de Q3 |
| Erro no formulário | Falha de transmissão / Ordem rejeitada |
| Pontos do Fantasy | Rendimento de Portfólio / XP de Temporada |
| Ver detalhes | [ VER OFERTA ] / [ ANALISAR PROSPECTO ] |

---

### 6. Padrão Estrutural de Boxes e Contêineres

```tsx
<div className="w-full bg-black/80 p-5 md:p-8 backdrop-blur-sm border border-[#fbaa19]/30 rounded-lg shadow-2xl animate-fade-in text-white text-sm md:text-base font-bold tracking-widest hover:border-[#fbaa19] transition-all font-mono">
  <span className="opacity-50 mr-3 text-[#fbaa19] select-none">&gt; -</span>
  {/* Conteúdo com tipografia mono, badges em âmbar e dados em branco */}
</div>
```

---
*BAEFF1 Technical Telemetry & Market Protocol — Strictly Confidential*

# Roteiro de Implementação — Finance MVP

> SaaS de finanças pessoais leve, com foco em **rapidez de preenchimento** e **clareza visual**. Estética futurista, minimalista e luminosa.

---

## 1. Visão do produto

O objetivo é entregar uma ferramenta onde o usuário gaste **menos de 10 segundos** para registrar uma transação e consiga, em uma única tela, entender:

1. Quanto entrou e quanto saiu no mês.
2. Quanto sobrou (ou faltou).
3. Onde o dinheiro foi gasto e por qual gatilho emocional.

Princípios de produto:

- **Atrito zero no input.** Formulário em uma linha, atalhos de teclado, valores recentes sugeridos.
- **Leitura antes da escrita.** A primeira tela é o painel; o cadastro fica acessível a 1 clique/atalho.
- **Sem gráficos de pizza.** A leitura será feita por barras horizontais, linhas, áreas e indicadores numéricos grandes. Pizza/donut estão proibidos por decisão de design.
- **Mobile first em ergonomia, desktop first em densidade.** A entrada de dados precisa ser fácil pelo celular; relatórios podem ser densos no desktop.

---

## 2. Arquitetura atual e stack

A base do projeto já está montada. O roteiro abaixo respeita o que existe e indica onde evoluir.

| Camada | O que existe | Próximos passos |
|---|---|---|
| Backend | Django 5 + DRF, JWT (`simplejwt`), modelos `Category` e `Transaction` (com `emotional_trigger`), endpoints de relatório (`monthly-summary`, `expenses-by-category`, `needs-vs-wants`, `monthly-flow`, etc.). | Adicionar tipo de transação (entrada/saída), recorrência, metas, importação CSV, paginação e filtros consistentes. |
| Frontend | React 19 + Vite + TypeScript, MUI 7, Recharts, React Router 6, React Hook Form + Yup, Axios. | Implantar o design system futurista, reescrever a Home como painel único, criar o "Quick Add" e remover qualquer uso de `PieChart`. |
| Banco | SQLite em dev. | Migrar para Postgres em produção (libs já listadas). |
| Auth | JWT com refresh e blacklist. | Adicionar fluxo de redefinição de senha e e-mail de verificação na fase 2. |

---

## 3. Roadmap por fases

O projeto é dividido em quatro fases curtas. Cada fase é entregável por si só.

### Fase 0 — Fundamentos (1 a 2 dias)

Objetivo: padronizar o ambiente antes de mexer em produto.

- Reescrever `requirements.txt` em UTF-8 puro (o arquivo atual está em UTF-16, o que quebra builds em alguns ambientes).
- Adicionar `.env.example` e usar `python-decouple` para `SECRET_KEY`, `DEBUG`, `DATABASE_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`.
- Configurar scripts no `package.json` raiz para subir backend e frontend em paralelo (ex.: `concurrently`).
- Linter e formatter: `ruff` + `black` no backend, `eslint` + `prettier` no frontend.
- Pipeline mínimo de CI (GitHub Actions): rodar testes do Django e `tsc --noEmit` no frontend.

### Fase 1 — MVP utilizável (1 a 2 semanas)

Objetivo: o usuário consegue registrar transações e entender seu mês.

Backend:

- Adicionar campo `kind` em `Transaction` com valores `income` e `expense`. Migrar transações antigas como `expense` se positivas? Não — exigir o campo a partir da migração e popular conforme a regra do produto (sinal do valor ou novo formulário).
- Criar endpoint `/transactions/quick-add/` que aceita um payload mínimo: `{ kind, value, category_name, date? }`. Se a categoria não existir, criar. Default `date = hoje`.
- Endpoint `/dashboard/` consolidado que devolve em uma única chamada: saldo do mês, totais de entrada e saída, top 5 categorias de despesa, fluxo dos últimos 6 meses, últimas 5 transações. Reduz round-trips no frontend.
- Garantir filtros por intervalo de datas em todos os endpoints de relatório, com timezone do usuário.

Frontend:

- Layout base com sidebar fina à esquerda (ícones), topbar com seletor de mês e área principal em grid.
- **Quick Add** persistente: barra fixa no topo da tela principal, sempre visível, com 4 campos: tipo (toggle Entrada/Saída), valor, categoria (autocomplete que cria na hora), data (default = hoje, oculta atrás de "+"). Atalho de teclado `N` abre/foca o Quick Add.
- Tela "Painel" (Home):
  - Três cards numéricos grandes no topo: **Entradas**, **Saídas**, **Saldo**. Tipografia grande, sem gráfico.
  - Gráfico de **fluxo mensal** (linhas ou área) dos últimos 6 meses.
  - **Top categorias** como gráfico de barras horizontais (não pizza, não donut).
  - Lista enxuta das últimas transações, com edição inline.
- Tela "Transações": tabela com filtros por mês, categoria, tipo e gatilho emocional. Edição inline. Exclusão com confirmação leve (toast com "Desfazer").
- Tela "Categorias": criar, renomear e arquivar.
- Autenticação: telas de login e cadastro. Refresh automático de token via interceptor do Axios.

### Fase 2 — Inteligência leve (2 a 3 semanas)

Objetivo: o produto começa a "pensar" pelo usuário sem ser invasivo.

- **Recorrências:** transações que se repetem (mensal, semanal). Modelo `RecurringTransaction` que materializa lançamentos no banco.
- **Metas:** o usuário define um teto de gasto por categoria; uma barra mostra o consumido do mês.
- **Sugestão de categoria:** ao digitar a descrição, sugerir a categoria mais usada para descrições parecidas (matching simples por substring + frequência). Sem ML por enquanto.
- **Análise emocional:** página dedicada com barras horizontais por gatilho emocional + comparativo do mês anterior. Útil para o diferencial do produto e respeita a regra "sem pizza".
- **Importação CSV:** wizard de 3 passos (upload, mapear colunas, revisar e confirmar). Salva o mapeamento por banco para reaproveitar.

### Fase 3 — Pronto para vender (2 semanas)

Objetivo: virar SaaS de fato.

- Multiusuário já está garantido pelo `ForeignKey` para `User`. Falta: convites para "espaço compartilhado" (ex.: casal/família) com permissões básicas.
- **Planos e cobrança:** integração com Stripe ou Pagar.me. Plano Free com limite de transações/mês, plano Pro sem limite + recorrências + importação.
- E-mails transacionais (boas-vindas, recuperação de senha, resumo semanal opcional).
- LGPD: tela de exportar todos os dados (JSON/CSV) e excluir conta.
- Observabilidade: Sentry no front e back, logs estruturados.
- Deploy: backend em Render/Fly.io com Postgres gerenciado, frontend em Vercel/Netlify. Domínio + HTTPS.

---

## 4. Design system: "Aurora"

A identidade visual é futurista e leve. A referência é uma interface de cockpit minimalista: muito espaço em branco, contornos finos, tipografia geométrica e detalhes em um único acento vibrante.

### Paleta

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--bg-0` | `#F7F8FB` | `#0B0F14` | Fundo da página |
| `--bg-1` | `#FFFFFF` | `#10151C` | Cards e superfícies |
| `--bg-2` | `#EEF1F6` | `#161D26` | Hover, divisórias suaves |
| `--text-0` | `#0B1220` | `#E6EDF6` | Texto principal |
| `--text-1` | `#4A5568` | `#9AA6B2` | Texto secundário |
| `--accent` | `#5B8CFF` | `#7AA2FF` | Ações primárias, foco |
| `--accent-soft` | `#E5EDFF` | `#1B2A4A` | Fundo de destaque |
| `--positive` | `#2BB673` | `#3DD598` | Entradas |
| `--negative` | `#E5484D` | `#FF6B6B` | Saídas |
| `--warning` | `#E0A100` | `#F5C451` | Alertas de meta |
| `--border` | `#E5E9F0` | `#1F2733` | Bordas de 1px |

A paleta é deliberadamente curta. O acento é **um único azul-violeta**; todos os destaques importantes usam ele. Verde e vermelho aparecem **apenas** em valores monetários positivos/negativos.

### Tipografia

- Família principal: **Inter** ou **Geist** (variable).
- Família para números: **JetBrains Mono** ou **Inter Tabular** com `font-variant-numeric: tabular-nums`. Valores monetários sempre em fonte de números tabulares para alinhar colunas.
- Escala: `12 / 14 / 16 / 20 / 24 / 32 / 48`. Saldo principal usa 48 com peso 600.
- Letter-spacing levemente negativo (`-0.01em`) em títulos para reforçar o ar futurista.

### Forma e espaçamento

- Raio de borda: `12px` em cards, `8px` em inputs e botões, `999px` em chips.
- Sombras: muito suaves, com leve halo no acento em estados de foco. Evitar drop shadows pesadas — o "futurista leve" pede luz, não profundidade exagerada.
- Grid base de 8px. Padding mínimo de cards: 24px.
- Bordas finas de 1px com cor `--border`. Em vez de sombras, usar borda + sutil gradiente linear no topo do card (efeito "vidro fosco").

### Elementos característicos

- **Glassmorphism contido:** apenas o topbar e os cards de KPI usam `backdrop-filter: blur(12px)` com fundo `rgba(255,255,255,0.6)` no tema claro.
- **Gradiente de assinatura:** linha horizontal de 1px no topo dos cards principais com gradiente do `--accent` para transparente. Aparece só nos cards de KPI e no header.
- **Microanimações:** transições de 150ms `cubic-bezier(0.2, 0.8, 0.2, 1)`. Números animam por interpolação ao trocar de mês (efeito "contador" curto, 400ms).
- **Foco visível:** anel de foco de 2px em `--accent` com offset de 2px. Acessibilidade não é negociável.

### Visualização de dados (regras duras)

- **Permitido:** barras verticais, barras horizontais, linhas, áreas suaves, sparklines, indicadores numéricos grandes, "stacked bars" para composição.
- **Proibido:** gráfico de pizza, donut, semi-donut e qualquer variação radial. Onde a tentação for "mostrar proporção", usar **barra horizontal empilhada** ou **lista de barras horizontais com percentual ao lado**.
- Eixos discretos, sem grid pesado. Tooltip enxuto: rótulo + valor formatado em moeda local.
- Cores de série: variações do `--accent` em escala de luminosidade. Vermelho/verde **só** quando a leitura semântica é "perdeu/ganhou".

---

## 5. UX de preenchimento (o ponto que decide o produto)

A maior causa de abandono em apps de finanças é o tédio de digitar. As regras abaixo são tratadas como requisito, não como sugestão.

1. **Quick Add sempre acessível.** Barra fixa no topo do painel + atalho `N` em qualquer tela.
2. **Default agressivo:** data = hoje, tipo = "Saída" (caso de uso mais comum), categoria = última usada. O usuário só digita o valor se quiser registrar a despesa do café.
3. **Autocomplete inteligente em categorias:** mostra as 3 mais usadas no topo, depois alfabético. "Criar categoria 'X'" aparece como última opção quando não houver match.
4. **Entrada numérica amigável:** aceita `12,50`, `12.50` e `1250` (este último vira `12,50` se o usuário tiver ativado o modo "centavos automáticos"). Tecla Enter envia.
5. **Edição inline na tabela:** clicar no valor abre input no lugar; Esc cancela, Enter salva.
6. **Desfazer global:** toda exclusão mostra um toast "Desfazer" por 6 segundos antes de efetivar no banco.
7. **Atalhos:**
   - `N` — novo lançamento
   - `/` — focar busca
   - `G` depois `D` — ir para Painel; `G T` — Transações; `G R` — Relatórios
   - `[` / `]` — mês anterior/próximo
8. **Mobile:** Quick Add vira FAB (botão flutuante) que abre um bottom sheet com os mesmos quatro campos, em uma única coluna, com teclado numérico já aberto no campo de valor.
9. **Importar é opcional, nunca obrigatório.** O onboarding começa com uma transação de exemplo já lançada para o usuário não ver tela vazia.

---

## 6. Modelagem de dados (alvo)

Mudanças mínimas, mantendo retrocompatibilidade.

```text
User (Django padrão)

Category
  - user FK
  - name
  - archived bool (novo)
  - color slot (1..8) (novo, opcional — para destaque visual em barras)

Transaction
  - user FK
  - kind: 'income' | 'expense'  (novo, obrigatório)
  - value Decimal(10,2)  (sempre positivo; sinal vem do kind)
  - date
  - description
  - category FK (nullable)
  - emotional_trigger (já existe)
  - created_at, updated_at (novos)

RecurringTransaction (Fase 2)
  - mesmos campos de Transaction
  - frequency: 'monthly' | 'weekly'
  - day_of_month / day_of_week
  - start_date, end_date

Goal (Fase 2)
  - user FK
  - category FK
  - month (ano-mês)
  - amount_limit
```

Índices recomendados: `(user, date desc)` em `Transaction` e `(user, category)`.

---

## 7. Estrutura de pastas (frontend, alvo)

```
frontend/src/
  app/                  # providers, router, theme
  components/
    ui/                 # botão, input, card, chip — base do design system
    charts/             # BarsHorizontal, LineFlow, Sparkline (sem PieChart!)
    quick-add/          # QuickAddBar, QuickAddSheet (mobile)
  features/
    auth/
    dashboard/
    transactions/
    categories/
    reports/
    goals/              # fase 2
  api/                  # axios instance, hooks por recurso
  hooks/
  lib/                  # formatters (moeda, data), atalhos de teclado
  theme/                # tokens Aurora, MUI theme override
  types/
```

Regra: nada de import direto de `recharts/PieChart` em lugar nenhum. Adicionar regra de ESLint que proíbe.

---

## 8. Critérios de pronto por fase

Fase 1 está pronta quando:

- O onboarding leva o usuário do cadastro ao primeiro lançamento em menos de 60 segundos.
- O painel mostra entradas, saídas e saldo do mês corrente sem o usuário precisar configurar nada.
- O Quick Add registra uma transação em até 3 teclados (valor → Enter funciona com defaults).
- Nenhum gráfico de pizza/donut existe no código (`grep` no projeto não retorna `PieChart`).

Fase 2 está pronta quando:

- Recorrências geram lançamentos automaticamente no início de cada período.
- Metas mostram barra de consumo no painel e disparam um aviso quando passa de 80%.
- Importação CSV funciona para extrato de pelo menos 2 bancos brasileiros (Nubank e Itaú são bons alvos).

Fase 3 está pronta quando:

- Existe plano gratuito e pago com cobrança recorrente real.
- O usuário consegue exportar e excluir todos os seus dados pela interface.
- O produto roda em domínio próprio com HTTPS, monitoramento e backups diários do Postgres.

---

## 9. Próximos passos imediatos

1. Corrigir o `requirements.txt` (encoding) e isolar segredos em `.env`.
2. Criar a migração que adiciona `kind` em `Transaction` e o endpoint `/dashboard/`.
3. Implantar os tokens do design system Aurora no `theme/theme.ts` (cores, tipografia, raios, sombras).
4. Substituir a Home atual pelo painel novo com Quick Add fixo, três cards de KPI e gráfico de fluxo (linha) + barras horizontais de top categorias.
5. Adicionar a regra de ESLint que bloqueia `PieChart` e variantes.

A partir desses cinco passos, o produto já entrega uma experiência coerente com a visão deste roteiro.

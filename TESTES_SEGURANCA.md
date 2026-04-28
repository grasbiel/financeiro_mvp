# Guia de Testes de Segurança — Finance MVP

> Este documento define o que precisa ser testado, com qual ferramenta, com qual frequência e qual o critério de aprovação. O escopo cobre **segurança do código** (SAST, dependências, segredos, padrões de codificação) e **segurança dos dados pessoais do usuário** (LGPD, criptografia, controle de acesso, retenção).
>
> Contexto: Django 5 + DRF, JWT, Postgres, frontend React/Vite. O produto manipula dados financeiros e gatilhos emocionais — informação sensível pela LGPD (art. 5º, II).

---

## 1. Princípios

1. **Defesa em profundidade.** Nenhuma camada é suficiente sozinha; cada teste valida uma camada distinta.
2. **Shift-left.** A maioria dos testes roda no CI antes do merge; pentest é a última linha, não a primeira.
3. **Reprodutibilidade.** Todo achado vira caso de teste automatizado para não regredir.
4. **Privacidade por padrão.** Se um dado pessoal não é necessário para a função, ele não é coletado nem retido.
5. **Quebrar o build é melhor do que vazar dado.** Achados críticos devem falhar o pipeline.

---

## 2. Classificação dos dados manipulados

Antes dos testes, é preciso saber o que está sendo protegido.

| Categoria | Exemplos no app | Sensibilidade | Regras LGPD |
|---|---|---|---|
| Identificação direta | `username`, `email` | Alta | Base legal: execução de contrato. |
| Credenciais | senha (hash), tokens JWT, refresh tokens | Crítica | Nunca logar, nunca expor em respostas. |
| Financeiros | `value`, `date`, `description` em `Transaction` | Alta | Tratar como dado sensível por contexto. |
| Comportamentais | `emotional_trigger` | **Sensível pela LGPD** (revela estado emocional, hábitos de consumo) | Base legal exige consentimento explícito; minimizar uso em logs. |
| Categorização do usuário | `Category.name` | Média | Pode revelar hábitos. |
| Telemetria | logs, métricas, IP, user-agent | Média | Anonimizar IP após 30 dias; não correlacionar a usuário sem motivo. |

A coluna "Sensibilidade" determina a severidade dos achados que envolvem cada tipo de dado.

---

## 3. Matriz de testes (visão geral)

| Frente | Quando roda | Ferramentas | Falha o build? |
|---|---|---|---|
| SAST (código) | Cada PR | Bandit, Semgrep, ESLint security plugins | Sim, em severidade alta |
| Dependências | Cada PR + diariamente | `pip-audit`, `npm audit`, Dependabot, Snyk | Sim, em vulnerabilidade crítica |
| Segredos | Cada commit (pre-commit) e CI | `gitleaks`, `trufflehog` | Sim |
| Cobertura de auth/authz | Cada PR | pytest + DRF test client | Sim |
| Headers e config Django | Cada PR | `python manage.py check --deploy` | Sim em produção |
| DAST | Pré-release | OWASP ZAP baseline | Sim para críticos |
| Pentest manual | Antes de cada release maior | Checklist abaixo | Releases bloqueados se houver crítico em aberto |
| Revisão LGPD | Trimestral | Checklist do §10 | Não bloqueia build, bloqueia release |
| Backup/restore | Mensal | Procedimento documentado | Não automatizado |

---

## 4. Segurança do código

### 4.1 SAST — análise estática

**Backend (Python/Django).**

- `bandit -r finance_mvp/ -ll` — detecta `eval`, `pickle.loads`, `subprocess` com `shell=True`, uso de `random` para criptografia, hardcoded passwords. Critério: zero achados de severidade `HIGH`.
- `semgrep --config=p/django --config=p/owasp-top-ten` — captura padrões de SQLi, deserialização insegura, XSS em templates, uso de `mark_safe`, `RawSQL` sem parametrização.
- `ruff` com regras `S` (segurança) habilitadas.

**Frontend (TS/React).**

- `eslint-plugin-security`, `eslint-plugin-no-unsanitized` — proíbem `dangerouslySetInnerHTML` sem sanitização, `eval`, `new Function`, `innerHTML` direto.
- TypeScript em modo `strict` evita uma classe inteira de bugs (ex.: `null` em campos de valor financeiro).
- Regra customizada que proíbe importar `PieChart` (já prevista no roteiro — manter).

**Critério de aprovação:** zero erros `HIGH`/`CRITICAL`. Avisos `MEDIUM` viram issues e devem ser endereçados em até 30 dias.

### 4.2 Dependências (SCA)

- Backend: `pip-audit -r finance_mvp/requirements.txt` no CI. `safety check` como segundo opinador.
- Frontend: `npm audit --audit-level=high` no CI. Renovate ou Dependabot ativos para PRs automáticos de upgrade.
- Política: dependência abandonada (último release há > 24 meses) entra em lista de substituição.
- **Atenção:** `requirements.txt` atual está em UTF-16; isso quebra `pip-audit`. Reescrever em UTF-8 é pré-requisito para o pipeline funcionar.

### 4.3 Segredos no repositório

- Hook de pre-commit com `gitleaks` ou `trufflehog`.
- Varredura completa do histórico antes do primeiro deploy público (`gitleaks detect --log-opts="--all"`).
- Nenhum `SECRET_KEY`, `JWT_SIGNING_KEY`, credencial de banco, chave de API ou token de pagamento no código. Tudo via `.env` + `python-decouple`, com `.env.example` documentando os nomes.
- Se um segredo já vazou: rotacionar imediatamente, não basta remover do histórico.

### 4.4 Configuração do Django

Rodar regularmente:

```bash
python manage.py check --deploy
```

Lista de itens que **devem** estar verdadeiros em produção:

- `DEBUG = False`.
- `ALLOWED_HOSTS` restrito ao domínio real.
- `SECURE_SSL_REDIRECT = True`.
- `SESSION_COOKIE_SECURE = True`, `CSRF_COOKIE_SECURE = True`.
- `SECURE_HSTS_SECONDS >= 31536000`, `SECURE_HSTS_INCLUDE_SUBDOMAINS = True`, `SECURE_HSTS_PRELOAD = True` (após validar HSTS).
- `SECURE_REFERRER_POLICY = "same-origin"`.
- `SECURE_CONTENT_TYPE_NOSNIFF = True`, `SECURE_BROWSER_XSS_FILTER` (legado, mas inofensivo).
- `X_FRAME_OPTIONS = "DENY"`.
- `CORS_ALLOWED_ORIGINS` com lista explícita; `CORS_ALLOW_ALL_ORIGINS` deve ser `False`.
- `CSRF_TRUSTED_ORIGINS` com o domínio do frontend.

### 4.5 Headers HTTP no frontend e CDN

Validar com `curl -I` e com [securityheaders.com](https://securityheaders.com):

- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` restritivo: `default-src 'self'`, sem `unsafe-inline` em scripts, com nonce se necessário.
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` desativando câmera, microfone, geolocalização, etc.

---

## 5. Autenticação e autorização

### 5.1 Casos de teste obrigatórios (pytest + DRF)

Cada item abaixo é um teste automatizado:

- Cadastro com senha curta (< 8 caracteres) é rejeitado.
- Cadastro com senha em lista de senhas vazadas (`have-i-been-pwned` k-anonymity API) é rejeitado.
- Login retorna 401 sem revelar se o e-mail existe ("E-mail ou senha inválidos", nunca "usuário não encontrado").
- Token JWT expirado é rejeitado em rota protegida.
- Token JWT com assinatura inválida é rejeitado.
- Refresh token reutilizado após rotação é invalidado (rotação + blacklist).
- Logout coloca o refresh token na blacklist.
- Rate limiting em `/token/` e `/users/` (cadastro): mais de N tentativas falhas/minuto retornam 429. Recomendado: `django-ratelimit` ou `django-axes`.
- **IDOR:** `GET /transactions/{id}/` de transação que pertence a outro usuário retorna 404 (não 403, para não vazar existência).
- **IDOR em update/delete:** mesmo critério.
- **Mass assignment:** tentar enviar `user` no payload de `POST /transactions/` não troca o dono — o backend ignora e usa `request.user`.
- Tentativa de criar `Category` informando `user_id` de outra pessoa é ignorada.

### 5.2 Política de senhas

- Hash com Argon2 (Django suporta nativamente — adicionar `django.contrib.auth.hashers.Argon2PasswordHasher` como primeiro hasher).
- Validadores nativos do Django: `MinimumLengthValidator`, `CommonPasswordValidator`, `NumericPasswordValidator`, `UserAttributeSimilarityValidator`.
- Bloqueio progressivo de tentativas (django-axes): bloqueio temporário após 5 falhas, com cooldown exponencial.
- Reset de senha por e-mail com token de uso único, expiração de 1h, e que invalida sessões ativas.

### 5.3 JWT — armadilhas a verificar

- Algoritmo fixo (`HS256` ou `RS256`); rejeitar `none`.
- Tempo de vida curto do access token (15 min); refresh token com 7 a 14 dias.
- Refresh token rotativo + blacklist habilitada (`SIMPLE_JWT["ROTATE_REFRESH_TOKENS"] = True`, `"BLACKLIST_AFTER_ROTATION": True`).
- Tokens **não** vão para `localStorage`. Preferir `httpOnly Secure SameSite=Strict` cookie para o refresh token, e access token em memória (variável JS, perdida no reload — refresh re-emite).
- Caso o app continue com tokens em `localStorage`, documentar o trade-off e mitigar com CSP rígido.

---

## 6. Validação de entrada e injeção

### 6.1 SQL Injection

- Confirmar que **nenhum** lugar usa `Transaction.objects.raw(...)` ou `cursor.execute(...)` com interpolação de string.
- Onde houver `RawSQL`, parametrizar com placeholders (`%s`).
- Teste automatizado: enviar payloads `' OR 1=1 --`, `\\`, `%27` em filtros e descrições; resposta esperada é 200 com resultado vazio ou 400, **nunca** 500 com stacktrace de SQL.

### 6.2 XSS

- React escapa por padrão; o risco mora em `dangerouslySetInnerHTML`. Regra de ESLint que bloqueia.
- Conteúdo do campo `description` da transação: nunca renderizar como HTML, sempre como texto.
- Backend: rejeitar payloads com tags HTML em `description`, `category.name`, `username` — ou armazenar e escapar na renderização. Escolher uma estratégia e testar.
- Teste automatizado: cadastrar transação com `<img src=x onerror=alert(1)>` na descrição; abrir a tela e confirmar que aparece como texto literal.

### 6.3 CSRF

- Rotas DRF com JWT não são vulneráveis a CSRF clássico (token vai no header `Authorization`, não em cookie).
- Se algum dia migrar refresh para cookie, `CsrfViewMiddleware` precisa estar ativo e o frontend tem que enviar `X-CSRFToken`.
- Teste: requisição cross-site não autenticada para `POST /transactions/` deve retornar 401.

### 6.4 SSRF, deserialização, path traversal

- SSRF: app atual não faz fetch externo a partir de input do usuário. **Quando** for adicionar import por URL (Fase 2), validar contra allowlist de domínios e bloquear ranges privados (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16).
- Deserialização: nunca usar `pickle` em dados externos. Usar JSON.
- Path traversal: import de CSV deve gerar nome aleatório no servidor (UUID), nunca usar o nome enviado pelo usuário como caminho de arquivo.

### 6.5 Upload de arquivos (CSV — Fase 2)

- Tamanho máximo (ex.: 5 MB).
- Tipo MIME validado por conteúdo, não pela extensão.
- Quantidade de linhas com limite (ex.: 10.000) para evitar DoS.
- Decodificação segura (forçar UTF-8 com `errors="replace"`; rejeitar encoding declarado).
- Sem execução de fórmulas — a planilha não é interpretada como Excel; é só CSV.

---

## 7. Segurança de API

- **Rate limiting** global (ex.: 60 req/min por IP) e específico em `/token/` (5 req/min). Usar `django-ratelimit`.
- **Paginação obrigatória** em endpoints de listagem; sem paginação um usuário com muitos lançamentos derruba o servidor.
- **Mass assignment guard:** todos os serializers devem listar `fields` explicitamente — nunca usar `fields = "__all__"` em produção.
- **IDOR de novo:** todo `ViewSet` precisa filtrar `get_queryset()` por `request.user`. Teste automatizado roda contra todos os viewsets.
- **CORS** com origens explícitas. Sem `*`.
- **Erros não vazam detalhes:** em produção, `DEBUG=False` faz isso por padrão; testar via response 500 forçada (ex.: dividir por zero numa view de teste em staging).
- **Versionamento:** prefixar rotas (`/api/v1/`) para permitir descontinuar endpoints sem quebrar clientes.

---

## 8. Proteção dos dados em repouso e em trânsito

### 8.1 Em trânsito

- TLS 1.2+ obrigatório. Redirect 80→443.
- HSTS preload (após validar).
- Certificado renovado automaticamente (Let's Encrypt + cert-manager ou serviço gerenciado).
- Postgres atrás de TLS interno se hospedado fora da mesma rede privada.

### 8.2 Em repouso

- Postgres com criptografia de disco no provedor (Render/Fly/AWS RDS já oferecem).
- Backups criptografados (verificar configuração do provedor).
- Senha do banco com tamanho ≥ 32 caracteres aleatórios.
- Campo `description` e `emotional_trigger` **não** precisam de criptografia em coluna nesta fase, mas precisam ser tratados como sensíveis em logs e exports (ver §10).
- Quando crescer: avaliar criptografia de coluna para `description` com `django-cryptography` ou `django-encrypted-model-fields`. Trade-off: perde busca textual nessas colunas.

### 8.3 Logs

- Nunca logar: senha, token, refresh token, valor de transação, descrição, e-mail completo (mascarar: `g***@gmail.com`).
- Logs estruturados (JSON) com level apropriado.
- Retenção: 30 dias para logs gerais, 1 ano para logs de auditoria de autenticação (legal).
- Teste automatizado: capturar handler de log durante um login e confirmar que a senha **não** aparece.

---

## 9. Auditoria e detecção

- **Trilha de auditoria** para eventos críticos: login bem-sucedido, login falho, troca de senha, exclusão de conta, exportação de dados, alteração de e-mail. Modelo `AuditLog` com `user`, `event`, `ip`, `user_agent`, `timestamp`, `metadata` (JSON).
- **Sentry** para erros 500. Configurar `before_send` para escrubar dados pessoais.
- **Alertas:** pico de 401/403, pico de 5xx, falhas de login concentradas em um IP.
- **Backup e restore:** teste mensal de restauração em ambiente isolado. Backup que não restaura não é backup.

---

## 10. LGPD — testes específicos

A LGPD trata o usuário como titular de direitos. Cada direito vira um teste.

### 10.1 Direitos do titular (art. 18) — testar em staging trimestralmente

- **Acesso e portabilidade:** o usuário consegue baixar todos os seus dados em formato legível (JSON e CSV). Endpoint `GET /me/export/` ou tela "Meus dados". Tempo de resposta razoável; pode ser assíncrono com e-mail de confirmação.
- **Correção:** usuário consegue editar e-mail, nome, e qualquer transação própria.
- **Eliminação:** ao excluir conta, todos os dados pessoais são apagados ou anonimizados em até X dias. Validar que `User`, `Transaction`, `Category`, `AuditLog` (anonimizado), `RecurringTransaction` foram tratados.
- **Anonimização vs. exclusão:** logs de auditoria podem ser mantidos por obrigação legal, desde que o `user_id` vire `NULL` e não haja como reidentificar.
- **Revogação de consentimento:** se for adicionado consentimento para uso do `emotional_trigger` em análises agregadas, precisa ter chave para revogar e parar o uso a partir daí.

### 10.2 Bases legais e consentimento

- Mapear cada coleta para uma base legal: execução de contrato (transações, conta), legítimo interesse (logs de segurança), consentimento (analytics, marketing, gatilho emocional).
- Termos de uso e política de privacidade visíveis no cadastro, com versão e timestamp registrados por usuário.
- Cookies não essenciais só após opt-in.

### 10.3 Minimização

- Toda nova feature passa por revisão: "qual dado novo está sendo coletado e por quê?". Se o motivo for "talvez sirva no futuro", não coleta.
- Campos opcionais permanecem opcionais. `emotional_trigger` nunca é obrigatório.

### 10.4 Compartilhamento e subprocessadores

- Listar subprocessadores (provedor de hospedagem, e-mail transacional, pagamento, observabilidade) na política de privacidade.
- Cada um precisa ter cláusula contratual de tratamento e estar em jurisdição compatível.

### 10.5 Incidentes

- Procedimento de resposta documentado: detecção, contenção, avaliação de risco, comunicação à ANPD em 2 dias úteis se houver risco relevante, comunicação ao titular.
- Lista de contatos (DPO, jurídico, dev oncall) atualizada.

---

## 11. DAST e pentest

### 11.1 DAST automatizado

- **OWASP ZAP** em modo baseline rodando em staging a cada release. Comando referência:

  ```bash
  zap-baseline.py -t https://staging.financemvp.app -r zap-report.html
  ```

- Falhar pipeline em achados `High`. `Medium` viram issues.

### 11.2 Pentest manual

Antes de cada release maior. Pode ser interno usando o checklist abaixo, ou contratado.

Checklist mínimo (baseado em OWASP ASVS L2):

- Autenticação e gestão de sessão.
- Controle de acesso (vertical e horizontal/IDOR).
- Validação e codificação de entrada.
- Criptografia em trânsito e em repouso.
- Tratamento de erros e logging.
- Configuração de servidor e headers.
- API REST (rate limiting, mass assignment, BOLA — Broken Object Level Authorization).

Cada achado **crítico** ou **alto** bloqueia o release.

### 11.3 Testes específicos do produto

Cenários que valem ser exercitados manualmente:

- Criar dois usuários A e B; tentar via Postman acessar e modificar transações de B logado como A. Tentar com IDs sequenciais e UUIDs falsos.
- Cadastrar transação com valor `-1`, `0`, `99999999.99`, `1e308`, string. Backend rejeita ou normaliza?
- Trocar `kind` de uma transação alheia via PATCH.
- Importar CSV com 10 milhões de linhas. App degrada graciosamente (limite + erro 413) ou trava?
- Logar, copiar o access token, esperar a expiração, tentar usar — deve falhar com 401 limpo.
- Pedir reset de senha; confirmar que o e-mail não confirma a existência da conta para alguém de fora.

---

## 12. Pipeline de CI sugerido

Estrutura mínima para um workflow do GitHub Actions:

```text
on: [pull_request, push]

jobs:
  backend-security:
    - pip install -r requirements.txt
    - bandit -r finance_mvp/ -ll
    - pip-audit -r finance_mvp/requirements.txt
    - semgrep --config=p/django --config=p/owasp-top-ten
    - python manage.py check --deploy --fail-level WARNING
    - pytest -m security

  frontend-security:
    - npm ci
    - npm audit --audit-level=high
    - npm run lint -- --max-warnings=0

  secrets:
    - gitleaks detect --redact

  dast:
    if: branch == main
    - deploy to staging
    - zap-baseline.py -t $STAGING_URL
```

Marcadores `pytest -m security` agrupam os testes de IDOR, mass assignment, rate limiting e CSRF para serem rodados em conjunto e relatórios separados.

---

## 13. Cadência

| Atividade | Frequência |
|---|---|
| SAST + SCA + secrets + lint | Cada commit/PR |
| `manage.py check --deploy` | Cada PR para `main` |
| DAST baseline | Cada release |
| Restauração de backup em ambiente isolado | Mensal |
| Revisão de dependências abandonadas | Mensal |
| Revisão LGPD (DPIA leve) | Trimestral |
| Pentest manual | A cada release maior ou semestral |
| Rotação de segredos (chaves JWT, senha de banco) | Semestral, ou após incidente |

---

## 14. Critérios de "pronto para produção"

Um release só vai a produção quando:

1. Pipeline de segurança passa sem achados `HIGH`/`CRITICAL` em aberto.
2. `python manage.py check --deploy` retorna 0 issues.
3. ZAP baseline em staging não tem `High`.
4. Política de privacidade e termos publicados, com versionamento.
5. Backups testados nos últimos 30 dias.
6. Procedimento de resposta a incidente acessível ao oncall.
7. Tela de exportar e excluir conta funcional.

Se algum item não estiver cumprido, o release fica bloqueado. É mais barato adiar do que comunicar incidente.

---

## 15. Próximos passos imediatos

1. Corrigir o encoding do `requirements.txt` (UTF-8) — sem isso, nenhuma ferramenta de SCA funciona.
2. Adicionar `bandit`, `pip-audit`, `gitleaks` e `semgrep` ao CI.
3. Configurar Argon2 e validadores de senha no `settings.py`.
4. Habilitar `ROTATE_REFRESH_TOKENS` e `BLACKLIST_AFTER_ROTATION` no SimpleJWT.
5. Implementar `django-ratelimit` em `/token/` e `/users/` (cadastro).
6. Escrever os testes pytest do §5.1 e marcar como `@pytest.mark.security`.
7. Mover `SECRET_KEY` e `DATABASE_URL` para `.env`, criar `.env.example`.
8. Implementar `AuditLog` para os eventos críticos do §9.
9. Esboçar a tela "Meus dados" (export + exclusão) — virou item do roteiro principal de produto.

Esses nove passos fecham o gap entre "tem segurança implícita" e "tem segurança verificável".

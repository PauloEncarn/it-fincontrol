# Arquitetura Tecnica

## Estrutura Geral

```text
src/
  app/
    api/                  # rotas Next que reexportam backend/api
    page.js               # shell principal da aplicacao
  backend/
    api/                  # implementacao das APIs
    utils/                # auditoria, templates e utilitarios
  frontend/
    components/
      layout/             # Header e Sidebar
      modals/             # modais de lancamento e solicitacao
      ui/                 # componentes compartilhados
      views/              # telas principais
    theme/                # tema visual
    utils/                # constantes
supabase/
  migrations/             # migrations SQL
tests/
  unit/                   # testes unitarios Node
  auditoria.spec.js       # smoke/e2e Playwright
```

## Frontend

O frontend e centrado em `src/app/page.js`, que controla:

- autenticacao local por token
- view ativa
- filtros globais
- queries React Query
- mutations
- modais
- callbacks compartilhados

As telas principais ficam em:

- `NotasView.js`
- `ContratosView.js`
- `DashboardView.js`
- `SolicitacoesView.js`
- `FiliaisView.js`
- `FornecedoresView.js`
- `UsuariosView.js`

## React Query

O projeto usa React Query para cache e sincronizacao.

Queries principais:

- `filiais`
- `fornecedores`
- `usuarios`
- `notas_operacional`
- `dashboard_full`
- `notificacoes`
- `contratos`
- `contrato_lancamentos`
- `busca`
- `solicitacoes`

Pontos de performance:

- Dados estaticos possuem `staleTime`.
- Notas operacionais nao refazem fetch em foco de janela.
- Edicao inline usa PATCH especifico.
- Cache de notas e atualizado localmente por `mergeNotaCache`.
- Solicitacoes so carregam nas telas que precisam.

## Backend

As rotas reais ficam em `src/backend/api`.

As rotas em `src/app/api` normalmente apenas reexportam os handlers do backend. Exemplo:

```js
export * from '@/backend/api/lancamentos/[id]/campo/route';
```

Essa separacao ajuda a manter a implementacao da API fora da pasta de roteamento do Next.

## Auditoria

Eventos de lancamentos sao registrados em `lancamento_eventos`.

O utilitario principal fica em:

```text
src/backend/utils/audit.js
```

Eventos comuns:

- `criacao`
- `edicao`
- `edicao_inline`
- `status`
- `email`
- `feedback_email`

## Upload

Uploads passam pela rota:

```text
POST /api/upload
```

Destino no Supabase Storage:

```text
notas-e-boletos
```

## Emails e Feedback

Envio:

```text
POST /api/enviar-email
```

Feedback:

```text
GET /api/feedback?token=...
```

Links de feedback dependem de `JWT_SECRET` e `APP_URL`.

## Jobs

Rotas de cron:

- `GET /api/cron/gerar-notas-recorrentes`
- `GET /api/cron/notificar-pendencias`
- `GET /api/cron/keep-alive`

A geracao recorrente usa:

```text
src/backend/api/contratos/geracao-recorrente.js
```

## Padroes Importantes

- Validacoes de lancamento ficam em helpers compartilhados.
- Nao duplicar normalizacao de numero de NF ou valor monetario.
- Regras de boleto compartilhado ficam em helper testavel.
- Para edicao inline, preferir `PATCH /api/lancamentos/:id/campo`.
- Para mudanca de etapa/status, usar `PATCH /api/lancamentos/:id/status`.

# API e Rotas

As APIs ficam em `src/backend/api` e sao expostas por `src/app/api`.

## Autenticacao

Login/token:

```text
POST /api/token
```

Usuarios:

```text
GET  /api/usuarios
POST /api/usuarios
PUT  /api/usuarios/:id
DELETE /api/usuarios/:id
```

## Filiais

```text
GET    /api/filiais
POST   /api/filiais
PUT    /api/filiais/:id
DELETE /api/filiais/:id
```

## Fornecedores

```text
GET    /api/fornecedores
POST   /api/fornecedores
PUT    /api/fornecedores/:id
DELETE /api/fornecedores/:id
```

Fornecedores possuem listas de opcoes que validam contratos:

- CNPJs
- contratos
- centros de custo
- servicos
- produtos Protheus

## Lancamentos / Notas

Listar e criar:

```text
GET  /api/lancamentos
POST /api/lancamentos
```

Editar/excluir:

```text
PUT    /api/lancamentos/:id
DELETE /api/lancamentos/:id
```

Edicao inline de campo especifico:

```text
PATCH /api/lancamentos/:id/campo
```

Payload:

```json
{
  "field": "numero_nota",
  "value": "18"
}
```

Campos permitidos para edicao inline ficam em:

```text
src/backend/api/lancamentos/helpers.js
```

Mudanca de status/etapa:

```text
PATCH /api/lancamentos/:id/status
```

Payload:

```json
{
  "status": "Em Andamento",
  "etapa": "em_andamento"
}
```

Linha do tempo:

```text
GET /api/lancamentos/:id/timeline
```

## Dados Agrupados

```text
GET /api/dados-agrupados?mes=7&ano=2026&filial_id=1
```

Retorna fornecedores com seus lancamentos do periodo.

Tambem inclui `boleto_resumo` quando a nota possui boleto compartilhado.

## Contratos

```text
GET  /api/contratos
POST /api/contratos
PUT  /api/contratos/:id
DELETE /api/contratos/:id
```

Lancamentos de um contrato:

```text
GET  /api/contratos/:id/lancamentos
POST /api/contratos/:id/lancamentos
```

Gerar notas pendentes para contratos recorrentes:

```text
POST /api/contratos/lancamentos/pendentes
```

## Solicitacoes

```text
GET    /api/solicitacoes
POST   /api/solicitacoes
PUT    /api/solicitacoes/:id
DELETE /api/solicitacoes/:id
```

## Upload

```text
POST /api/upload
```

Destino:

```text
Supabase Storage: notas-e-boletos
```

## Email e Feedback

Enviar email:

```text
POST /api/enviar-email
```

Feedback por link:

```text
GET /api/feedback?token=...
```

## Cron

Geracao recorrente de notas:

```text
GET /api/cron/gerar-notas-recorrentes
```

Notificacao de pendencias:

```text
GET /api/cron/notificar-pendencias
```

Keep alive:

```text
GET /api/cron/keep-alive
```

Quando `CRON_SECRET` estiver definido, chamadas de cron devem enviar o segredo esperado.

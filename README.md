# IT FinControl

Sistema interno para controle de notas fiscais, contratos recorrentes, fornecedores, filiais, solicitacoes de compra, vencimentos, anexos, notificacoes e envio de informacoes para Protheus/Fluig.

O projeto nasceu para resolver um problema operacional especifico: manter contratos e lancamentos bem vinculados, principalmente quando fornecedores possuem contratos com o mesmo numero, mas filiais, servicos, CNPJs ou itens diferentes.

## Principais Modulos

- **Notas fiscais**: cadastro, edicao inline, anexos, status, etapas, agrupamentos, copia de informacoes e boleto compartilhado.
- **Contratos**: contratos recorrentes/avulsos por fornecedor, valor fixo ou variavel, geracao de notas pendentes e linha do tempo.
- **Fornecedores**: cadastro com listas de CNPJs, contratos, centros de custo, servicos e produtos Protheus.
- **Filiais**: cadastro das unidades usadas nos lancamentos e contratos.
- **Solicitacoes**: acompanhamento de solicitacoes de compra.
- **Usuarios**: controle basico de acesso.
- **Notificacoes e jobs**: avisos de pendencias e geracao recorrente de notas.

## Stack

- Next.js 16
- React 19
- Material UI
- TanStack React Query
- Supabase PostgreSQL, Storage e Service Role
- Playwright
- Node test runner

## Como Rodar Localmente

1. Instale as dependencias:

```bash
npm install
```

2. Configure as variaveis em `.env.local`.

Use nomes reais das variaveis, mas nunca commite valores sensiveis:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
CRON_SECRET=
APP_URL=http://localhost:3000
```

3. Rode o servidor:

```bash
npm run dev
```

4. Abra:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev        # servidor local
npm run build      # build de producao
npm run start      # executa build gerado
npm run lint       # eslint
npm test           # testes unitarios
npm run test:unit  # testes unitarios
npm run test:e2e   # testes Playwright com servidor local automatico
```

## Documentacao

- [Visao geral funcional](docs/guia-usuario.md)
- [Arquitetura tecnica](docs/arquitetura.md)
- [Banco de dados e migrations](docs/banco-migrations.md)
- [API e rotas](docs/api.md)
- [Operacao, testes e deploy](docs/operacao-testes-deploy.md)

## Validacao Recomendada Antes de Deploy

```bash
npm run test:unit
npm run build
npm run test:e2e
```

## Cuidados

- Nao commitar `.env.local`.
- Nao expor `SUPABASE_SERVICE_ROLE_KEY`.
- Antes de rodar migrations em producao, revisar se o arquivo e estrutural ou de populacao.
- Ao alterar contratos, validar se a combinacao de fornecedor, contrato, filial, CNPJ, servico, produto Protheus, centro de custo e identificador do item continua distinguindo casos parecidos.

# Operacao, Testes e Deploy

## Ambiente Local

Instale dependencias:

```bash
npm install
```

Rode localmente:

```bash
npm run dev
```

Build:

```bash
npm run build
```

## Variaveis de Ambiente

Variaveis conhecidas:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
CRON_SECRET=
APP_URL=
```

Cuidados:

- Nunca commitar `.env.local`.
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY`.
- Usar valores diferentes para producao e desenvolvimento quando possivel.
- `APP_URL` deve apontar para a URL publica em producao para links de feedback.

## Testes Unitarios

Rodar:

```bash
npm run test:unit
```

Cobertura atual:

- normalizacao de numero de NF
- normalizacao de valores monetarios
- normalizacao de datas
- validacao de campos permitidos no PATCH inline
- resumo de boleto compartilhado

Arquivos:

```text
tests/unit/lancamentos-helpers.test.mjs
tests/unit/dados-agrupados-helpers.test.mjs
```

## Testes E2E

Rodar:

```bash
npm run test:e2e
```

O runner:

- sobe `next dev` se nao existir servidor em `localhost:3000`
- roda Playwright
- usa Microsoft Edge instalado no Windows
- encerra o servidor ao final

Arquivos:

```text
tests/run-e2e.mjs
tests/auditoria.spec.js
playwright.config.js
```

Cobertura atual:

- rotas principais respondem sem erro critico
- rotas PATCH de campo/status existem e validam payload ruim
- pagina inicial carrega sem erro visivel
- auditoria WCAG basica com limite tolerante para legado

## Validacao Antes de Commit

Recomendado:

```bash
npm run test:unit
npm run build
npm run test:e2e
```

## Deploy

O projeto e preparado para deploy em Vercel/Next.js.

Fluxo recomendado:

1. Garantir working tree revisada.
2. Rodar testes e build.
3. Commitar alteracoes.
4. Enviar para o repositorio remoto.
5. Confirmar se o deploy automatico iniciou.
6. Se nao iniciou, acionar deploy manual na plataforma.

## Migrations em Producao

Antes de deploy que depende de banco:

1. Identificar migrations novas.
2. Separar migrations estruturais de populacao.
3. Rodar primeiro em ambiente de teste, quando existir.
4. Fazer backup/logico quando a migration alterar dados existentes.
5. Aplicar em producao.
6. Validar telas afetadas.

## Checklist Operacional

Antes de liberar:

- Notas carregam na competencia atual.
- Filtro por filial funciona.
- Edicao inline salva e mostra feedback.
- Copia Protheus traz vencimento, contrato, produto, pedido, medicao e Fluig.
- Boleto compartilhado mostra divergencia quando valores nao batem.
- Contratos geram notas pendentes sem duplicar competencia.
- Linha do tempo abre e lista eventos.

## Problemas Comuns

### E2E falha por navegador

O projeto esta configurado para usar Edge instalado.

Se o Edge nao existir na maquina, instale o browser ou ajuste `playwright.config.js`.

### Rotas retornando 500

Verifique:

- variaveis Supabase
- migrations aplicadas
- permissao da Service Role
- nome real das tabelas

### Upload falha

Verifique:

- bucket `notas-e-boletos`
- politica de storage
- tamanho do arquivo
- variaveis Supabase

### Cron nao gera notas

Verifique:

- `CRON_SECRET`
- status dos contratos
- `tipo_contrato`
- competencia corrente
- se ja existe lancamento para o contrato/competencia

## Manutencao Recomendada

- Manter testes unitarios para toda regra nova.
- Extrair helpers quando a regra for usada por rota e tela.
- Evitar regras importantes apenas dentro de componente React.
- Atualizar docs quando alterar fluxo operacional.
- Revisar migrations de populacao antes de reaplicar.

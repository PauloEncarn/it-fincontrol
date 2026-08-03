# Banco de Dados e Migrations

O banco principal e Supabase PostgreSQL.

As migrations ficam em:

```text
supabase/migrations/
```

## Tabelas Principais

### `lancamentos`

Representa notas fiscais/lancamentos.

Campos funcionais importantes:

- `filial_id`
- `fornecedor_id`
- `contrato_id`
- `competencia`
- `numero_nota`
- `valor`
- `valor_previsto`
- `data_vencimento`
- `data_envio`
- `contrato_usado`
- `centro_custo_usado`
- `cnpj_usado`
- `descricao_servico`
- `servico_protheus`
- `numero_medicao`
- `numero_pedido`
- `solicitacao_fluig`
- `etapa`
- `status_pagamento`
- `arquivo_nota`
- `arquivo_boleto`
- `boleto_grupo`
- `valor_boleto`
- `observacao_boleto`

### `contratos_mensais`

Representa contratos recorrentes ou avulsos.

Campos funcionais importantes:

- `fornecedor_id`
- `filial_id`
- `tipo_contrato`
- `contrato_usado`
- `nome_contrato`
- `subcontrato_nome`
- `cnpj_usado`
- `centro_custo_usado`
- `descricao_servico`
- `produto_protheus`
- `valor_fixo`
- `valor_base_previsto`
- `dia_vencimento`
- `status`

### `fornecedores`

Cadastro de fornecedores e listas de opcoes permitidas:

- `lista_cnpjs`
- `lista_contratos`
- `lista_centro_custos`
- `lista_servicos`
- `lista_produtos_protheus`

### `filiais`

Cadastro de filiais/unidades.

### `lancamento_eventos`

Linha do tempo/auditoria de notas.

### `solicitacoes_compra`

Solicitacoes de compra acompanhadas no sistema.

## Migrations Relevantes

### Contratos

- `20260526_contratos_mensais.sql`
- `20260615_contratos_subcontratos.sql`
- `20260616_contratos_tipo_validacao.sql`
- `20260619_contratos_unicos_por_item.sql`
- `20260619_contratos_valor_fixo.sql`

### Etapas e auditoria

- `20260612_etapa_lancamentos.sql`
- `20260612_lancamento_eventos.sql`

### Fornecedores e catalogos

- `20260616_fornecedores_listas.sql`
- `20260617_fornecedores_catalogos.sql`
- `20260617_popular_catalogos_fornecedores.sql`

### Importacao e populacao

- `20260617_popular_lancamentos_historicos.sql`
- `20260617_popular_vencimentos_contratos.sql`
- `20260617_zz_contratos_ativos_valores_vencimentos.sql`
- `20260619_contratos_mercanet_popular.sql`
- `20260619_separar_claro_embratel.sql`
- `20260622_importar_lancamentos_gestao_faturas_6.sql`

### Boleto compartilhado

- `20260706_boleto_compartilhado_lancamentos.sql`

Adiciona:

```sql
boleto_grupo text
valor_boleto numeric(14, 2)
observacao_boleto text
```

### Performance

- `20260706_indices_performance_lancamentos.sql`

Cria indices para filtros e consultas frequentes em lancamentos:

- data de vencimento
- filial
- fornecedor
- status
- contrato
- vencimento + filial

## Regra de Identidade de Contrato

Um contrato deve ser unico dentro do fornecedor considerando a combinacao operacional.

Campos usados para diferenciar:

- fornecedor
- contrato
- filial
- CNPJ
- servico
- produto Protheus
- centro de custo
- identificador do item/subcontrato

Essa regra evita que notas sejam vinculadas ao contrato errado quando varios contratos possuem o mesmo numero.

## Cuidados ao Rodar Migrations

Nem toda migration e apenas estrutural.

Antes de executar, classifique:

- **Estrutural**: cria tabela, coluna, indice ou constraint.
- **Correcao de dados**: atualiza dados existentes.
- **Populacao**: insere contratos/lancamentos historicos ou casos especificos.

Em producao, revise especialmente arquivos de populacao antes de rodar novamente.

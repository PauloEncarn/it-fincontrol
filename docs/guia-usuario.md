# Guia Funcional

Este documento descreve como o sistema deve ser usado no dia a dia.

## Fluxo Principal de Notas

1. A nota nasce manualmente, por importacao ou por geracao recorrente de contrato.
2. A nota fica em uma etapa operacional:
   - `pendente`
   - `em_andamento`
   - `em_analise`
   - `contingencia`
   - `concluida`
3. O usuario completa dados como NF, vencimento, valor, contrato, produto Protheus, pedido, medicao e Fluig.
4. As informacoes podem ser copiadas individualmente ou agrupadas pelo botao de copia Protheus.
5. A nota pode ser enviada para validacao/analise conforme o fluxo da filial.

## Tela de Notas

A tela de notas possui dois modos principais:

- **Agrupado**: organiza notas por fornecedor, filial, competencia, mes de vencimento, status, centro de custo ou servico.
- **Grid**: organiza por etapa operacional para acompanhamento visual.

Recursos importantes:

- Filtro por competencia.
- Filtro por filial.
- Busca textual.
- Edicao inline de campos da nota.
- Indicador `Salvando...` durante alteracoes inline.
- Copia individual por campo.
- Copia agrupada para Protheus.
- Mudanca de etapa por seletor ou arraste.
- Visualizacao/preview de anexos.
- Linha do tempo da nota.

## Numero da Nota Fiscal

O numero da nota fiscal deve ter no maximo 9 digitos.

Quando o usuario informa um numero curto, o sistema completa com zeros a esquerda:

```text
018 -> 000000018
```

Se o numero tiver mais de 9 digitos, o sistema deve recusar o salvamento.

## Valores Monetarios

O sistema aceita formatos comuns:

```text
1566,93
1.566,93
1566.93
R$ 1.566,93
```

Internamente o valor e salvo como numero decimal.

## Boleto Compartilhado

Use boleto compartilhado quando duas ou mais notas compoem o mesmo boleto.

Campos:

- `Grupo do boleto`: identificador comum entre as notas.
- `Valor do boleto`: valor total do boleto.
- `Observacao do boleto`: detalhe opcional.

Na tela, o bloco **Nota compartilhada** so aparece quando existe grupo de boleto.

O sistema compara:

```text
soma das notas do grupo x valor do boleto
```

Estados esperados:

- **Compartilhado OK**: soma das notas bate com o valor do boleto.
- **Divergencia**: soma das notas nao bate.
- **Vinculado**: existe grupo, mas nao ha contexto suficiente para concluir compartilhamento.

## Tela de Contratos

Contratos representam recorrencias ou registros avulsos vinculados a fornecedores.

Campos que ajudam a diferenciar contratos parecidos:

- fornecedor
- numero do contrato
- filial
- CNPJ usado
- descricao do servico
- produto Protheus
- centro de custo
- identificador do item/subcontrato

Quando existirem contratos muito parecidos, use o identificador do item/subcontrato para diferenciar.

## Valor do Contrato

O valor pertence ao contrato, nao ao fornecedor.

Regras:

- **Valor fixo**: o sistema usa o valor informado no contrato.
- **Valor variavel**: o sistema tenta usar o valor da ultima nota daquele contrato.
- Se nao existir nota anterior e o contrato nao for fixo, o valor fica em branco/zero conforme o fluxo de criacao.

## Geracao de Notas Pendentes

Na tela de contratos existe o botao **Gerar notas pendentes**.

Ele gera notas para contratos recorrentes que ainda nao possuem lancamento para a competencia corrente.

O job recorrente tambem pode gerar notas automaticamente pelo menos 20 dias antes do vencimento, considerando a competencia atual.

## Linha do Tempo

A linha do tempo mostra eventos importantes:

- criacao
- edicao
- edicao inline
- mudanca de status/etapa
- envio de email
- feedback

Use a linha do tempo para entender quem alterou, quando alterou e quais campos mudaram.

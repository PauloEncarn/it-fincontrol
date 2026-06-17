import React, { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const emptyContract = {
  id: null,
  fornecedor_id: '',
  filial_id: '',
  tipo_contrato: 'Recorrente',
  cnpj_usado: '',
  contrato_usado: '',
  nome_contrato: '',
  subcontrato_nome: '',
  produto_protheus: '',
  centro_custo_usado: '',
  descricao_servico: '',
  servico_protheus: '',
  detalhe: '',
  fluxo_lancamento: 'manual',
  email_destino: '',
  responsavel_interno: '',
  regra_lancamento: '',
  valor_base_previsto: '',
  dia_vencimento: 1,
  status: 'Ativo',
  data_inicio: '',
  observacao: '',
};

const statusColor = {
  Ativo: 'success',
  Pausado: 'warning',
  Cancelado: 'default',
};

const lancamentoColor = (status) => {
  if (status === 'Concluída' || status === 'Concluida') return 'success';
  if (status === 'Divergência') return 'error';
  if (status === 'Pendente Nota' || status === 'Pendente Fatura' || status === 'Aguardando Fatura') return 'warning';
  if (status === 'Cancelada') return 'default';
  return 'info';
};

const currency = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const competenciaAtual = () => {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
};
const PAGE_SIZE = 25;
const listValues = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '').split(/[;|\n]/).map((item) => item.trim()).filter(Boolean);
};

const moneyOptionValue = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return '';
  const parsed = Number(text.replace(/\./g, '').replace(',', '.'));
  return Number.isNaN(parsed) ? text : String(parsed);
};

const buildContratoDetalhe = (form) => [
  form.contrato_usado && `Contrato: ${form.contrato_usado}`,
  form.descricao_servico && `Serviço: ${form.descricao_servico}`,
  form.produto_protheus && `Produto Protheus: ${form.produto_protheus}`,
  form.centro_custo_usado && `Centro de custo: ${form.centro_custo_usado}`,
  form.valor_base_previsto && `Valor previsto: ${currency(form.valor_base_previsto)}`,
].filter(Boolean).join(' | ');

export default function ContratosView({
  contratos,
  filiais,
  fornecedores,
  onLoadFornecedores,
  lancamentos,
  selectedContrato,
  setSelectedContrato,
  onSalvar,
  onExcluir,
  onGerarCompetencia,
  onEditarLancamento,
}) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyContract);
  const [competencia, setCompetencia] = useState(competenciaAtual());
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const fornecedorSelecionado = useMemo(
    () => fornecedores.find((item) => item.id == form.fornecedor_id) || null,
    [fornecedores, form.fornecedor_id]
  );
  const opcoesSelecionadas = useMemo(() => ({
    cnpjs: listValues(fornecedorSelecionado?.lista_cnpjs),
    contratos: listValues(fornecedorSelecionado?.lista_contratos),
    centros: listValues(fornecedorSelecionado?.lista_centro_custos),
    servicos: listValues(fornecedorSelecionado?.lista_servicos),
    produtos: listValues(fornecedorSelecionado?.lista_produtos_protheus),
    valores: listValues(fornecedorSelecionado?.lista_valores),
  }), [fornecedorSelecionado]);

  const lancamentosContrato = useMemo(() => (
    [...(lancamentos || [])].sort((a, b) => String(b.competencia || '').localeCompare(String(a.competencia || '')))
  ), [lancamentos]);

  const gruposContratos = useMemo(() => {
    const grupos = new Map();

    (contratos || []).forEach((contrato) => {
      const fornecedor = contrato.fornecedor?.nome_empresa || 'Fornecedor nao informado';
      const key = fornecedor;

      if (!grupos.has(key)) {
        grupos.set(key, {
          key,
          fornecedor,
          itens: [],
        });
      }

      const grupo = grupos.get(key);
      grupo.itens.push(contrato);
    });

    return [...grupos.values()]
      .map((grupo) => ({
        ...grupo,
        itens: grupo.itens.sort((a, b) => (
          String(a.contrato_usado || '').localeCompare(String(b.contrato_usado || '')) ||
          String(a.subcontrato_nome || a.descricao_servico || '').localeCompare(String(b.subcontrato_nome || b.descricao_servico || ''))
        )),
      }))
      .sort((a, b) => a.fornecedor.localeCompare(b.fornecedor));
  }, [contratos]);

  const gruposFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return gruposContratos
      .map((grupo) => {
        const itens = grupo.itens.filter((contrato) => {
          const bateStatus = statusFiltro === 'todos' || contrato.status === statusFiltro;
          if (!bateStatus) return false;
          if (!termo) return true;

          return [
            grupo.fornecedor,
            contrato.contrato_usado,
            contrato.nome_contrato,
            contrato.subcontrato_nome,
            contrato.descricao_servico,
            contrato.produto_protheus,
            contrato.servico_protheus,
            contrato.detalhe,
          ].some((valor) => String(valor || '').toLowerCase().includes(termo));
        });

        return itens.length ? { ...grupo, itens } : null;
      })
      .filter(Boolean);
  }, [busca, gruposContratos, statusFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(gruposFiltrados.length / PAGE_SIZE));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const gruposPagina = useMemo(() => {
    const inicio = (paginaAtual - 1) * PAGE_SIZE;
    return gruposFiltrados.slice(inicio, inicio + PAGE_SIZE);
  }, [gruposFiltrados, paginaAtual]);
  const inicioPagina = gruposFiltrados.length ? (paginaAtual - 1) * PAGE_SIZE + 1 : 0;
  const fimPagina = Math.min(paginaAtual * PAGE_SIZE, gruposFiltrados.length);

  const resetListagem = () => {
    setPagina(1);
    setExpandedGroup(null);
  };

  const abrirNovo = () => {
    onLoadFornecedores?.();
    setForm({ ...emptyContract, data_inicio: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  const abrirEdicao = (contrato) => {
    onLoadFornecedores?.();
    setForm({
      ...emptyContract,
      ...contrato,
      fornecedor_id: contrato.fornecedor_id || '',
      filial_id: contrato.filial_id || '',
      data_inicio: contrato.data_inicio || '',
    });
    setShowModal(true);
  };

  const handleFornecedorChange = (id) => {
    const fornecedor = fornecedores.find((item) => item.id == id);
    const first = (value) => listValues(value)[0] || '';

    setForm((prev) => ({
      ...prev,
      fornecedor_id: id,
      cnpj_usado: fornecedor ? first(fornecedor.lista_cnpjs) : '',
      contrato_usado: fornecedor ? first(fornecedor.lista_contratos) : '',
      centro_custo_usado: fornecedor ? first(fornecedor.lista_centro_custos) : '',
      descricao_servico: fornecedor ? first(fornecedor.lista_servicos) : '',
      produto_protheus: fornecedor ? first(fornecedor.lista_produtos_protheus) : '',
      valor_base_previsto: fornecedor ? moneyOptionValue(first(fornecedor.lista_valores)) : '',
    }));
  };

  const handleSalvar = () => {
    onSalvar({ ...form, detalhe: buildContratoDetalhe(form) });
    setShowModal(false);
  };

  const renderListField = (label, field, options) => {
    const currentValue = form[field] || '';
    const currentOutsideList = currentValue && !options.includes(currentValue);

    return (
      <TextField
        select
        label={label}
        value={currentValue}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
        fullWidth
        helperText={options.length ? 'Opções cadastradas no fornecedor' : 'Cadastre as opções no fornecedor'}
        required={field === 'cnpj_usado'}
      >
        <MenuItem value="">{options.length ? 'Selecione...' : 'Sem opções cadastradas'}</MenuItem>
        {currentOutsideList && (
          <MenuItem value={currentValue}>{currentValue} (fora da lista)</MenuItem>
        )}
        {options.map((opcao) => (
          <MenuItem key={opcao} value={opcao}>{opcao}</MenuItem>
        ))}
      </TextField>
    );
  };

  const renderValorField = () => {
    const opcoes = opcoesSelecionadas.valores.map((valor) => ({
      label: valor,
      value: moneyOptionValue(valor),
    }));
    const currentValue = form.valor_base_previsto || '';
    const currentOutsideList = currentValue && !opcoes.some((opcao) => opcao.value === currentValue);

    return (
      <TextField
        select
        label="Valor previsto"
        value={currentValue}
        onChange={(e) => setForm({ ...form, valor_base_previsto: e.target.value })}
        fullWidth
        helperText={opcoes.length ? 'Valores cadastrados no fornecedor' : 'Cadastre os valores no fornecedor'}
      >
        <MenuItem value="">{opcoes.length ? 'Selecione...' : 'Sem valores cadastrados'}</MenuItem>
        {currentOutsideList && (
          <MenuItem value={currentValue}>{currency(currentValue)} (fora da lista)</MenuItem>
        )}
        {opcoes.map((opcao) => (
          <MenuItem key={opcao.label} value={opcao.value}>{opcao.label}</MenuItem>
        ))}
      </TextField>
    );
  };

  const appendStatusNote = (observacao, status) => {
    const stamp = new Date().toLocaleDateString('pt-BR');
    const note = `[${stamp}] Status alterado para ${status}.`;
    return observacao ? `${observacao}\n${note}` : note;
  };

  const alterarStatus = (contrato, status) => {
    const payload = {
      ...contrato,
      status,
      observacao: appendStatusNote(contrato.observacao, status),
    };

    onSalvar(payload);

    if (selectedContrato?.id === contrato.id) {
      setSelectedContrato({ ...selectedContrato, ...payload });
    }
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <CalendarMonthOutlinedIcon color="primary" />
              <Typography variant="h5" fontWeight={700}>Contratos</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Cadastro de contratos por fornecedor
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
            Novo contrato
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
          <TextField
            size="small"
            label="Buscar contrato"
            placeholder="Fornecedor, contrato, item ou produto"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              resetListagem();
            }}
            sx={{ flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 } }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusFiltro}
              onChange={(e) => {
                setStatusFiltro(e.target.value);
                resetListagem();
              }}
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="Ativo">Ativos</MenuItem>
              <MenuItem value="Pausado">Pausados</MenuItem>
              <MenuItem value="Cancelado">Cancelados</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: { md: 220 } }}>
            {gruposFiltrados.length} fornecedores encontrados
          </Typography>
        </Stack>
      </Paper>

      <Stack spacing={1.25}>
        {gruposPagina.map((grupo) => {
          const total = grupo.itens.reduce((acc, item) => acc + Number(item.valor_base_previsto || 0), 0);
          const ativos = grupo.itens.filter((item) => item.status === 'Ativo').length;
          const isExpanded = expandedGroup === grupo.key;

          return (
            <Accordion
              key={grupo.key}
              disableGutters
              expanded={isExpanded}
              onChange={(_, expanded) => setExpandedGroup(expanded ? grupo.key : null)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ width: '100%', minWidth: 0, pr: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={900} noWrap title={grupo.fornecedor}>
                      {grupo.fornecedor}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {grupo.itens.length} contratos cadastrados
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <Chip size="small" color="primary" variant="outlined" label={`${grupo.itens.length} itens`} />
                    <Chip size="small" color={ativos > 0 ? 'success' : 'default'} label={`${ativos} ativos`} />
                    <Chip size="small" variant="outlined" label={currency(total)} />
                  </Stack>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Contrato</TableCell>
                        <TableCell>Filial</TableCell>
                        <TableCell>Produto</TableCell>
                        <TableCell>Valor</TableCell>
                        <TableCell>Vencimento</TableCell>
                        <TableCell>Próxima</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {grupo.itens.map((contrato) => (
                        <TableRow key={contrato.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={800}>
                              {contrato.contrato_usado || 'Sem contrato'}
                            </Typography>
                            <Chip size="small" variant="outlined" label={contrato.tipo_contrato || 'Recorrente'} sx={{ mt: 0.5, mb: 0.5, height: 20, fontSize: 11 }} />
                            <Typography variant="caption" color="text.secondary">
                              {contrato.nome_contrato || contrato.descricao_servico || 'Contrato'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {contrato.detalhe || contrato.centro_custo_usado || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>{contrato.filial?.nome_fantasia || '-'}</TableCell>
                          <TableCell>{contrato.produto_protheus || contrato.servico_protheus || '-'}</TableCell>
                          <TableCell>{currency(contrato.valor_base_previsto)}</TableCell>
                          <TableCell>Dia {contrato.dia_vencimento}</TableCell>
                          <TableCell>{contrato.proxima_competencia || '-'}</TableCell>
                          <TableCell>
                            <Chip size="small" color={statusColor[contrato.status] || 'default'} label={contrato.status} sx={{ fontWeight: 700 }} />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Linha do tempo">
                              <IconButton color="primary" onClick={() => setSelectedContrato(contrato)}>
                                <HistoryOutlinedIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={contrato.status === 'Ativo' ? 'Gerar nota' : 'Apenas itens ativos geram notas'}>
                              <span>
                                <IconButton color="success" disabled={contrato.status !== 'Ativo' || contrato.tipo_contrato === 'Avulso'} onClick={() => onGerarCompetencia(contrato.id, contrato.proxima_competencia || competenciaAtual())}>
                                  <PlayCircleIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                            {contrato.status === 'Ativo' && (
                              <Tooltip title="Pausar item">
                                <IconButton color="warning" onClick={() => alterarStatus(contrato, 'Pausado')}>
                                  <PauseCircleOutlinedIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {contrato.status !== 'Cancelado' && (
                              <Tooltip title="Cancelar item">
                                <IconButton color="error" onClick={() => alterarStatus(contrato, 'Cancelado')}>
                                  <CancelOutlinedIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {contrato.status !== 'Ativo' && (
                              <Tooltip title="Reativar item">
                                <IconButton color="success" onClick={() => alterarStatus(contrato, 'Ativo')}>
                                  <ReplayOutlinedIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Editar">
                              <IconButton onClick={() => abrirEdicao(contrato)}>
                                <EditOutlinedIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir contrato">
                              <IconButton color="error" onClick={() => onExcluir?.(contrato)}>
                                <DeleteOutlinedIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          );
        })}
        {gruposContratos.length === 0 && (
          <Paper variant="outlined" sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            Nenhum contrato cadastrado.
          </Paper>
        )}
      </Stack>

      {gruposFiltrados.length > PAGE_SIZE && (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Mostrando {inicioPagina}-{fimPagina} de {gruposFiltrados.length} fornecedores
            </Typography>
            <Pagination
              count={totalPaginas}
              page={paginaAtual}
              onChange={(_, value) => {
                setPagina(value);
                setExpandedGroup(null);
              }}
              color="primary"
              shape="rounded"
            />
          </Stack>
        </Paper>
      )}

      <TableContainer component={Paper} variant="outlined" sx={{ display: 'none' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fornecedor</TableCell>
              <TableCell>Filial</TableCell>
              <TableCell>Valor previsto</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Última nota</TableCell>
              <TableCell>Próxima competência</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contratos.map((contrato) => (
              <TableRow key={contrato.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>{contrato.fornecedor?.nome_empresa || '-'}</TableCell>
                <TableCell>{contrato.filial?.nome_fantasia || '-'}</TableCell>
                <TableCell>{currency(contrato.valor_base_previsto)}</TableCell>
                <TableCell>Dia {contrato.dia_vencimento}</TableCell>
                <TableCell>{contrato.ultimo_lancamento?.competencia || '-'}</TableCell>
                <TableCell>{contrato.proxima_competencia || '-'}</TableCell>
                <TableCell>
                  <Chip size="small" color={statusColor[contrato.status] || 'default'} label={contrato.status} sx={{ fontWeight: 700 }} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Linha do tempo">
                    <IconButton color="primary" onClick={() => setSelectedContrato(contrato)}>
                      <HistoryOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={contrato.status === 'Ativo' ? 'Gerar nota' : 'Apenas contratos ativos geram notas'}>
                    <span>
                      <IconButton color="success" disabled={contrato.status !== 'Ativo'} onClick={() => onGerarCompetencia(contrato.id, contrato.proxima_competencia || competenciaAtual())}>
                        <PlayCircleIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {contrato.status === 'Ativo' && (
                    <Tooltip title="Pausar contrato">
                      <IconButton color="warning" onClick={() => alterarStatus(contrato, 'Pausado')}>
                        <PauseCircleOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {contrato.status !== 'Cancelado' && (
                    <Tooltip title="Cancelar contrato">
                      <IconButton color="error" onClick={() => alterarStatus(contrato, 'Cancelado')}>
                        <CancelOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {contrato.status !== 'Ativo' && (
                    <Tooltip title="Reativar contrato">
                      <IconButton color="success" onClick={() => alterarStatus(contrato, 'Ativo')}>
                        <ReplayOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Editar contrato">
                    <IconButton onClick={() => abrirEdicao(contrato)}>
                      <EditOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {contratos.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Nenhum contrato cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Drawer anchor="right" open={Boolean(selectedContrato)} onClose={() => setSelectedContrato(null)} PaperProps={{ sx: { width: { xs: '100%', md: 560 } } }}>
        {selectedContrato && (
          <Stack spacing={2} sx={{ p: 2.5 }}>
            <Box>
              <Typography variant="h6" fontWeight={800}>{selectedContrato.nome_contrato || selectedContrato.descricao_servico || 'Contrato'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedContrato.fornecedor?.nome_empresa || '-'} | Contrato {selectedContrato.contrato_usado || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">{selectedContrato.filial?.nome_fantasia || '-'} | {currency(selectedContrato.valor_base_previsto)}</Typography>
            </Box>
            <Divider />
            <Stack direction="row" spacing={1}>
              <TextField size="small" type="month" label="Competência" value={competencia} onChange={(e) => setCompetencia(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
              <Button variant="contained" disabled={selectedContrato.status !== 'Ativo' || selectedContrato.tipo_contrato === 'Avulso'} onClick={() => onGerarCompetencia(selectedContrato.id, competencia)}>Gerar nota</Button>
            </Stack>

            <Stack spacing={1.25}>
              {lancamentosContrato.map((lancamento) => {
                const variacao = Number(lancamento.valor || 0) - Number(lancamento.valor_previsto || selectedContrato.valor_base_previsto || 0);
                const temVariacao = Math.abs(variacao) > 0;

                return (
                  <Paper
                    key={lancamento.id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderColor: temVariacao ? (variacao > 0 ? 'error.light' : 'success.light') : 'divider',
                      bgcolor: temVariacao ? (variacao > 0 ? '#fff5f5' : '#f0fdf4') : 'background.paper',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" spacing={1.5} alignItems="center">
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography fontWeight={800}>{lancamento.competencia || '-'}</Typography>
                          {temVariacao && (
                            <Chip size="small" color={variacao > 0 ? 'error' : 'success'} label="Valor alterado" sx={{ fontWeight: 700 }} />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          NF {lancamento.numero_nota || '-'} | Venc. {lancamento.data_vencimento || '-'}
                        </Typography>
                        <Typography variant="body2">
                          Real {currency(lancamento.valor)} | Previsto {currency(lancamento.valor_previsto || selectedContrato.valor_base_previsto)}
                        </Typography>
                        {temVariacao && (
                          <Typography variant="caption" color={variacao > 0 ? 'error.main' : 'success.main'}>
                            Variação {currency(variacao)}
                          </Typography>
                        )}
                        {lancamento.observacao && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Obs.: {lancamento.observacao}
                          </Typography>
                        )}
                      </Box>
                      <Stack spacing={1} alignItems="flex-end">
                        <Chip size="small" color={lancamentoColor(lancamento.status_pagamento)} label={lancamento.status_pagamento || 'Sem status'} />
                        <Button size="small" onClick={() => onEditarLancamento(lancamento)}>Editar nota</Button>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
              {lancamentosContrato.length === 0 && (
                <Typography variant="body2" color="text.secondary">Nenhuma nota gerada para este contrato.</Typography>
              )}
            </Stack>
          </Stack>
        )}
      </Drawer>

      <Dialog open={showModal} onClose={() => setShowModal(false)} fullWidth maxWidth="md">
        <DialogTitle>{form.id ? 'Editar contrato' : 'Novo contrato'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField select label="Fornecedor" value={form.fornecedor_id || ''} onChange={(e) => handleFornecedorChange(e.target.value)} fullWidth required>
                <MenuItem value="">Selecione...</MenuItem>
                {fornecedores.map((fornecedor) => <MenuItem key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome_empresa}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField select label="Filial" value={form.filial_id || ''} onChange={(e) => setForm({ ...form, filial_id: e.target.value })} fullWidth helperText="Opcional no cadastro; preencha antes de gerar nota">
                <MenuItem value="">Selecione...</MenuItem>
                {filiais.map((filial) => <MenuItem key={filial.id} value={filial.id}>{filial.codigo} - {filial.nome_fantasia}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField select label="Tipo" value={form.tipo_contrato || 'Recorrente'} onChange={(e) => setForm({ ...form, tipo_contrato: e.target.value })} fullWidth>
                {['Recorrente', 'Avulso'].map((tipo) => <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              {renderListField('Contrato usado', 'contrato_usado', opcoesSelecionadas.contratos)}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              {renderListField('Serviço', 'descricao_servico', opcoesSelecionadas.servicos)}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              {renderListField('Produto Protheus', 'produto_protheus', opcoesSelecionadas.produtos)}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              {renderListField('Centro de custo', 'centro_custo_usado', opcoesSelecionadas.centros)}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              {renderValorField()}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Data de início"
                type="date"
                value={form.data_inicio || ''}
                onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Dia padrão de vencimento"
                type="number"
                value={form.dia_vencimento || 1}
                onChange={(e) => setForm({ ...form, dia_vencimento: e.target.value })}
                fullWidth
                slotProps={{ htmlInput: { min: 1, max: 31 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField select label="Status" value={form.status || 'Ativo'} onChange={(e) => setForm({ ...form, status: e.target.value })} fullWidth>
                {['Ativo', 'Pausado', 'Cancelado'].map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField select label="Fluxo" value={form.fluxo_lancamento || 'manual'} onChange={(e) => setForm({ ...form, fluxo_lancamento: e.target.value })} fullWidth>
                {[
                  ['manual', 'Manual'],
                  ['fluig', 'Fluig'],
                  ['gopa', 'GOPA'],
                  ['email', 'E-mail'],
                  ['job_mensal', 'Job mensal'],
                ].map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={12}>
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={800}>
                  Resumo do contrato
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  {buildContratoDetalhe(form) || 'Selecione as informações do contrato para montar o resumo.'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvar}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

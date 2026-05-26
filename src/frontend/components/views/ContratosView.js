import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  MenuItem,
  Paper,
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
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';

const emptyContract = {
  id: null,
  fornecedor_id: '',
  filial_id: '',
  cnpj_usado: '',
  contrato_usado: '',
  centro_custo_usado: '',
  descricao_servico: '',
  servico_protheus: '',
  valor_base_previsto: '',
  dia_vencimento: 1,
  tolerancia_percentual: 5,
  status: 'Ativo',
  data_inicio: '',
  data_fim: '',
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
  if (status === 'Pendente Nota') return 'warning';
  if (status === 'Cancelada') return 'default';
  return 'info';
};

const currency = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const competenciaAtual = () => {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
};

export default function ContratosView({
  contratos,
  filiais,
  fornecedores,
  lancamentos,
  selectedContrato,
  setSelectedContrato,
  onSalvar,
  onGerarCompetencia,
  onEditarLancamento,
}) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyContract);
  const [competencia, setCompetencia] = useState(competenciaAtual());

  const lancamentosContrato = useMemo(() => (
    [...(lancamentos || [])].sort((a, b) => String(b.competencia || '').localeCompare(String(a.competencia || '')))
  ), [lancamentos]);

  const abrirNovo = () => {
    setForm({ ...emptyContract, data_inicio: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  const abrirEdicao = (contrato) => {
    setForm({
      ...emptyContract,
      ...contrato,
      fornecedor_id: contrato.fornecedor_id || '',
      filial_id: contrato.filial_id || '',
      data_inicio: contrato.data_inicio || '',
      data_fim: contrato.data_fim || '',
    });
    setShowModal(true);
  };

  const handleFornecedorChange = (id) => {
    const fornecedor = fornecedores.find((item) => item.id == id);
    const first = (value) => (value || '').split(';').map((item) => item.trim()).filter(Boolean)[0] || '';

    setForm((prev) => ({
      ...prev,
      fornecedor_id: id,
      cnpj_usado: fornecedor ? first(fornecedor.lista_cnpjs) : '',
      contrato_usado: fornecedor ? first(fornecedor.lista_contratos) : '',
      centro_custo_usado: fornecedor ? first(fornecedor.lista_centro_custos) : '',
      descricao_servico: fornecedor?.padrao_descricao_servico || prev.descricao_servico,
      servico_protheus: fornecedor?.padrao_servico_protheus || prev.servico_protheus,
    }));
  };

  const handleSalvar = () => {
    onSalvar(form);
    setShowModal(false);
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <CalendarMonthOutlinedIcon color="primary" />
              <Typography variant="h5" fontWeight={700}>Contratos mensais</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Contratos permanentes e lançamentos por competência
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
            Novo contrato
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fornecedor</TableCell>
              <TableCell>Filial</TableCell>
              <TableCell>Valor previsto</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Último mês</TableCell>
              <TableCell>Próximo esperado</TableCell>
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
                  <Tooltip title="Gerar competência">
                    <IconButton color="success" onClick={() => onGerarCompetencia(contrato.id, contrato.proxima_competencia || competenciaAtual())}>
                      <PlayCircleIcon />
                    </IconButton>
                  </Tooltip>
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
                  Nenhum contrato mensal cadastrado.
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
              <Typography variant="h6" fontWeight={800}>{selectedContrato.fornecedor?.nome_empresa || 'Contrato'}</Typography>
              <Typography variant="body2" color="text.secondary">{selectedContrato.filial?.nome_fantasia || '-'} | {currency(selectedContrato.valor_base_previsto)}</Typography>
            </Box>
            <Divider />
            <Stack direction="row" spacing={1}>
              <TextField size="small" type="month" label="Competência" value={competencia} onChange={(e) => setCompetencia(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
              <Button variant="contained" onClick={() => onGerarCompetencia(selectedContrato.id, competencia)}>Gerar</Button>
            </Stack>

            <Stack spacing={1.25}>
              {lancamentosContrato.map((lancamento) => {
                const variacao = Number(lancamento.valor || 0) - Number(lancamento.valor_previsto || selectedContrato.valor_base_previsto || 0);

                return (
                  <Paper key={lancamento.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={1.5} alignItems="center">
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={800}>{lancamento.competencia || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          NF {lancamento.numero_nota || '-'} | Venc. {lancamento.data_vencimento || '-'}
                        </Typography>
                        <Typography variant="body2">
                          Real {currency(lancamento.valor)} | Previsto {currency(lancamento.valor_previsto || selectedContrato.valor_base_previsto)}
                        </Typography>
                        {Math.abs(variacao) > 0 && (
                          <Typography variant="caption" color={variacao > 0 ? 'error.main' : 'success.main'}>
                            Variação {currency(variacao)}
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
                <Typography variant="body2" color="text.secondary">Nenhuma competência gerada para este contrato.</Typography>
              )}
            </Stack>
          </Stack>
        )}
      </Drawer>

      <Dialog open={showModal} onClose={() => setShowModal(false)} fullWidth maxWidth="md">
        <DialogTitle>{form.id ? 'Editar contrato mensal' : 'Novo contrato mensal'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField select label="Fornecedor" value={form.fornecedor_id || ''} onChange={(e) => handleFornecedorChange(e.target.value)} fullWidth required>
                <MenuItem value="">Selecione...</MenuItem>
                {fornecedores.map((fornecedor) => <MenuItem key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome_empresa}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField select label="Filial" value={form.filial_id || ''} onChange={(e) => setForm({ ...form, filial_id: e.target.value })} fullWidth required>
                <MenuItem value="">Selecione...</MenuItem>
                {filiais.map((filial) => <MenuItem key={filial.id} value={filial.id}>{filial.codigo} - {filial.nome_fantasia}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="CNPJ usado" value={form.cnpj_usado || ''} onChange={(e) => setForm({ ...form, cnpj_usado: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Contrato usado" value={form.contrato_usado || ''} onChange={(e) => setForm({ ...form, contrato_usado: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Centro de custo" value={form.centro_custo_usado || ''} onChange={(e) => setForm({ ...form, centro_custo_usado: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Valor base previsto" type="number" value={form.valor_base_previsto || ''} onChange={(e) => setForm({ ...form, valor_base_previsto: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Dia padrão de vencimento" type="number" inputProps={{ min: 1, max: 31 }} value={form.dia_vencimento || 1} onChange={(e) => setForm({ ...form, dia_vencimento: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Tolerância percentual" type="number" value={form.tolerancia_percentual ?? 5} onChange={(e) => setForm({ ...form, tolerancia_percentual: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField select label="Status" value={form.status || 'Ativo'} onChange={(e) => setForm({ ...form, status: e.target.value })} fullWidth>
                {['Ativo', 'Pausado', 'Cancelado'].map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Data início" type="date" value={form.data_inicio || ''} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Data fim" type="date" value={form.data_fim || ''} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Descrição / serviço" value={form.descricao_servico || ''} onChange={(e) => setForm({ ...form, descricao_servico: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Serviço Protheus" value={form.servico_protheus || ''} onChange={(e) => setForm({ ...form, servico_protheus: e.target.value })} fullWidth />
            </Grid>
            <Grid size={12}>
              <TextField label="Observação" value={form.observacao || ''} onChange={(e) => setForm({ ...form, observacao: e.target.value })} multiline minRows={3} fullWidth />
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

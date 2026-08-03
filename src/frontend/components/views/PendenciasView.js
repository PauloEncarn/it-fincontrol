import React, { useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';

const currency = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const dateBr = (value) => {
  if (!value) return '-';
  const [date] = String(value).split('T');
  return date.split('-').reverse().join('/');
};

const monthInputValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const PENDENCIA_SECTIONS = [
  { id: 'vencidas', title: 'Vencidas em aberto', icon: <EventBusyOutlinedIcon />, color: 'error' },
  { id: 'proximas_7_dias', title: 'Vencem em ate 7 dias', icon: <ReportProblemOutlinedIcon />, color: 'warning' },
  { id: 'contratos_sem_nota_mes', title: 'Contratos sem nota no mes', icon: <ReceiptLongOutlinedIcon />, color: 'secondary' },
  { id: 'sem_nota_fiscal', title: 'Sem numero de NF', icon: <ReceiptLongOutlinedIcon />, color: 'warning' },
  { id: 'sem_boleto', title: 'Sem boleto', icon: <ReceiptLongOutlinedIcon />, color: 'warning' },
  { id: 'sem_controle_interno', title: 'Sem medicao, pedido ou Fluig', icon: <FactCheckOutlinedIcon />, color: 'info' },
  { id: 'boleto_divergente', title: 'Boleto compartilhado divergente', icon: <ReportProblemOutlinedIcon />, color: 'error' },
];

function SummaryCard({ label, value, helper, color = 'primary' }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, height: '100%' }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={900} color={`${color}.main`} sx={{ mt: 0.5 }}>
        {value}
      </Typography>
      {helper && (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      )}
    </Paper>
  );
}

function NotaRow({ item, onEditar }) {
  const fornecedor = item.fornecedor?.nome_empresa || item.nome_fornecedor || '-';
  const filial = item.filial?.codigo || item.filial?.nome_fantasia || '-';
  const contrato = item.contrato_usado || item.nome_contrato || '-';
  const descricao = item.descricao_servico || item.subcontrato_nome || item.nome_contrato || '-';

  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="subtitle2" fontWeight={900} noWrap title={fornecedor}>
              {fornecedor}
            </Typography>
            <Chip size="small" variant="outlined" label={filial} />
            <Chip size="small" color="primary" variant="outlined" label={`Contrato ${contrato}`} />
          </Stack>
          <Typography variant="body2" color="text.secondary" noWrap title={descricao}>
            {descricao}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            NF: {item.numero_nota || '-'} | Pedido: {item.numero_pedido || '-'} | Medicao: {item.numero_medicao || '-'} | Fluig: {item.solicitacao_fluig || '-'}
          </Typography>
        </Box>
        <Box sx={{ minWidth: { md: 160 }, textAlign: { xs: 'left', md: 'right' } }}>
          <Typography variant="subtitle2" fontWeight={900}>
            {currency(item.valor || item.valor_base_previsto)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Venc. {dateBr(item.data_vencimento)}
          </Typography>
        </Box>
        {item.id && (
          <Tooltip title="Editar nota">
            <IconButton color="primary" onClick={() => onEditar?.(item)} aria-label="Editar nota">
              <EditOutlinedIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
}

export default function PendenciasView({
  relatorio,
  loading,
  competencia,
  setCompetencia,
  filiais,
  filialFiltro,
  setFilialFiltro,
  onEditar,
  onRefresh,
}) {
  const totalizadores = relatorio?.totalizadores || {};
  const fechamento = relatorio?.fechamento || [];
  const pendencias = relatorio?.pendencias || {};
  const totalPendencias = useMemo(
    () => Object.values(pendencias).reduce((total, lista) => total + (Array.isArray(lista) ? lista.length : 0), 0),
    [pendencias]
  );
  const checksOk = fechamento.filter((item) => item.pendencias === 0).length;
  const progresso = fechamento.length ? Math.round((checksOk / fechamento.length) * 100) : 0;

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight={900}>
              Pendencias e fechamento mensal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Conferencia operacional por competencia, filial e contrato recorrente.
            </Typography>
          </Box>

          <TextField
            type="month"
            label="Competencia"
            value={monthInputValue(competencia)}
            onChange={(event) => {
              const [ano, mes] = event.target.value.split('-').map(Number);
              if (ano && mes) setCompetencia(new Date(ano, mes - 1, 1));
            }}
            sx={{ minWidth: 190 }}
          />

          <FormControl sx={{ minWidth: 230 }}>
            <InputLabel>Filial</InputLabel>
            <Select value={filialFiltro} label="Filial" onChange={(event) => setFilialFiltro(event.target.value)}>
              <MenuItem value="">Todas</MenuItem>
              {filiais.map((filial) => (
                <MenuItem key={filial.id} value={filial.id}>
                  {filial.codigo ? `${filial.codigo} - ` : ''}{filial.nome_fantasia}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip title="Atualizar">
            <IconButton onClick={onRefresh} color="primary">
              <RefreshOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard label="Notas no mes" value={totalizadores.notas || 0} helper={`${totalizadores.abertas || 0} abertas`} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard label="Pendencias" value={totalPendencias} color={totalPendencias ? 'warning' : 'success'} helper="Itens que pedem acao" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard label="Valor lancado" value={currency(totalizadores.valor_total)} helper={`Previsto ${currency(totalizadores.valor_previsto)}`} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard label="Fechamento" value={`${progresso}%`} color={progresso === 100 ? 'success' : 'primary'} helper={`${checksOk}/${fechamento.length} checks OK`} />
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={900}>
                  Fechamento mensal
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Checklist para saber se a competencia pode ser conferida.
                </Typography>
              </Box>
              <Box sx={{ minWidth: { md: 260 } }}>
                <LinearProgress variant="determinate" value={progresso} sx={{ height: 8, borderRadius: 1 }} />
              </Box>
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Grid container spacing={1}>
              {fechamento.map((item) => (
                <Grid item xs={12} md={6} key={item.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleOutlineOutlinedIcon color={item.pendencias === 0 ? 'success' : 'disabled'} fontSize="small" />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {item.label}
                    </Typography>
                    <Chip
                      size="small"
                      color={item.pendencias === 0 ? 'success' : 'warning'}
                      variant={item.pendencias === 0 ? 'filled' : 'outlined'}
                      label={item.pendencias === 0 ? 'OK' : `${item.pendencias} pend.`}
                    />
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {totalPendencias === 0 && (
            <Alert severity="success" variant="outlined">
              Nenhuma pendencia encontrada para esta competencia.
            </Alert>
          )}

          <Grid container spacing={1.5}>
            {PENDENCIA_SECTIONS.map((section) => {
              const items = pendencias[section.id] || [];
              if (items.length === 0) return null;

              return (
                <Grid item xs={12} lg={6} key={section.id}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, height: '100%' }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                      <Box sx={{ color: `${section.color}.main`, display: 'flex' }}>{section.icon}</Box>
                      <Typography variant="subtitle1" fontWeight={900} sx={{ flex: 1 }}>
                        {section.title}
                      </Typography>
                      <Chip size="small" color={section.color} label={items.length} />
                    </Stack>
                    <Stack spacing={1} sx={{ maxHeight: 440, overflowY: 'auto', pr: 0.5 }}>
                      {items.map((item) => (
                        <NotaRow key={`${section.id}-${item.id || item.contrato_usado}-${item.filial_id}`} item={item} onEditar={onEditar} />
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Stack>
  );
}

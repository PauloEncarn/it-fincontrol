import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';

const MESES = ['Todos os meses', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const formatCurrency = (value) => Number(value || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const formatDate = (value) => {
  if (!value) return '-';
  const [dateOnly] = String(value).split('T');
  const parts = dateOnly.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateOnly;
};

const parseDateLocal = (value) => {
  if (!value) return null;
  const [dateOnly] = String(value).split('T');
  const parts = dateOnly.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !part)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

const daysUntil = (value) => {
  const date = parseDateLocal(value);
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
};

const getEtapa = (nota) => {
  if (nota.etapa) return nota.etapa;

  const status = String(nota.status_pagamento || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (status.includes('conclu') || status.includes('pago')) return 'concluida';
  if (status.includes('conting') || status.includes('diverg') || status.includes('rejeit') || status.includes('cancel')) return 'contingencia';
  if (status.includes('aprovacao') || status.includes('confirmacao') || status.includes('analise')) return 'em_analise';
  if (status.includes('em andamento')) return 'em_andamento';
  return 'pendente';
};

const isConcluida = (nota) => getEtapa(nota) === 'concluida';
const isContingencia = (nota) => getEtapa(nota) === 'contingencia';
const isAnalise = (nota) => getEtapa(nota) === 'em_analise';
const isGopa = (nota) => String(nota.filial?.nome_fantasia || '').toUpperCase().includes('GOPA');
const hasAnexos = (nota) => Boolean(nota.arquivo_nota && nota.arquivo_boleto);

function KpiCard({ title, value, detail, icon, tone = 'primary' }) {
  const toneMap = {
    primary: { color: 'primary.main', bg: 'primary.light' },
    success: { color: 'success.main', bg: '#dff6dd' },
    warning: { color: 'warning.main', bg: '#fff4ce' },
    error: { color: 'error.main', bg: '#fde7e9' },
    secondary: { color: 'secondary.main', bg: '#e8e8fb' },
    neutral: { color: 'text.secondary', bg: '#f3f2f1' },
  };
  const colors = toneMap[tone] || toneMap.primary;

  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%', minHeight: 118 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={800}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ width: 38, height: 38, display: 'grid', placeItems: 'center', bgcolor: colors.bg, color: colors.color }}>
          {icon}
        </Box>
      </Stack>
      {detail && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          {detail}
        </Typography>
      )}
    </Paper>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={900}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

function NotaLinha({ nota, badge }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.25 }}>
      <Stack direction="row" spacing={1.25} justifyContent="space-between" alignItems="center">
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={900} noWrap title={nota.nome_fornecedor || nota.fornecedor?.nome_empresa || 'Fornecedor'}>
            {nota.nome_fornecedor || nota.fornecedor?.nome_empresa || 'Fornecedor não informado'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            NF {nota.numero_nota || '-'} | Venc. {formatDate(nota.data_vencimento)}
          </Typography>
        </Box>
        {badge}
      </Stack>
    </Paper>
  );
}

export default function DashboardView({ notas, filiais }) {
  const hoje = new Date();
  const [mesNotas, setMesNotas] = useState(hoje.getMonth() + 1);
  const [anoNotas, setAnoNotas] = useState(hoje.getFullYear());
  const [filialNotas, setFilialNotas] = useState('');

  const dadosNotas = useMemo(() => {
    return notas.filter((nota) => {
      const dataStr = nota.data_vencimento || nota.data_envio || nota.created_at;
      const data = parseDateLocal(dataStr) || new Date(dataStr);
      if (Number.isNaN(data.getTime())) return false;

      const matchAno = data.getFullYear() === Number(anoNotas);
      const matchMes = mesNotas === 0 || data.getMonth() + 1 === Number(mesNotas);
      const matchFilial = filialNotas ? nota.filial_id == filialNotas : true;
      return matchAno && matchMes && matchFilial;
    });
  }, [notas, mesNotas, anoNotas, filialNotas]);

  const abertas = dadosNotas.filter((nota) => !isConcluida(nota));
  const concluidas = dadosNotas.filter(isConcluida);
  const contingencias = dadosNotas.filter(isContingencia);
  const analise = dadosNotas.filter(isAnalise);
  const aguardandoGopa = dadosNotas.filter((nota) => nota.status_pagamento === 'Aguardando Confirmação GOPA');
  const semDocumento = abertas.filter((nota) => !hasAnexos(nota));
  const gopaEnviar = abertas.filter((nota) => isGopa(nota) && getEtapa(nota) === 'em_andamento');
  const vencendoCriticas = abertas
    .map((nota) => ({ nota, dias: daysUntil(nota.data_vencimento) }))
    .filter((item) => item.dias !== null && item.dias <= 10)
    .sort((a, b) => a.dias - b.dias);

  const totalAberto = abertas.reduce((acc, nota) => acc + Number(nota.valor || 0), 0);
  const valorMes = dadosNotas.reduce((acc, nota) => acc + Number(nota.valor || 0), 0);
  const percentualConcluido = dadosNotas.length ? Math.round((concluidas.length / dadosNotas.length) * 100) : 0;

  const fornecedoresResumo = Object.values(dadosNotas.reduce((acc, nota) => {
    const nome = nota.nome_fornecedor || nota.fornecedor?.nome_empresa || 'Fornecedor não informado';
    if (!acc[nome]) {
      acc[nome] = { nome, total: 0, valor: 0, abertas: 0, criticas: 0, contingencias: 0, semDocumento: 0 };
    }

    const item = acc[nome];
    item.total += 1;
    item.valor += Number(nota.valor || 0);
    if (!isConcluida(nota)) item.abertas += 1;
    if (isContingencia(nota)) item.contingencias += 1;
    if (!isConcluida(nota) && !hasAnexos(nota)) item.semDocumento += 1;

    const dias = daysUntil(nota.data_vencimento);
    if (!isConcluida(nota) && dias !== null && dias <= 10) item.criticas += 1;

    return acc;
  }, {}))
    .map((item) => ({
      ...item,
      score: item.criticas * 5 + item.contingencias * 4 + item.semDocumento * 2 + item.abertas,
    }))
    .sort((a, b) => b.score - a.score || b.valor - a.valor)
    .slice(0, 6);

  const proximasAcoes = [
    { label: 'Preparar notas pendentes', value: abertas.filter((nota) => getEtapa(nota) === 'pendente').length, tone: 'warning' },
    { label: 'Enviar GOPA', value: gopaEnviar.length, tone: 'secondary' },
    { label: 'Revisar contingências', value: contingencias.length, tone: 'error' },
    { label: 'Cobrar confirmações em análise', value: analise.length, tone: 'primary' },
    { label: 'Completar anexos', value: semDocumento.length, tone: 'warning' },
  ].filter((item) => item.value > 0);

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#faf9f8' }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 40, height: 40, display: 'grid', placeItems: 'center', bgcolor: 'primary.light', color: 'primary.main' }}>
              <ReceiptLongOutlinedIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Painel do mês
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Alertas, risco financeiro e ações prioritárias
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 112 }}>
              <InputLabel>Ano</InputLabel>
              <Select label="Ano" value={anoNotas} onChange={(event) => setAnoNotas(event.target.value)}>
                {[2024, 2025, 2026].map((ano) => <MenuItem key={ano} value={ano}>{ano}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Mês</InputLabel>
              <Select label="Mês" value={mesNotas} onChange={(event) => setMesNotas(Number(event.target.value))}>
                {MESES.map((mes, index) => <MenuItem key={mes} value={index}>{mes}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filial</InputLabel>
              <Select label="Filial" value={filialNotas} onChange={(event) => setFilialNotas(event.target.value)}>
                <MenuItem value="">Todas</MenuItem>
                {filiais.map((filial) => <MenuItem key={filial.id} value={filial.id}>{filial.nome_fantasia}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} lg={2}>
              <KpiCard title="Notas do mês" value={dadosNotas.length} detail={formatCurrency(valorMes)} icon={<ReceiptLongOutlinedIcon />} />
            </Grid>
            <Grid item xs={12} sm={6} lg={2}>
              <KpiCard title="Aberto" value={formatCurrency(totalAberto)} detail={`${abertas.length} notas em aberto`} icon={<PaidOutlinedIcon />} tone="warning" />
            </Grid>
            <Grid item xs={12} sm={6} lg={2}>
              <KpiCard title="Críticas" value={vencendoCriticas.length} detail="Vencidas ou até 10 dias" icon={<ErrorOutlineOutlinedIcon />} tone="error" />
            </Grid>
            <Grid item xs={12} sm={6} lg={2}>
              <KpiCard title="Contingência" value={contingencias.length} detail="Problemas ou sem saldo" icon={<ReportProblemOutlinedIcon />} tone="error" />
            </Grid>
            <Grid item xs={12} sm={6} lg={2}>
              <KpiCard title="GOPA" value={aguardandoGopa.length} detail="Aguardando confirmação" icon={<AccountTreeOutlinedIcon />} tone="secondary" />
            </Grid>
            <Grid item xs={12} sm={6} lg={2}>
              <KpiCard title="Concluídas" value={`${percentualConcluido}%`} detail={`${concluidas.length} notas finalizadas`} icon={<AssignmentTurnedInOutlinedIcon />} tone="success" />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <SectionTitle title="Críticas agora" subtitle="Vencidas ou com até 10 dias para pagamento" />
              <Chip color={vencendoCriticas.length ? 'error' : 'success'} label={vencendoCriticas.length ? `${vencendoCriticas.length} alertas` : 'Sem alertas'} />
            </Stack>

            <Stack spacing={1}>
              {vencendoCriticas.slice(0, 6).map(({ nota, dias }) => (
                <NotaLinha
                  key={nota.id}
                  nota={nota}
                  badge={<Chip size="small" color="error" label={dias < 0 ? 'Vencida' : dias === 0 ? 'Hoje' : `${dias} dias`} sx={{ fontWeight: 800 }} />}
                />
              ))}
              {vencendoCriticas.length === 0 && (
                <Alert severity="success" variant="outlined">Nenhuma nota crítica no filtro atual.</Alert>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <SectionTitle title="Próximas ações" subtitle="Fila objetiva para destravar o mês" />
            <Stack spacing={1.25} sx={{ mt: 2 }}>
              {proximasAcoes.map((acao) => (
                <Box key={acao.label}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={800}>{acao.label}</Typography>
                    <Chip size="small" color={acao.tone} label={acao.value} sx={{ fontWeight: 900 }} />
                  </Stack>
                  <LinearProgress variant="determinate" value={Math.min(100, acao.value * 12)} color={acao.tone} sx={{ height: 7 }} />
                </Box>
              ))}
              {proximasAcoes.length === 0 && (
                <Alert severity="success" variant="outlined">Nada urgente pendente no momento.</Alert>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <SectionTitle title="Fornecedores em atenção" subtitle="Prioridade por vencimento, contingência e ausência de anexos" />
            <Stack spacing={1.25} sx={{ mt: 2 }}>
              {fornecedoresResumo.map((fornecedor) => (
                <Paper key={fornecedor.nome} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={900} noWrap title={fornecedor.nome}>
                        {fornecedor.nome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fornecedor.total} notas | {formatCurrency(fornecedor.valor)}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap justifyContent="flex-end">
                      {fornecedor.criticas > 0 && <Chip size="small" color="error" label={`${fornecedor.criticas} críticas`} />}
                      {fornecedor.contingencias > 0 && <Chip size="small" color="error" variant="outlined" label={`${fornecedor.contingencias} cont.`} />}
                      {fornecedor.semDocumento > 0 && <Chip size="small" color="warning" label={`${fornecedor.semDocumento} anexos`} />}
                      {fornecedor.abertas > 0 && <Chip size="small" variant="outlined" label={`${fornecedor.abertas} abertas`} />}
                    </Stack>
                  </Stack>
                </Paper>
              ))}
              {fornecedoresResumo.length === 0 && (
                <Alert severity="info" variant="outlined">Sem fornecedores no filtro atual.</Alert>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <SectionTitle title="Pendências de documentos" subtitle="Notas sem nota fiscal ou boleto anexado" />
            <Stack spacing={1} sx={{ mt: 2 }}>
              {semDocumento.slice(0, 6).map((nota) => (
                <NotaLinha
                  key={nota.id}
                  nota={nota}
                  badge={<Chip size="small" color="warning" label={!nota.arquivo_nota && !nota.arquivo_boleto ? 'Sem anexos' : !nota.arquivo_nota ? 'Sem NF' : 'Sem boleto'} />}
                />
              ))}
              {semDocumento.length === 0 && (
                <Alert severity="success" variant="outlined">Todas as notas abertas do filtro têm anexos essenciais.</Alert>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <SectionTitle title="Leitura rápida" subtitle="Como está o mês filtrado" />
        <Divider sx={{ my: 1.5 }} />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
          <Chip icon={<ScheduleOutlinedIcon />} label={`${abertas.length} notas abertas`} />
          <Chip icon={<FactCheckOutlinedIcon />} color="success" label={`${concluidas.length} concluídas`} />
          <Chip icon={<ReportProblemOutlinedIcon />} color={contingencias.length ? 'error' : 'default'} label={`${contingencias.length} em contingência`} />
          <Chip icon={<ErrorOutlineOutlinedIcon />} color={vencendoCriticas.length ? 'error' : 'default'} label={`${vencendoCriticas.length} vencendo/vencidas`} />
        </Stack>
      </Paper>
    </Stack>
  );
}

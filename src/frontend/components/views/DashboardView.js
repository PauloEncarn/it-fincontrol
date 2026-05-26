import React, { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CORES } from '@/frontend/utils/constants';

const MESES = ['Todos os meses', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const formatCurrency = (value) => Number(value || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function KpiCard({ title, value, detail, icon, tone = 'primary' }) {
  const toneMap = {
    primary: { color: 'primary.main', bg: 'primary.light' },
    success: { color: 'success.main', bg: '#dff6dd' },
    warning: { color: 'warning.main', bg: '#fff4ce' },
    error: { color: 'error.main', bg: '#fde7e9' },
    neutral: { color: 'text.secondary', bg: '#f3f2f1' },
  };
  const colors = toneMap[tone] || toneMap.primary;

  return (
    <Paper variant="outlined" sx={{ p: 2, minHeight: 116, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.5, color: 'text.primary' }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ width: 36, height: 36, display: 'grid', placeItems: 'center', bgcolor: colors.bg, color: colors.color }}>
          {icon}
        </Box>
      </Stack>
      {detail && (
        <Typography variant="caption" color="text.secondary">
          {detail}
        </Typography>
      )}
    </Paper>
  );
}

function SectionHeader({ icon, title, subtitle, children }) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'stretch', md: 'center' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#faf9f8' }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 36, height: 36, display: 'grid', placeItems: 'center', bgcolor: 'primary.light', color: 'primary.main' }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontSize: 17 }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </Stack>
      {children}
    </Stack>
  );
}

export default function DashboardView({ notas, solicitacoes, filiais }) {
  const [mesNotas, setMesNotas] = useState(new Date().getMonth() + 1);
  const [anoNotas, setAnoNotas] = useState(2025);
  const [filialNotas, setFilialNotas] = useState('');
  const [mesSolic, setMesSolic] = useState(0);
  const [anoSolic, setAnoSolic] = useState(2025);

  const dadosNotas = useMemo(() => {
    const lista = notas.filter((nota) => {
      const dataStr = nota.data_vencimento || nota.data_envio;
      if (!dataStr) return false;

      const data = new Date(dataStr);
      if (Number.isNaN(data.getTime())) return false;

      const matchAno = data.getFullYear() == anoNotas;
      const matchMes = mesNotas === 0 || data.getMonth() + 1 == mesNotas;
      const matchFilial = filialNotas ? nota.filial_id == filialNotas : true;

      return matchAno && matchMes && matchFilial;
    });

    const evolucao = Array.from({ length: 12 }, (_, index) => ({
      name: MESES[index + 1].slice(0, 3),
      valor: 0,
    }));

    lista.forEach((nota) => {
      const data = new Date(nota.data_vencimento || nota.data_envio);
      if (!Number.isNaN(data.getTime())) {
        evolucao[data.getMonth()].valor += Number(nota.valor || 0);
      }
    });

    return { lista, evolucao };
  }, [notas, mesNotas, anoNotas, filialNotas]);

  const dadosSolic = useMemo(() => {
    return solicitacoes.filter((solicitacao) => {
      const dataStr = solicitacao.data_vencimento || solicitacao.created_at || new Date().toISOString();
      const data = new Date(dataStr);
      const anoItem = Number.isNaN(data.getTime()) ? 2025 : data.getFullYear();
      const mesItem = Number.isNaN(data.getTime()) ? new Date().getMonth() + 1 : data.getMonth() + 1;

      return anoItem == anoSolic && (mesSolic === 0 || mesItem == mesSolic);
    });
  }, [solicitacoes, mesSolic, anoSolic]);

  const totalNotas = dadosNotas.lista.reduce((acc, nota) => acc + Number(nota.valor || 0), 0);
  const totalSolic = dadosSolic.reduce((acc, solicitacao) => acc + Number(solicitacao.valor || 0), 0);
  const pendentes = dadosNotas.lista.filter((nota) => ['Pendente Nota', 'Pendente Lançamento'].includes(nota.status_pagamento)).length;
  const concluidas = dadosNotas.lista.filter((nota) => nota.status_pagamento === 'Concluída').length;
  const emProcesso = dadosNotas.lista.filter((nota) => nota.status_pagamento?.includes('Aguardando') || nota.status_pagamento === 'Nota Recebida').length;

  const statusData = [
    { name: 'Pendente', value: pendentes, color: CORES.vermelhoCicopal },
    { name: 'Em processo', value: emProcesso, color: CORES.amareloAlerta },
    { name: 'Concluída', value: concluidas, color: CORES.verdeSucesso },
  ].filter((item) => item.value > 0);

  const filiaisMap = {};
  dadosNotas.lista.forEach((nota) => {
    const nome = nota.filial?.nome_fantasia || 'Outros';
    filiaisMap[nome] = (filiaisMap[nome] || 0) + Number(nota.valor || 0);
  });
  const filiaisData = Object.entries(filiaisMap)
    .map(([name, valor]) => ({ name, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  const solicitacoesStatus = [
    { name: 'Concluído', val: dadosSolic.filter((item) => item.status === 'Concluído').length, color: '#107c10' },
    { name: 'Em andamento', val: dadosSolic.filter((item) => item.status === 'Em Andamento').length, color: '#0078d4' },
    { name: 'Rejeitado', val: dadosSolic.filter((item) => item.status === 'Rejeitado').length, color: '#a4262c' },
  ];

  return (
    <Stack spacing={3}>
      <Paper variant="outlined">
        <SectionHeader
          icon={<ReceiptLongOutlinedIcon />}
          title="Gestão de notas"
          subtitle="Resumo financeiro, status e distribuição por filial"
        >
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
        </SectionHeader>

        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <KpiCard title="Total filtrado" value={formatCurrency(totalNotas)} detail={`${dadosNotas.lista.length} notas`} icon={<PaidOutlinedIcon />} />
            </Grid>
            <Grid item xs={12} md={3}>
              <KpiCard title="Pendentes" value={pendentes} detail="Requer atenção" icon={<ErrorOutlineOutlinedIcon />} tone="error" />
            </Grid>
            <Grid item xs={12} md={3}>
              <KpiCard title="Concluídas" value={concluidas} detail="Fluxo finalizado" icon={<AssignmentTurnedInOutlinedIcon />} tone="success" />
            </Grid>
            <Grid item xs={12} md={3}>
              <KpiCard title="Em processo" value={emProcesso} detail="Aguardando ação" icon={<AccountTreeOutlinedIcon />} tone="warning" />
            </Grid>

            <Grid item xs={12} lg={6}>
              <Paper variant="outlined" sx={{ p: 2, height: 300 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Evolução ou status</Typography>
                  <Chip size="small" label={mesNotas === 0 ? 'Ano completo' : MESES[mesNotas]} />
                </Stack>
                <ResponsiveContainer width="100%" height="85%">
                  {mesNotas === 0 ? (
                    <AreaChart data={dadosNotas.evolucao}>
                      <defs>
                        <linearGradient id="sharepointBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0078d4" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#0078d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="valor" stroke="#0078d4" fill="url(#sharepointBlue)" strokeWidth={2} />
                    </AreaChart>
                  ) : (
                    <PieChart>
                      <Pie data={statusData} cx="45%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={4} dataKey="value">
                        {statusData.map((entry) => <Cell key={entry.name} fill={entry.color} strokeWidth={0} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="middle" align="right" layout="vertical" />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Paper variant="outlined" sx={{ p: 2, height: 300 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Top filiais por valor</Typography>
                <ResponsiveContainer width="100%" height="88%">
                  <BarChart data={filiaisData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="valor" fill="#0078d4" radius={[0, 2, 2, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Paper variant="outlined">
        <SectionHeader
          icon={<ShoppingCartOutlinedIcon />}
          title="Solicitações de compra"
          subtitle="Pedidos filtrados por competência"
        >
          <Stack direction="row" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 112 }}>
              <InputLabel>Ano</InputLabel>
              <Select label="Ano" value={anoSolic} onChange={(event) => setAnoSolic(event.target.value)}>
                {[2024, 2025, 2026].map((ano) => <MenuItem key={ano} value={ano}>{ano}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Mês</InputLabel>
              <Select label="Mês" value={mesSolic} onChange={(event) => setMesSolic(Number(event.target.value))}>
                {MESES.map((mes, index) => <MenuItem key={mes} value={index}>{mes}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </SectionHeader>

        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <KpiCard
                title="Total em pedidos"
                value={formatCurrency(totalSolic)}
                detail={`${dadosSolic.length} pedidos encontrados`}
                icon={<ShoppingCartOutlinedIcon />}
                tone="neutral"
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Paper variant="outlined" sx={{ p: 2, height: 180 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Status dos pedidos</Typography>
                <ResponsiveContainer width="100%" height="82%">
                  <BarChart data={solicitacoesStatus} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="val" radius={[0, 2, 2, 0]} barSize={20}>
                      {solicitacoesStatus.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Stack>
  );
}

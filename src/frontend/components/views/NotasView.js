import React, { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import DragIndicatorOutlinedIcon from '@mui/icons-material/DragIndicatorOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import FileDrop from '@/frontend/components/ui/FileDrop';
import { API_URL } from '@/frontend/utils/constants';

const STATUS_COLOR = {
  'Pendente Nota': 'warning',
  'Pendente Boleto': 'warning',
  'Pendente Fatura': 'secondary',
  'Aguardando Fatura': 'secondary',
  'Pendente Lançamento': 'warning',
  Pendente: 'warning',
  'Em andamento': 'info',
  'Em Andamento': 'info',
  'Nota Recebida': 'info',
  'Aguardando Aprovação Fluig': 'secondary',
  'Aguardando Confirmação GOPA': 'secondary',
  'Aguardando Contingência Gerente': 'error',
  'Aguardando Contingência Head': 'error',
  Concluida: 'success',
  Concluída: 'success',
  Divergência: 'error',
  Pago: 'success',
  Cancelada: 'error',
  Rejeitado: 'error',
};

const GRID_GROUPS = [
  { id: 'pendente', label: 'Pendente', color: 'warning', targetStatus: 'Pendente Nota' },
  { id: 'em_andamento', label: 'Em andamento', color: 'primary', targetStatus: 'Em Andamento' },
  { id: 'em_analise', label: 'Em análise', color: 'secondary', targetStatus: 'Aguardando Aprovação Fluig' },
  { id: 'contingencia', label: 'Contingência', color: 'error', targetStatus: 'Aguardando Contingência Gerente' },
  { id: 'concluida', label: 'Concluída', color: 'success', targetStatus: 'Concluída' },
];

const STATUS_BY_GROUP = {
  pendente: ['Pendente Nota', 'Pendente Boleto', 'Pendente Fatura'],
  em_andamento: ['Em Andamento'],
  em_analise: ['Aguardando Aprovação Fluig', 'Aguardando Confirmação GOPA'],
  contingencia: ['Aguardando Contingência Gerente', 'Aguardando Contingência Head'],
  concluida: ['Concluída', 'Cancelada'],
};

const GROUP_BY_OPTIONS = [
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'filial', label: 'Filial' },
  { value: 'competencia', label: 'Competência' },
  { value: 'mes_vencimento', label: 'Mês de vencimento' },
  { value: 'status', label: 'Status' },
  { value: 'centro_custo', label: 'Centro de custo' },
  { value: 'servico', label: 'Serviço' },
];

const DUE_SIGNAL_STYLE = {
  error: { bg: '#fde7e9', cardBg: '#fff5f6', border: '#a4262c', text: '#a4262c', shadow: '0 10px 26px rgba(164, 38, 44, 0.18)' },
  warning: { bg: '#fff4ce', cardBg: '#fffaf0', border: '#ffb900', text: '#8a5a00', shadow: '0 10px 24px rgba(255, 185, 0, 0.18)' },
  success: { bg: '#dff6dd', cardBg: '#f6fff5', border: '#107c10', text: '#107c10', shadow: '0 8px 20px rgba(16, 124, 16, 0.12)' },
};

const DUE_LEGEND = [
  { color: 'error', title: 'Prazo critico', description: 'Vencida, vence hoje ou vence em ate 10 dias.' },
  { color: 'warning', title: 'Atencao', description: 'Vence em 11 ou 12 dias.' },
  { color: 'success', title: 'Dentro do prazo', description: 'Vence em 13 dias ou mais.' },
  { color: 'default', title: 'Sem sombra', description: 'Concluida ou sem vencimento informado.' },
];

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getGridGroup = (status) => {
  const normalized = normalizeText(status);

  if (normalized.includes('em andamento')) return 'em_andamento';
  if (normalized.includes('aprovacao') || normalized.includes('confirmacao') || normalized.includes('analise') || normalized.includes('nota recebida')) return 'em_analise';
  if (normalized.includes('conting') || normalized.includes('diverg') || normalized.includes('cancel') || normalized.includes('rejeit')) return 'contingencia';
  if (normalized.includes('concluida') || normalized.includes('concluido') || normalized.includes('pago')) return 'concluida';
  if (normalized.includes('pendente') || normalized.includes('aguardando fatura') || normalized === 'pendente') return 'pendente';

  return 'pendente';
};

const getNotaGroup = (nota) => {
  if (nota?.etapa && GRID_GROUPS.some((group) => group.id === nota.etapa)) return nota.etapa;
  return getGridGroup(nota?.status_pagamento);
};

const statusOptionsForNota = (nota) => {
  const etapa = getNotaGroup(nota);
  const options = STATUS_BY_GROUP[etapa] || STATUS_BY_GROUP.pendente;
  return options.includes(nota.status_pagamento) || !nota.status_pagamento
    ? options
    : [nota.status_pagamento, ...options];
};

const formatDateForInput = (value) => {
  if (!value) return '';
  const text = String(value).split('T')[0];
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : text;
};

const formatMonthLabel = (value) => {
  if (!value) return 'Sem mês';
  const text = String(value).slice(0, 7);
  const match = text.match(/^(\d{4})-(\d{2})$/);
  if (!match) return value;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1, 12, 0, 0);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const agrupamentoNota = (nota, tipo) => {
  if (tipo === 'filial') {
    return nota.filial?.nome_fantasia || 'Filial não informada';
  }
  if (tipo === 'competencia') {
    return formatMonthLabel(nota.competencia);
  }
  if (tipo === 'mes_vencimento') {
    return formatMonthLabel(nota.data_vencimento);
  }
  if (tipo === 'status') {
    return nota.status_pagamento || 'Sem status';
  }
  if (tipo === 'centro_custo') {
    return nota.centro_custo_usado || 'Centro de custo não informado';
  }
  if (tipo === 'servico') {
    return nota.descricao_servico || 'Serviço não informado';
  }

  return nota.nome_fornecedor || nota.fornecedor?.nome_empresa || 'Fornecedor não informado';
};

const agrupamentoNotaKey = (nota, tipo) => {
  if (tipo === 'filial') return `filial:${nota.filial_id || 'sem_filial'}`;
  if (tipo === 'competencia') return `competencia:${nota.competencia || 'sem_competencia'}`;
  if (tipo === 'mes_vencimento') return `mes_vencimento:${String(nota.data_vencimento || '').slice(0, 7) || 'sem_mes'}`;
  if (tipo === 'status') return `status:${nota.status_pagamento || 'sem_status'}`;
  if (tipo === 'centro_custo') return `centro_custo:${nota.centro_custo_usado || 'sem_centro'}`;
  if (tipo === 'servico') return `servico:${nota.descricao_servico || 'sem_servico'}`;

  return `fornecedor:${nota.nome_fornecedor || nota.fornecedor?.nome_empresa || 'sem_fornecedor'}`;
};

const sortGroupedEntries = (entries, tipo) => {
  if (tipo === 'competencia' || tipo === 'mes_vencimento') {
    return entries.sort((a, b) => b.key.localeCompare(a.key));
  }

  return entries.sort((a, b) => a.label.localeCompare(b.label));
};

const maskDateInput = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const parseDateLocal = (value) => {
  if (!value) return null;
  const text = String(value).split('T')[0];
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

const getDueSignal = (dateValue) => {
  const dueDate = parseDateLocal(dateValue);
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
  if (daysUntilDue < 0) {
    return { color: 'error', label: 'Prazo crítico', title: `Vencida há ${Math.abs(daysUntilDue)} dias` };
  }
  if (daysUntilDue === 0) {
    return { color: 'error', label: 'Prazo crítico', title: 'Vence hoje' };
  }
  if (daysUntilDue <= 10) {
    return { color: 'error', label: 'Prazo crítico', title: `Vence em ${daysUntilDue} dias` };
  }
  if (daysUntilDue <= 12) {
    return { color: 'warning', label: 'Atenção', title: `${daysUntilDue} dias até o vencimento` };
  }
  return { color: 'success', label: 'Dentro do prazo', title: `${daysUntilDue} dias até o vencimento` };
};

export default function NotasView({
  notas,
  competencia,
  setCompetencia,
  filiais,
  filialFiltro,
  setFilialFiltro,
  statusFiltro,
  onEditar,
  onDuplicar,
  onCopiarProtheus,
  onEnviarEmail,
  onEnviarEmailGopa,
  onDownload,
  onStatusChange,
  onEtapaChange,
  onSalvarInline,
  isGopaFunc,
  busca,
  onRefresh,
  addToast,
}) {
  const [expandedSupplier, setExpandedSupplier] = useState({});
  const [viewMode, setViewMode] = useState('grouped');
  const [groupBy, setGroupBy] = useState('fornecedor');
  const [draggedNotaId, setDraggedNotaId] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [collapsedGridSuppliers, setCollapsedGridSuppliers] = useState({});
  const [expandedAttachments, setExpandedAttachments] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [savingCell, setSavingCell] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [timelineNota, setTimelineNota] = useState(null);
  const [timelineEventos, setTimelineEventos] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [contratoHistoricoNota, setContratoHistoricoNota] = useState(null);
  const [contratoHistoricoLancamentos, setContratoHistoricoLancamentos] = useState([]);
  const [contratoHistoricoLoading, setContratoHistoricoLoading] = useState(false);

  const handleExportarExcel = () => {
    if (!notas || notas.length === 0) return alert('Sem dados para exportar.');

    const totalValor = notas.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
    const headers = ['ID', 'Filial', 'Fornecedor', 'CNPJ', 'Nota Fiscal', 'Vencimento', 'Valor', 'Status', 'Descrição'];
    const rows = notas.map((n) => [
      n.id,
      n.filial_id,
      `"${n.nome_fornecedor || 'Desconhecido'}"`,
      n.cnpj_usado || '',
      n.numero_nota,
      n.data_vencimento ? new Date(n.data_vencimento).toLocaleDateString('pt-BR') : '',
      `"${parseFloat(n.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}"`,
      n.status_pagamento,
      `"${n.descricao_servico || ''}"`,
    ]);

    rows.push(['', '', '', '', 'TOTAL:', '', `"${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}"`, '', '']);

    const csvContent = [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_notas_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const notasFiltradas = useMemo(() => notas.filter((n) => {
    const matchStatus = statusFiltro.length === 0 || statusFiltro.includes(n.status_pagamento);
    const matchFilial = !filialFiltro || n.filial_id == filialFiltro;

    if (!busca) return matchStatus && matchFilial;

    const termo = busca.toLowerCase();
    const nomeArquivo = n.arquivo_nota ? n.arquivo_nota.split('/').pop().toLowerCase() : '';
    const nomeBoleto = n.arquivo_boleto ? n.arquivo_boleto.split('/').pop().toLowerCase() : '';
    const nomeFornecedor = n.fornecedor?.nome_empresa ? n.fornecedor.nome_empresa.toLowerCase() : '';
    const numeroNota = n.numero_nota ? n.numero_nota.toLowerCase() : '';
    const valorFormatado = n.valor ? parseFloat(n.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
    const valorLimpo = valorFormatado.replace(/\./g, '');

    const matchBusca =
      numeroNota.includes(termo) ||
      nomeFornecedor.includes(termo) ||
      nomeArquivo.includes(termo) ||
      nomeBoleto.includes(termo) ||
      valorFormatado.includes(termo) ||
      valorLimpo.includes(termo);

    return matchStatus && matchFilial && matchBusca;
  }), [notas, statusFiltro, filialFiltro, busca]);

  const boletoResumoPorGrupo = useMemo(() => notasFiltradas.reduce((grupos, nota) => {
    const grupo = String(nota.boleto_grupo || '').trim();
    if (!grupo) return grupos;

    const key = grupo.toLowerCase();
    if (!grupos[key]) {
      grupos[key] = {
        grupo,
        notas: [],
        somaNotas: 0,
        valorBoleto: null,
      };
    }

    grupos[key].notas.push(nota);
    grupos[key].somaNotas += Number(nota.valor || 0);
    if (grupos[key].valorBoleto === null && nota.valor_boleto !== null && nota.valor_boleto !== undefined && nota.valor_boleto !== '') {
      grupos[key].valorBoleto = Number(nota.valor_boleto || 0);
    }

    return grupos;
  }, {}), [notasFiltradas]);

  const dadosAgrupados = useMemo(() => sortGroupedEntries(
    Object.values(notasFiltradas.reduce((grupos, nota) => {
      const key = agrupamentoNotaKey(nota, groupBy);
      const label = agrupamentoNota(nota, groupBy);
      grupos[key] = grupos[key] || { key, label, itens: [] };
      grupos[key].itens.push(nota);
      return grupos;
    }, {})),
    groupBy
  ).map((grupo) => [grupo.label, grupo.itens]), [notasFiltradas, groupBy]);

  const handleDateChange = (e) => {
    if (!e.target.value) return;
    const [ano, mes] = e.target.value.split('-');
    setCompetencia(new Date(ano, mes - 1, 1, 12, 0, 0));
  };

  const agruparPorFornecedor = (listaNotas) =>
    Object.entries(
      listaNotas.reduce((grupos, nota) => {
        const fornecedor = nota.nome_fornecedor || nota.fornecedor?.nome_empresa || 'Fornecedor não informado';
        grupos[fornecedor] = grupos[fornecedor] || [];
        grupos[fornecedor].push(nota);
        return grupos;
      }, {})
    ).sort((a, b) => a[0].localeCompare(b[0]));

  const handleDragStart = (event, nota) => {
    setDraggedNotaId(nota.id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(nota.id));
  };

  const handleDragEnd = () => {
    setDraggedNotaId(null);
  };

  const handleDropOnGroup = (event, group) => {
    event.preventDefault();
    const transferId = event.dataTransfer.getData('text/plain');
    const notaId = transferId || draggedNotaId;
    const nota = notasFiltradas.find((item) => String(item.id) === String(notaId));

    if (!nota) {
      setDraggedNotaId(null);
      return;
    }

    if (getNotaGroup(nota) !== group.id) {
      const nextStatus = STATUS_BY_GROUP[group.id]?.includes(nota.status_pagamento)
        ? undefined
        : group.targetStatus;
      onEtapaChange(nota.id, group.id, nextStatus);
    }

    setDraggedNotaId(null);
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return value.split('T')[0].split('-').reverse().join('/');
  };

  const hasInfoForAnalysis = (nota) => Boolean(
    nota.filial_id &&
    nota.fornecedor_id &&
    nota.numero_nota &&
    nota.valor &&
    nota.data_vencimento &&
    nota.cnpj_usado &&
    nota.centro_custo_usado &&
    nota.numero_pedido &&
    !isGopaFunc(nota) &&
    nota.solicitacao_fluig
  );

  const iniciarLancamento = (nota) => {
    onEtapaChange(nota.id, 'em_andamento', 'Em Andamento');
    onEditar({ ...nota, etapa: 'em_andamento', status_pagamento: 'Em Andamento' });
  };

  const prosseguirLancamento = (nota) => {
    if (!hasInfoForAnalysis(nota)) {
      onEditar({ ...nota, etapa: 'em_andamento', status_pagamento: 'Em Andamento' });
      return;
    }

    onEtapaChange(nota.id, 'em_analise', 'Aguardando Aprovação Fluig');
  };

  const toggleGroupCollapsed = (groupId) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleGridSupplierCollapsed = (groupId, fornecedor) => {
    const key = `${groupId}::${fornecedor}`;
    setCollapsedGridSuppliers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAttachments = (notaId) => {
    setExpandedAttachments((prev) => ({ ...prev, [notaId]: !prev[notaId] }));
  };

  const fileUrl = (path) => path ? (path.startsWith('http') ? path : `${API_URL}/${path}`) : '';

  const openPreview = (path, title) => {
    if (!path) return;
    setPreviewFile({ title, url: fileUrl(path) });
  };

  const formatDateTime = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openTimeline = async (nota) => {
    setTimelineNota(nota);
    setTimelineEventos([]);
    setTimelineLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/lancamentos/${nota.id}/timeline`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Erro ao carregar linha do tempo.');
      setTimelineEventos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      addToast?.('error', 'Nao foi possivel carregar a linha do tempo.');
    } finally {
      setTimelineLoading(false);
    }
  };

  const openNotasContrato = async (nota) => {
    if (!nota?.contrato_id) {
      addToast?.('error', 'Esta nota nao esta vinculada a um contrato cadastrado.');
      return;
    }

    setContratoHistoricoNota(nota);
    setContratoHistoricoLancamentos([]);
    setContratoHistoricoLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/contratos/${nota.contrato_id}/lancamentos`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Erro ao carregar notas do contrato.');
      setContratoHistoricoLancamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      addToast?.('error', 'Nao foi possivel carregar as notas do contrato.');
    } finally {
      setContratoHistoricoLoading(false);
    }
  };

  const beginInlineEdit = (nota, field, value) => {
    setEditingCell(`${nota.id}:${field}`);
    setEditingValue(field === 'data_vencimento' ? formatDateForInput(value) : (value ?? ''));
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const copiarCampo = (label, value) => {
    const texto = value === null || value === undefined || value === '' ? '-' : String(value);
    navigator.clipboard.writeText(texto).then(() => addToast?.('success', `${label} copiado!`));
  };

  const commitInlineEdit = async (nota, field) => {
    const cellKey = `${nota.id}:${field}`;
    if (savingCell === cellKey) return;

    const original = nota[field] ?? '';
    if (String(original) === String(editingValue)) {
      cancelInlineEdit();
      return;
    }

    try {
      setSavingCell(cellKey);
      await onSalvarInline(nota, field, editingValue);
      cancelInlineEdit();
    } finally {
      setSavingCell(null);
    }
  };

  const renderEditableValue = (nota, field, label, value, options = {}) => {
    const cellKey = `${nota.id}:${field}`;
    const isEditing = editingCell === cellKey;
    const isSaving = savingCell === cellKey;
    const displayValue = options.format ? options.format(value) : (value || '-');
    const copyValue = options.copyValue ? options.copyValue(value) : displayValue;

    if (isEditing) {
      return (
        <TextField
          autoFocus
          size="small"
          type="text"
          label={label}
          value={editingValue}
          disabled={isSaving}
          onChange={(event) => {
            if (options.mask === 'date') setEditingValue(maskDateInput(event.target.value));
            else if (options.mask === 'invoice') setEditingValue(String(event.target.value || '').replace(/\D/g, '').slice(0, 9));
            else setEditingValue(event.target.value);
          }}
          onBlur={() => commitInlineEdit(nota, field)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitInlineEdit(nota, field);
            if (event.key === 'Escape') cancelInlineEdit();
          }}
          fullWidth
          placeholder={options.mask === 'date' ? 'dd/mm/aaaa' : options.placeholder}
          helperText={isSaving ? 'Salvando...' : undefined}
          slotProps={options.mask === 'date'
            ? { htmlInput: { inputMode: 'numeric', maxLength: 10 } }
            : options.mask === 'invoice'
              ? { htmlInput: { inputMode: 'numeric', maxLength: 9 } }
              : options.inputMode
                ? { htmlInput: { inputMode: options.inputMode } }
                : undefined}
        />
      );
    }

    return (
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
        <Box
          role="button"
          tabIndex={0}
          onClick={() => !isSaving && beginInlineEdit(nota, field, value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !isSaving) beginInlineEdit(nota, field, value);
          }}
          sx={{
            minHeight: 28,
            flex: 1,
            minWidth: 0,
            cursor: 'text',
            borderBottom: '1px dashed',
            borderColor: 'divider',
            '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
          }}
        >
          {options.render ? options.render(displayValue) : (
            <Typography variant={options.variant || 'body2'} fontWeight={options.fontWeight || 700} noWrap title={String(displayValue)}>
              {displayValue}
            </Typography>
          )}
        </Box>
        {isSaving && <Chip size="small" variant="outlined" label="Salvando" sx={{ height: 22 }} />}
        <Tooltip title={`Copiar ${label}`}>
          <IconButton size="small" disabled={isSaving} onClick={(event) => { event.stopPropagation(); copiarCampo(label, copyValue); }} aria-label={`Copiar ${label}`}>
            <ContentCopyOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  };

  const renderTimelineMetadata = (evento) => {
    const alterados = evento?.metadata?.campos_alterados;

    if (Array.isArray(alterados) && alterados.length > 0) {
      return (
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {alterados.slice(0, 6).map((item) => (
            <Typography key={`${evento.id}-${item.campo}`} variant="caption" color="text.secondary">
              <Box component="strong" sx={{ color: 'text.primary' }}>{item.campo}</Box>: {String(item.antes ?? '-')} {'->'} {String(item.depois ?? '-')}
            </Typography>
          ))}
          {alterados.length > 6 && (
            <Typography variant="caption" color="text.secondary">
              +{alterados.length - 6} alteracao(oes)
            </Typography>
          )}
        </Stack>
      );
    }

    if (evento?.tipo === 'email' && evento?.metadata?.destinatario) {
      return (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Para: {evento.metadata.destinatario}
        </Typography>
      );
    }

    return null;
  };

  const renderActions = (nota) => (
    <Stack spacing={0.75}>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      {getNotaGroup(nota) === 'pendente' && (
        <Button size="small" variant="contained" endIcon={<ChevronRightIcon />} onClick={() => iniciarLancamento(nota)} sx={{ flex: '1 1 120px', whiteSpace: 'nowrap' }}>
          Preparar
        </Button>
      )}
      {getNotaGroup(nota) === 'em_andamento' && (
        <>
          {isGopaFunc(nota) ? (
            <Button size="small" variant="contained" startIcon={<EmailOutlinedIcon />} onClick={() => onEnviarEmailGopa(nota)} sx={{ flex: '1 1 140px', whiteSpace: 'nowrap' }}>
              Enviar GOPA
            </Button>
          ) : (
            <Button size="small" variant="contained" endIcon={<ChevronRightIcon />} onClick={() => prosseguirLancamento(nota)} sx={{ flex: '1 1 120px', whiteSpace: 'nowrap' }}>
              Prosseguir
            </Button>
          )}
          <Button size="small" color="error" variant="outlined" onClick={() => onEtapaChange(nota.id, 'contingencia', 'Aguardando Contingência Gerente')} sx={{ flex: '1 1 100px', whiteSpace: 'nowrap' }}>
            Sem saldo
          </Button>
        </>
      )}
      {getNotaGroup(nota) === 'contingencia' && nota.status_pagamento !== 'Aguardando Contingência Head' && (
        <Button size="small" color="error" variant="contained" onClick={() => onStatusChange(nota.id, 'Aguardando Contingência Head')} sx={{ flex: '1 1 120px', whiteSpace: 'nowrap' }}>
          Enviar Head
        </Button>
      )}
      {getNotaGroup(nota) === 'em_analise' && (
        <Button size="small" color="success" variant="contained" onClick={() => onEtapaChange(nota.id, 'concluida', 'Concluída')} sx={{ flex: '1 1 120px', whiteSpace: 'nowrap' }}>
          Concluir
        </Button>
      )}
      </Stack>
      <Stack direction="row" justifyContent="flex-end" spacing={0.25} flexWrap="wrap" useFlexGap>
      <Tooltip title="Copiar Protheus">
        <IconButton size="small" onClick={() => onCopiarProtheus(nota)} aria-label="Copiar Protheus">
          <ContentCopyOutlinedIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Ver linha do tempo">
        <IconButton size="small" onClick={() => openTimeline(nota)} aria-label="Ver linha do tempo">
          <HistoryOutlinedIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={nota.contrato_id ? 'Notas do contrato' : 'Nota sem contrato vinculado'}>
        <span>
          <IconButton size="small" onClick={() => openNotasContrato(nota)} disabled={!nota.contrato_id} aria-label="Notas do contrato">
            <ReceiptLongOutlinedIcon />
          </IconButton>
        </span>
      </Tooltip>
      {isGopaFunc(nota) && (
        <Tooltip title="Enviar para GOPA">
          <IconButton size="small" onClick={() => onEnviarEmailGopa(nota)} aria-label="Enviar email">
            <EmailOutlinedIcon />
          </IconButton>
        </Tooltip>
      )}
      {nota.arquivo_nota && (
        <Tooltip title="Baixar nota">
          <IconButton size="small" onClick={() => onDownload(nota.arquivo_nota)} aria-label="Baixar nota">
            <DescriptionOutlinedIcon />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Editar">
        <IconButton size="small" onClick={() => onEditar(nota)} aria-label="Editar nota">
          <EditOutlinedIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Duplicar">
        <IconButton size="small" onClick={() => onDuplicar(nota)} aria-label="Duplicar nota">
          <FileCopyOutlinedIcon />
        </IconButton>
      </Tooltip>
    </Stack>
    </Stack>
  );

  const renderGridCard = (nota) => {
    const notaGroup = getNotaGroup(nota);
    const fornecedor = nota.nome_fornecedor || nota.fornecedor?.nome_empresa || 'Fornecedor não informado';
    const valorReal = parseFloat(nota.valor || 0);
    const valorPrevisto = nota.valor_previsto ? parseFloat(nota.valor_previsto) : null;
    const variacao = valorPrevisto !== null ? valorReal - valorPrevisto : 0;
    const statusTone = STATUS_COLOR[nota.status_pagamento] || 'primary';
    const borderColor = statusTone === 'default' ? 'divider' : `${statusTone}.main`;
    const anexosAbertos = Boolean(expandedAttachments[nota.id]);
    const totalAnexos = Number(Boolean(nota.arquivo_nota)) + Number(Boolean(nota.arquivo_boleto));
    const dueSignal = notaGroup === 'concluida' ? null : getDueSignal(nota.data_vencimento);
    const dueSignalStyle = dueSignal ? DUE_SIGNAL_STYLE[dueSignal.color] : null;
    const boletoKey = String(nota.boleto_grupo || '').trim().toLowerCase();
    const boletoResumoLocal = boletoKey ? boletoResumoPorGrupo[boletoKey] : null;
    const boletoResumoApi = nota.boleto_resumo ? {
      grupo: nota.boleto_resumo.grupo,
      notas: nota.boleto_resumo.notas || [],
      somaNotas: Number(nota.boleto_resumo.soma_notas || 0),
      valorBoleto: nota.boleto_resumo.valor_boleto === null || nota.boleto_resumo.valor_boleto === undefined ? null : Number(nota.boleto_resumo.valor_boleto || 0),
      diferenca: nota.boleto_resumo.diferenca === null || nota.boleto_resumo.diferenca === undefined ? null : Number(nota.boleto_resumo.diferenca || 0),
      ok: nota.boleto_resumo.ok,
    } : null;
    const boletoResumo = boletoResumoApi || boletoResumoLocal;
    const valorBoleto = boletoResumo?.valorBoleto ?? (nota.valor_boleto !== null && nota.valor_boleto !== undefined && nota.valor_boleto !== '' ? Number(nota.valor_boleto || 0) : null);
    const diferencaBoleto = boletoResumo?.diferenca ?? (valorBoleto !== null && boletoResumo ? boletoResumo.somaNotas - valorBoleto : 0);
    const boletoOk = boletoResumo?.ok ?? (valorBoleto !== null && Math.abs(diferencaBoleto) < 0.01);

    return (
      <Paper
        key={nota.id}
        variant="outlined"
        onDragEnd={handleDragEnd}
        sx={{
          p: 1.5,
          minHeight: 430,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          borderTop: '4px solid',
          borderTopColor: borderColor,
          borderColor: dueSignalStyle ? dueSignalStyle.border : 'divider',
          borderTopColor: borderColor,
          bgcolor: dueSignalStyle?.cardBg || 'background.paper',
          boxShadow: dueSignalStyle?.shadow || 'none',
          opacity: String(draggedNotaId) === String(nota.id) ? 0.55 : 1,
          transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease, transform 0.2s ease',
          '&:hover': { boxShadow: dueSignalStyle ? dueSignalStyle.shadow : '0 8px 24px rgba(0,0,0,0.08)' },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
          <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ minWidth: 0 }}>
            <Tooltip title="Arrastar nota">
              <IconButton
                size="small"
                draggable
                onDragStart={(event) => handleDragStart(event, nota)}
                onDragEnd={handleDragEnd}
                aria-label="Arrastar nota"
                sx={{ cursor: 'grab', flex: '0 0 auto', '&:active': { cursor: 'grabbing' } }}
              >
                <DragIndicatorOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={800} noWrap title={fornecedor}>
              {fornecedor}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {nota.filial?.nome_fantasia || '-'} | {nota.competencia || 'Sem competência'}
            </Typography>
          </Box>
          </Stack>
          <Stack spacing={0.75} alignItems="flex-end">
            <Chip
              size="small"
              color={STATUS_COLOR[nota.status_pagamento] || 'default'}
              label={nota.status_pagamento || 'Sem status'}
              sx={{ fontWeight: 700, maxWidth: 150 }}
            />
          </Stack>
        </Stack>

        {dueSignal && dueSignalStyle && (
          <Tooltip title={dueSignal.title}>
            <Box
              sx={{
                px: 1,
                py: 0.75,
                borderRadius: 1,
                border: '1px solid',
                borderLeft: '5px solid',
                borderColor: dueSignalStyle.border,
                bgcolor: dueSignalStyle.bg,
                color: dueSignalStyle.text,
              }}
            >
              <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                  <CalendarMonthOutlinedIcon sx={{ fontSize: 18 }} />
                  <Typography variant="caption" fontWeight={900} noWrap>
                    {dueSignal.label}
                  </Typography>
                </Stack>
                <Box
                  component="span"
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: dueSignalStyle.border,
                    boxShadow: `0 0 0 3px ${dueSignalStyle.bg}`,
                    flex: '0 0 auto',
                  }}
                />
              </Stack>
            </Box>
          </Tooltip>
        )}

        <Divider />

        {notaGroup === 'pendente' && (
          <Alert severity="warning" variant="outlined" sx={{ py: 0.25 }}>
            Revise os anexos e prepare o lançamento.
          </Alert>
        )}

        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            Nota fiscal
          </Typography>
          {renderEditableValue(nota, 'numero_nota', 'Nº nota', nota.numero_nota, {
            mask: 'invoice',
            variant: 'h6',
            fontWeight: 900,
            format: (value) => value ? `#${value}` : 'Pendente',
            copyValue: (value) => value || '-',
            render: (value) => (
              <Typography variant="h6" fontWeight={900} color="primary" noWrap title={String(value)}>
                {value}
              </Typography>
            ),
          })}
        </Box>

        <Stack direction="row" spacing={2}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Vencimento
              </Typography>
              {dueSignal && (
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: `${dueSignal.color}.main`,
                    flex: '0 0 auto',
                  }}
                />
              )}
            </Stack>
            {renderEditableValue(nota, 'data_vencimento', 'Vencimento', nota.data_vencimento ? String(nota.data_vencimento).split('T')[0] : '', {
              mask: 'date',
              format: formatDate,
            })}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              CNPJ
            </Typography>
            {renderEditableValue(nota, 'cnpj_usado', 'CNPJ', nota.cnpj_usado)}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Box sx={{ flex: '1 1 120px', minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Contrato</Typography>
            {renderEditableValue(nota, 'contrato_usado', 'Contrato', nota.contrato_usado)}
          </Box>
          <Box sx={{ flex: '1 1 160px', minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Produto Protheus</Typography>
            {renderEditableValue(nota, 'servico_protheus', 'Produto Protheus', nota.servico_protheus)}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Box sx={{ flex: '1 1 120px', minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Pedido</Typography>
            {renderEditableValue(nota, 'numero_pedido', 'Pedido', nota.numero_pedido)}
          </Box>
          <Box sx={{ flex: '1 1 120px', minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Medicao</Typography>
            {renderEditableValue(nota, 'numero_medicao', 'Medicao', nota.numero_medicao)}
          </Box>
          <Box sx={{ flex: '1 1 120px', minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Fluig</Typography>
            {renderEditableValue(nota, 'solicitacao_fluig', 'Fluig', nota.solicitacao_fluig)}
          </Box>
        </Stack>

        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            Valor
          </Typography>
          {renderEditableValue(nota, 'valor', 'Valor', nota.valor || '', {
            inputMode: 'decimal',
            placeholder: '1566,93',
            render: () => (
              <Typography variant="h6" fontWeight={900}>
                R$ {valorReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Typography>
            ),
          })}
          {valorPrevisto !== null && (
            <Typography variant="caption" color={Math.abs(variacao) > 0 ? 'warning.main' : 'text.secondary'}>
              Previsto R$ {valorPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              {Math.abs(variacao) > 0 ? ` | Variação R$ ${variacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
            </Typography>
          )}
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            Centro de custo
          </Typography>
          {renderEditableValue(nota, 'centro_custo_usado', 'Centro de custo', nota.centro_custo_usado)}
        </Box>

        {nota.boleto_grupo && (
        <Accordion disableGutters variant="outlined" sx={{ bgcolor: '#f8fafc', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.75 } }}>
            <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="space-between" sx={{ width: '100%', minWidth: 0, pr: 1 }}>
              <Typography variant="body2" fontWeight={900} noWrap>
                Nota compartilhada
              </Typography>
              {boletoResumo ? (
                <Chip
                  size="small"
                  color={boletoResumo.notas.length > 1 ? (boletoOk ? 'success' : 'warning') : 'default'}
                  label={boletoResumo.notas.length > 1 ? (boletoOk ? 'Compartilhado OK' : 'Divergencia') : 'Vinculado'}
                  sx={{ fontWeight: 800 }}
                />
              ) : (
                <Chip size="small" variant="outlined" label={nota.boleto_grupo} sx={{ fontWeight: 800, maxWidth: 140 }} />
              )}
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
          <Stack spacing={1}>
            {renderEditableValue(nota, 'boleto_grupo', 'Grupo boleto', nota.boleto_grupo, {
              placeholder: 'Ex.: ALGAR-2026-07-01',
            })}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Box sx={{ flex: '1 1 120px', minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Valor boleto</Typography>
                {renderEditableValue(nota, 'valor_boleto', 'Valor boleto', nota.valor_boleto || '', {
                  inputMode: 'decimal',
                  placeholder: '1566,93',
                  render: () => (
                    <Typography variant="body2" fontWeight={800}>
                      {valorBoleto === null ? '-' : `R$ ${valorBoleto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </Typography>
                  ),
                })}
              </Box>
              <Box sx={{ flex: '1 1 120px', minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Resumo</Typography>
                <Typography variant="body2" fontWeight={800} color={boletoResumo && valorBoleto !== null && !boletoOk ? 'warning.main' : 'text.primary'}>
                  {boletoResumo
                    ? `${boletoResumo.notas.length} nota(s) | R$ ${boletoResumo.somaNotas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'Sem grupo'}
                </Typography>
                {boletoResumo && valorBoleto !== null && !boletoOk && (
                  <Typography variant="caption" color="warning.main">
                    Dif. R$ {diferencaBoleto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Typography>
                )}
              </Box>
            </Stack>
            {boletoResumo?.notas?.length > 1 && (
              <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                NFs: {boletoResumo.notas.map((item) => item.numero_nota || `ID ${item.id}`).join(', ')}
              </Typography>
            )}
          </Stack>
          </AccordionDetails>
        </Accordion>
        )}

        <FormControl size="small" fullWidth sx={{ mt: 'auto' }}>
          <InputLabel>Etapa</InputLabel>
          <Select
            label="Etapa"
            value={notaGroup}
            onChange={(e) => {
              const group = GRID_GROUPS.find((item) => item.id === e.target.value);
              if (group) onEtapaChange(nota.id, group.id, group.targetStatus);
            }}
          >
            {GRID_GROUPS.map((group) => (
              <MenuItem key={group.id} value={group.id}>
                {group.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth sx={{ mt: 'auto' }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={nota.status_pagamento || ''}
            onChange={(e) => onStatusChange(nota.id, e.target.value)}
          >
            {statusOptionsForNota(nota).map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Paper variant="outlined" sx={{ bgcolor: '#faf9f8' }}>
          <Button
            fullWidth
            size="small"
            onClick={() => toggleAttachments(nota.id)}
            endIcon={anexosAbertos ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ justifyContent: 'space-between', px: 1.25, py: 0.75, color: 'text.primary' }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <DescriptionOutlinedIcon fontSize="small" />
              <Typography variant="body2" fontWeight={800}>Anexos</Typography>
              <Chip size="small" variant="outlined" label={totalAnexos} sx={{ height: 20, fontWeight: 800 }} />
            </Stack>
          </Button>

          {anexosAbertos && (
            <Stack spacing={1} sx={{ p: 1.25, pt: 0 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {nota.arquivo_nota && (
                  <Button size="small" variant="outlined" startIcon={<DescriptionOutlinedIcon />} onClick={() => openPreview(nota.arquivo_nota, 'Nota fiscal')}>
                    Ver nota
                  </Button>
                )}
                {nota.arquivo_boleto && (
                  <Button size="small" variant="outlined" startIcon={<DescriptionOutlinedIcon />} onClick={() => openPreview(nota.arquivo_boleto, 'Boleto')}>
                    Ver boleto
                  </Button>
                )}
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <FileDrop
                    label="Adicionar nota"
                    onFileSelect={(path) => onSalvarInline(nota, 'arquivo_nota', path)}
                    existingFile={nota.arquivo_nota}
                    metaData={{ fornecedor, nota: nota.numero_nota || `ID-${nota.id}`, vencimento: nota.data_vencimento }}
                    addToast={addToast}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <FileDrop
                    label="Adicionar boleto"
                    onFileSelect={(path) => onSalvarInline(nota, 'arquivo_boleto', path)}
                    existingFile={nota.arquivo_boleto}
                    metaData={{ fornecedor, nota: nota.numero_nota || `ID-${nota.id}`, vencimento: nota.data_vencimento }}
                    addToast={addToast}
                  />
                </Box>
              </Stack>
            </Stack>
          )}
        </Paper>

        {renderActions(nota)}
      </Paper>
    );
  };

  const resumoFornecedor = (itens) => {
    const totalValor = itens.reduce((acc, nota) => acc + Number(nota.valor || 0), 0);
    const abertas = itens.filter((nota) => getNotaGroup(nota) !== 'concluida');
    const concluidas = itens.filter((nota) => getNotaGroup(nota) === 'concluida');
    const contingencias = itens.filter((nota) => getNotaGroup(nota) === 'contingencia');
    const emAnalise = itens.filter((nota) => getNotaGroup(nota) === 'em_analise');
    const semAnexo = abertas.filter((nota) => !nota.arquivo_nota || !nota.arquivo_boleto);
    const criticas = abertas.filter((nota) => getDueSignal(nota.data_vencimento)?.color === 'error');
    const proximoVencimento = abertas
      .map((nota) => ({ nota, data: parseDateLocal(nota.data_vencimento) }))
      .filter((item) => item.data)
      .sort((a, b) => a.data - b.data)[0]?.nota;
    const score = criticas.length * 5 + contingencias.length * 4 + semAnexo.length * 2 + abertas.length;
    const tone = score >= 8 || criticas.length ? 'error' : score >= 3 || semAnexo.length ? 'warning' : 'success';

    return {
      totalValor,
      abertas,
      concluidas,
      contingencias,
      emAnalise,
      semAnexo,
      criticas,
      proximoVencimento,
      score,
      tone,
    };
  };

  const renderGroupedSupplier = (nome, itens) => {
    const resumo = resumoFornecedor(itens);
    const totalAberto = resumo.abertas.reduce((acc, nota) => acc + Number(nota.valor || 0), 0);

    return (
      <Accordion
        key={nome}
        expanded={Boolean(expandedSupplier[nome])}
        onChange={() => setExpandedSupplier((prev) => ({ ...prev, [nome]: !prev[nome] }))}
        disableGutters
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ width: '100%', minWidth: 0, pr: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              <StorageOutlinedIcon color={resumo.tone === 'error' ? 'error' : resumo.tone === 'warning' ? 'warning' : 'success'} />
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={900} noWrap title={nome}>
                  {nome}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {itens.length} notas | Aberto R$ {totalAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Total R$ {resumo.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Chip size="small" color={resumo.tone} label={resumo.tone === 'error' ? 'Crítico' : resumo.tone === 'warning' ? 'Atenção' : 'OK'} sx={{ fontWeight: 900 }} />
              {resumo.criticas.length > 0 && <Chip size="small" color="error" variant="outlined" label={`${resumo.criticas.length} venc.`} />}
              {resumo.contingencias.length > 0 && <Chip size="small" color="error" label={`${resumo.contingencias.length} cont.`} />}
              {resumo.semAnexo.length > 0 && <Chip size="small" color="warning" label={`${resumo.semAnexo.length} docs`} />}
              {resumo.emAnalise.length > 0 && <Chip size="small" color="secondary" label={`${resumo.emAnalise.length} análise`} />}
              {resumo.proximoVencimento && <Chip size="small" variant="outlined" label={`Próx. ${formatDate(resumo.proximoVencimento.data_vencimento)}`} />}
            </Stack>
          </Stack>
        </AccordionSummary>

        <AccordionDetails sx={{ bgcolor: '#faf9f8', borderTop: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={1.25} sx={{ mb: 1.5 }}>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <Paper variant="outlined" sx={{ p: 1.25 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={800}>Abertas</Typography>
                <Typography variant="h6" fontWeight={900}>{resumo.abertas.length}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <Paper variant="outlined" sx={{ p: 1.25 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={800}>Críticas</Typography>
                <Typography variant="h6" fontWeight={900} color={resumo.criticas.length ? 'error.main' : 'success.main'}>{resumo.criticas.length}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <Paper variant="outlined" sx={{ p: 1.25 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={800}>Sem docs</Typography>
                <Typography variant="h6" fontWeight={900} color={resumo.semAnexo.length ? 'warning.main' : 'success.main'}>{resumo.semAnexo.length}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <Paper variant="outlined" sx={{ p: 1.25 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={800}>Contingência</Typography>
                <Typography variant="h6" fontWeight={900} color={resumo.contingencias.length ? 'error.main' : 'success.main'}>{resumo.contingencias.length}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <Paper variant="outlined" sx={{ p: 1.25 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={800}>Concluídas</Typography>
                <Typography variant="h6" fontWeight={900} color="success.main">{resumo.concluidas.length}</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Stack spacing={1}>
            {itens
              .slice()
              .sort((a, b) => {
                const groupOrder = { contingencia: 0, pendente: 1, em_andamento: 2, em_analise: 3, concluida: 4 };
                return (groupOrder[getNotaGroup(a)] ?? 9) - (groupOrder[getNotaGroup(b)] ?? 9)
                  || (parseDateLocal(a.data_vencimento) || new Date(8640000000000000)) - (parseDateLocal(b.data_vencimento) || new Date(8640000000000000));
              })
              .map((nota) => {
                const dueSignal = getNotaGroup(nota) === 'concluida' ? null : getDueSignal(nota.data_vencimento);
                const missingDocs = !nota.arquivo_nota || !nota.arquivo_boleto;

                return (
                  <Paper key={nota.id} variant="outlined" sx={{ p: 1.5, borderLeft: '4px solid', borderLeftColor: dueSignal ? `${dueSignal.color}.main` : 'divider' }}>
                    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', lg: 'center' }}>
                      <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography variant="subtitle1" fontWeight={900}>
                            #{nota.numero_nota || 'Sem NF'}
                          </Typography>
                          <Chip size="small" variant="outlined" label={nota.filial?.nome_fantasia || '-'} />
                          <Chip size="small" color={STATUS_COLOR[nota.status_pagamento] || 'default'} label={nota.status_pagamento || 'Sem status'} sx={{ fontWeight: 700 }} />
                          {dueSignal && <Chip size="small" color={dueSignal.color} variant="outlined" label={dueSignal.label} />}
                          {missingDocs && <Chip size="small" color="warning" label={!nota.arquivo_nota && !nota.arquivo_boleto ? 'Sem anexos' : !nota.arquivo_nota ? 'Sem NF' : 'Sem boleto'} />}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Venc. {formatDate(nota.data_vencimento)} | Pedido {nota.numero_pedido || '-'} | Medicao {nota.numero_medicao || '-'} | Fluig {nota.solicitacao_fluig || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Contrato {nota.contrato_usado || '-'} | Produto Protheus {nota.servico_protheus || '-'}
                        </Typography>
                        {nota.boleto_grupo && (
                          <Typography variant="body2" color="text.secondary">
                            Boleto compartilhado {nota.boleto_grupo} | Valor boleto {nota.valor_boleto ? `R$ ${Number(nota.valor_boleto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ minWidth: 150 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>Valor</Typography>
                        <Typography variant="subtitle1" fontWeight={900} color="primary">
                          R$ {parseFloat(nota.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>

                      <Stack direction="row" justifyContent={{ xs: 'flex-start', lg: 'flex-end' }} spacing={0.5} flexWrap="wrap" useFlexGap>
                        <Tooltip title="Copiar Protheus">
                          <IconButton onClick={() => onCopiarProtheus(nota)} aria-label="Copiar Protheus">
                            <ContentCopyOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                        {isGopaFunc(nota) && (
                          <Tooltip title="Enviar para GOPA">
                            <IconButton onClick={() => onEnviarEmailGopa(nota)} aria-label="Enviar email">
                              <EmailOutlinedIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {nota.arquivo_nota && (
                          <Tooltip title="Baixar nota">
                            <IconButton onClick={() => onDownload(nota.arquivo_nota)} aria-label="Baixar nota">
                              <DescriptionOutlinedIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Editar">
                          <IconButton onClick={() => onEditar(nota)} aria-label="Editar nota">
                            <EditOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Duplicar">
                          <IconButton onClick={() => onDuplicar(nota)} aria-label="Duplicar nota">
                            <FileCopyOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
          </Stack>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <>
    <Stack spacing={2.5} sx={{ pb: 8 }}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', lg: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <IconButton onClick={onRefresh} aria-label="Atualizar lista">
              <RefreshOutlinedIcon />
            </IconButton>
            <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={handleExportarExcel}>
              Exportar
            </Button>
            <TextField
              type="month"
              size="small"
              label="Competência"
              value={competencia.toISOString().slice(0, 7)}
              onChange={handleDateChange}
              slotProps={{ input: { startAdornment: <CalendarMonthOutlinedIcon color="action" sx={{ mr: 1 }} /> } }}
            />
            <ToggleButtonGroup
              exclusive
              size="small"
              value={viewMode}
              onChange={(_, nextMode) => nextMode && setViewMode(nextMode)}
            >
              <ToggleButton value="grouped" aria-label="Visualização agrupada">
                <ViewListIcon fontSize="small" sx={{ mr: 0.75 }} />
                Agrupado
              </ToggleButton>
              <ToggleButton value="grid" aria-label="Visualização em grid">
                <ViewModuleIcon fontSize="small" sx={{ mr: 0.75 }} />
                Grid
              </ToggleButton>
            </ToggleButtonGroup>
            {viewMode === 'grouped' && (
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                <InputLabel id="group-by-label">Agrupar por</InputLabel>
                <Select
                  labelId="group-by-label"
                  value={groupBy}
                  label="Agrupar por"
                  onChange={(event) => {
                    setGroupBy(event.target.value);
                    setExpandedSupplier({});
                  }}
                >
                  {GROUP_BY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 260 } }}>
            <InputLabel id="filial-filter-label">Filial</InputLabel>
            <Select
              labelId="filial-filter-label"
              value={filialFiltro}
              label="Filial"
              onChange={(e) => setFilialFiltro(e.target.value)}
            >
              <MenuItem value="">Todas as filiais</MenuItem>
              {filiais.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.nome_fantasia}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {viewMode === 'grid' && (
        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#faf9f8' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={900}>
                Legenda de prazos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                As cores indicam prioridade de atendimento pelo vencimento da nota.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {DUE_LEGEND.map((item) => {
                const style = item.color === 'default' ? null : DUE_SIGNAL_STYLE[item.color];

                return (
                  <Tooltip key={item.title} title={item.description}>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      sx={{
                        px: 1,
                        py: 0.75,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: style?.border || 'divider',
                        bgcolor: style?.bg || 'background.paper',
                        color: style?.text || 'text.secondary',
                      }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: style?.border || 'text.disabled',
                          flex: '0 0 auto',
                        }}
                      />
                      <Typography variant="caption" fontWeight={900}>
                        {item.title}
                      </Typography>
                    </Stack>
                  </Tooltip>
                );
              })}
            </Stack>
          </Stack>
        </Paper>
      )}

      {dadosAgrupados.length === 0 ? (
        <Alert icon={<FilterAltOutlinedIcon />} severity="info" variant="outlined">
          Nenhuma nota encontrada com os filtros atuais.
        </Alert>
      ) : viewMode === 'grid' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, minmax(280px, 1fr))',
              xl: 'repeat(5, minmax(240px, 1fr))',
            },
            gap: 1.5,
            alignItems: 'start',
          }}
        >
          {GRID_GROUPS.map((group) => {
            const notasDoGrupo = notasFiltradas.filter((nota) => getNotaGroup(nota) === group.id);
            const notasPorFornecedor = agruparPorFornecedor(notasDoGrupo);
            const groupCollapsed = Boolean(collapsedGroups[group.id]);

            return (
              <Paper
                key={group.id}
                variant="outlined"
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(event) => handleDropOnGroup(event, group)}
                sx={{
                  p: 1.5,
                  minHeight: groupCollapsed ? 92 : 360,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.25,
                  bgcolor: draggedNotaId ? 'rgba(0, 120, 212, 0.06)' : '#faf9f8',
                  borderTop: '4px solid',
                  borderTopColor: `${group.color}.main`,
                  transition: 'background-color 0.2s ease, border-color 0.2s ease',
                  outline: draggedNotaId ? '2px dashed rgba(0, 120, 212, 0.32)' : 'none',
                  outlineOffset: -6,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="space-between"
                  spacing={1}
                  sx={{
                    position: 'sticky',
                    top: { xs: 8, md: 12 },
                    zIndex: 3,
                    mx: -1.5,
                    mt: -1.5,
                    px: 1.5,
                    pt: 1.5,
                    pb: 1,
                    bgcolor: draggedNotaId ? 'rgba(239, 246, 255, 0.98)' : 'rgba(250, 249, 248, 0.98)',
                    borderBottom: '1px solid',
                    borderColor: draggedNotaId ? 'primary.light' : 'divider',
                    boxShadow: draggedNotaId ? '0 6px 14px rgba(0,0,0,0.08)' : '0 4px 10px rgba(0,0,0,0.04)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={900}>
                      {group.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notasDoGrupo.length} notas
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Arraste pelo icone e solte aqui para marcar como {group.targetStatus}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Chip size="small" color={group.color} label={notasDoGrupo.length} sx={{ fontWeight: 800 }} />
                    <Tooltip title={groupCollapsed ? 'Exibir coluna' : 'Encolher coluna'}>
                      <IconButton size="small" onClick={() => toggleGroupCollapsed(group.id)}>
                        {groupCollapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                {!groupCollapsed && (
                <Stack spacing={1.25}>
                  {notasPorFornecedor.map(([fornecedor, notasFornecedor]) => (
                    <Box key={fornecedor}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                        sx={{ px: 0.5, mb: 0.75 }}
                      >
                        <Typography variant="caption" fontWeight={900} noWrap title={fornecedor} color="text.secondary">
                          {fornecedor}
                        </Typography>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Chip size="small" variant="outlined" label={notasFornecedor.length} sx={{ height: 22, fontWeight: 800 }} />
                          <Tooltip title={collapsedGridSuppliers[`${group.id}::${fornecedor}`] ? 'Exibir fornecedor' : 'Encolher fornecedor'}>
                            <IconButton size="small" onClick={() => toggleGridSupplierCollapsed(group.id, fornecedor)}>
                              {collapsedGridSuppliers[`${group.id}::${fornecedor}`] ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                      {!collapsedGridSuppliers[`${group.id}::${fornecedor}`] && (
                        <Stack spacing={1}>{notasFornecedor.map((nota) => renderGridCard(nota))}</Stack>
                      )}
                    </Box>
                  ))}
                  {notasDoGrupo.length === 0 && (
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper', borderStyle: 'dashed' }}>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Sem notas
                      </Typography>
                    </Paper>
                  )}
                </Stack>
                )}
              </Paper>
            );
          })}
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {dadosAgrupados
            .map(([nome, itens]) => ({ nome, itens, resumo: resumoFornecedor(itens) }))
            .sort((a, b) => b.resumo.score - a.resumo.score || a.nome.localeCompare(b.nome))
            .map(({ nome, itens }) => renderGroupedSupplier(nome, itens))}
        </Stack>
      )}
    </Stack>
    <Dialog open={Boolean(timelineNota)} onClose={() => setTimelineNota(null)} fullWidth maxWidth="md">
      <DialogTitle>
        Linha do tempo {timelineNota?.numero_nota ? `- NF ${timelineNota.numero_nota}` : ''}
      </DialogTitle>
      <DialogContent dividers>
        {timelineLoading ? (
          <Typography variant="body2" color="text.secondary">
            Carregando eventos...
          </Typography>
        ) : timelineEventos.length === 0 ? (
          <Alert severity="info" variant="outlined">
            Nenhum evento registrado para esta nota ainda.
          </Alert>
        ) : (
          <Stack spacing={1.5}>
            {timelineEventos.map((evento, index) => (
              <Stack key={evento.id} direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    width: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: '0 0 auto',
                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: evento.tipo === 'email' || evento.tipo === 'feedback_email' ? 'secondary.main' : 'primary.main',
                      mt: 0.75,
                    }}
                  />
                  {index < timelineEventos.length - 1 && (
                    <Box sx={{ width: 2, flex: 1, minHeight: 58, bgcolor: 'divider', mt: 0.5 }} />
                  )}
                </Box>
                <Paper variant="outlined" sx={{ p: 1.5, flex: 1, bgcolor: '#faf9f8' }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={900}>
                        {evento.titulo}
                      </Typography>
                      {evento.descricao && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, whiteSpace: 'pre-line' }}>
                          {evento.descricao}
                        </Typography>
                      )}
                    </Box>
                    <Chip size="small" variant="outlined" label={evento.origem || evento.tipo} sx={{ fontWeight: 800 }} />
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(evento.created_at)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Por: {evento.ator_nome || 'Sistema'}
                    </Typography>
                  </Stack>
                  {renderTimelineMetadata(evento)}
                </Paper>
              </Stack>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
    <Drawer
      anchor="right"
      open={Boolean(contratoHistoricoNota)}
      onClose={() => setContratoHistoricoNota(null)}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 520, md: 640 },
          maxWidth: '100%',
        },
      }}
    >
      <Stack spacing={2} sx={{ p: 2.5, height: '100%', overflow: 'auto' }}>
        <Box>
          <Typography variant="overline" color="text.secondary" fontWeight={900}>
            Notas do contrato
          </Typography>
          <Typography variant="h6" fontWeight={900}>
            Contrato {contratoHistoricoNota?.contrato_usado || '-'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {contratoHistoricoNota?.descricao_servico || contratoHistoricoNota?.servico_protheus || 'Historico financeiro vinculado ao contrato cadastrado.'}
          </Typography>
        </Box>

        <Divider />

        {contratoHistoricoLoading ? (
          <Alert severity="info" variant="outlined">Carregando notas do contrato...</Alert>
        ) : contratoHistoricoLancamentos.length === 0 ? (
          <Alert severity="info" variant="outlined">Nenhuma nota vinculada a este contrato.</Alert>
        ) : (
          <Stack spacing={1.25}>
            {contratoHistoricoLancamentos.map((lancamento) => {
              const isAtual = String(lancamento.id) === String(contratoHistoricoNota?.id);
              return (
                <Paper
                  key={lancamento.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderLeft: '4px solid',
                    borderLeftColor: isAtual ? 'primary.main' : 'divider',
                    bgcolor: isAtual ? 'rgba(0, 120, 212, 0.06)' : 'background.paper',
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={900}>
                          {lancamento.competencia || 'Sem competencia'} {isAtual ? '(nota atual)' : ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          NF {lancamento.numero_nota || '-'} | Venc. {formatDate(lancamento.data_vencimento)}
                        </Typography>
                      </Box>
                      <Chip size="small" color={STATUS_COLOR[lancamento.status_pagamento] || 'default'} label={lancamento.status_pagamento || 'Sem status'} sx={{ fontWeight: 800 }} />
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip size="small" variant="outlined" label={lancamento.filial?.nome_fantasia || lancamento.filial_id || 'Sem filial'} />
                      <Chip size="small" variant="outlined" label={`R$ ${Number(lancamento.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                      {lancamento.numero_pedido && <Chip size="small" variant="outlined" label={`Pedido ${lancamento.numero_pedido}`} />}
                      {lancamento.numero_medicao && <Chip size="small" variant="outlined" label={`Medicao ${lancamento.numero_medicao}`} />}
                    </Stack>

                    <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                      {lancamento.arquivo_nota && (
                        <Tooltip title="Baixar nota">
                          <IconButton size="small" onClick={() => onDownload(lancamento.arquivo_nota)} aria-label="Baixar nota do contrato">
                            <DescriptionOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Editar nota">
                        <IconButton size="small" onClick={() => { setContratoHistoricoNota(null); onEditar(lancamento); }} aria-label="Editar nota do contrato">
                          <EditOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Drawer>
    <Dialog open={Boolean(previewFile)} onClose={() => setPreviewFile(null)} fullWidth maxWidth="lg">
      <DialogTitle>{previewFile?.title || 'Arquivo'}</DialogTitle>
      <DialogContent dividers sx={{ height: '78vh', p: 0 }}>
        {previewFile?.url && /\.(png|jpe?g|webp)$/i.test(previewFile.url.split('?')[0]) ? (
          <Box
            component="img"
            src={previewFile.url}
            alt={previewFile.title || 'Arquivo'}
            sx={{ width: '100%', height: '100%', objectFit: 'contain', bgcolor: '#111827' }}
          />
        ) : (
          <Box
            component="iframe"
            src={previewFile?.url || ''}
            title={previewFile?.title || 'Arquivo'}
            sx={{ width: '100%', height: '100%', border: 0 }}
          />
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}

import React, { useState } from 'react';
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
  FormControl,
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
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
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
  'Aguardando Confirmação Refresa': 'secondary',
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
  em_analise: ['Aguardando Aprovação Fluig', 'Aguardando Confirmação Refresa'],
  contingencia: ['Aguardando Contingência Gerente', 'Aguardando Contingência Head'],
  concluida: ['Concluída', 'Cancelada'],
};

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
    return { color: 'error', label: `Vencida há ${Math.abs(daysUntilDue)}d` };
  }
  if (daysUntilDue === 0) {
    return { color: 'error', label: 'Vence hoje' };
  }
  if (daysUntilDue <= 10) {
    return { color: 'error', label: `Vence em ${daysUntilDue}d` };
  }
  if (daysUntilDue <= 12) {
    return { color: 'warning', label: `Atenção ${daysUntilDue}d` };
  }
  return { color: 'success', label: `Folga ${daysUntilDue}d` };
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
  const [draggedNotaId, setDraggedNotaId] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [collapsedGridSuppliers, setCollapsedGridSuppliers] = useState({});
  const [expandedAttachments, setExpandedAttachments] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [previewFile, setPreviewFile] = useState(null);

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

  const notasFiltradas = notas.filter((n) => {
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
  });

  const dadosAgrupados = Object.entries(
    notasFiltradas.reduce((grupos, nota) => {
      const nome = nota.nome_fornecedor || nota.fornecedor?.nome_empresa || 'Fornecedor não informado';
      grupos[nome] = grupos[nome] || [];
      grupos[nome].push(nota);
      return grupos;
    }, {})
  ).sort((a, b) => a[0].localeCompare(b[0]));

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
    (isGopaFunc(nota) || nota.solicitacao_fluig)
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

  const beginInlineEdit = (nota, field, value) => {
    setEditingCell(`${nota.id}:${field}`);
    setEditingValue(field === 'data_vencimento' ? formatDateForInput(value) : (value ?? ''));
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const commitInlineEdit = async (nota, field) => {
    const original = nota[field] ?? '';
    if (String(original) !== String(editingValue)) {
      await onSalvarInline({ ...nota, [field]: editingValue });
    }
    cancelInlineEdit();
  };

  const renderEditableValue = (nota, field, label, value, options = {}) => {
    const cellKey = `${nota.id}:${field}`;
    const isEditing = editingCell === cellKey;
    const displayValue = options.format ? options.format(value) : (value || '-');

    if (isEditing) {
      return (
        <TextField
          autoFocus
          size="small"
          type="text"
          label={label}
          value={editingValue}
          onChange={(event) => setEditingValue(options.mask === 'date' ? maskDateInput(event.target.value) : event.target.value)}
          onBlur={() => commitInlineEdit(nota, field)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitInlineEdit(nota, field);
            if (event.key === 'Escape') cancelInlineEdit();
          }}
          fullWidth
          placeholder={options.mask === 'date' ? 'dd/mm/aaaa' : undefined}
          inputProps={options.mask === 'date' ? { inputMode: 'numeric', maxLength: 10 } : undefined}
        />
      );
    }

    return (
      <Box
        role="button"
        tabIndex={0}
        onClick={() => beginInlineEdit(nota, field, value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') beginInlineEdit(nota, field, value);
        }}
        sx={{
          minHeight: 28,
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
    );
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
          <Button size="small" variant="contained" endIcon={<ChevronRightIcon />} onClick={() => prosseguirLancamento(nota)} sx={{ flex: '1 1 120px', whiteSpace: 'nowrap' }}>
            Prosseguir
          </Button>
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
      {isGopaFunc(nota) && (
        <Tooltip title="Enviar email">
          <IconButton size="small" onClick={() => onEnviarEmail(nota)} aria-label="Enviar email">
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
    const fornecedor = nota.nome_fornecedor || nota.fornecedor?.nome_empresa || 'Fornecedor não informado';
    const valorReal = parseFloat(nota.valor || 0);
    const valorPrevisto = nota.valor_previsto ? parseFloat(nota.valor_previsto) : null;
    const variacao = valorPrevisto !== null ? valorReal - valorPrevisto : 0;
    const statusTone = STATUS_COLOR[nota.status_pagamento] || 'primary';
    const borderColor = statusTone === 'default' ? 'divider' : `${statusTone}.main`;
    const anexosAbertos = Boolean(expandedAttachments[nota.id]);
    const totalAnexos = Number(Boolean(nota.arquivo_nota)) + Number(Boolean(nota.arquivo_boleto));
    const dueSignal = getDueSignal(nota.data_vencimento);

    return (
      <Paper
        key={nota.id}
        variant="outlined"
        draggable
        onDragStart={(event) => handleDragStart(event, nota)}
        onDragEnd={handleDragEnd}
        sx={{
          p: 1.5,
          minHeight: 336,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          borderTop: '4px solid',
          borderTopColor: borderColor,
          bgcolor: 'background.paper',
          cursor: 'grab',
          opacity: String(draggedNotaId) === String(nota.id) ? 0.55 : 1,
          transition: 'box-shadow 0.2s ease, opacity 0.2s ease, transform 0.2s ease',
          '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={800} noWrap title={fornecedor}>
              {fornecedor}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {nota.filial?.nome_fantasia || '-'} | {nota.competencia || 'Sem competência'}
            </Typography>
          </Box>
          <Stack spacing={0.75} alignItems="flex-end">
            <Chip
              size="small"
              color={STATUS_COLOR[nota.status_pagamento] || 'default'}
              label={nota.status_pagamento || 'Sem status'}
              sx={{ fontWeight: 700, maxWidth: 150 }}
            />
            {dueSignal && (
              <Chip
                size="small"
                color={dueSignal.color}
                label={dueSignal.label}
                variant="outlined"
                sx={{ height: 22, fontWeight: 800, bgcolor: 'background.paper' }}
              />
            )}
          </Stack>
        </Stack>

        <Divider />

        {getNotaGroup(nota) === 'pendente' && (
          <Alert severity="warning" variant="outlined" sx={{ py: 0.25 }}>
            Revise os anexos e prepare o lançamento.
          </Alert>
        )}

        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            Nota fiscal
          </Typography>
          {renderEditableValue(nota, 'numero_nota', 'Nº nota', nota.numero_nota, {
            variant: 'h6',
            fontWeight: 900,
            format: (value) => value ? `#${value}` : 'Pendente',
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
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Pedido</Typography>
            {renderEditableValue(nota, 'numero_pedido', 'Pedido', nota.numero_pedido)}
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
            type: 'number',
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

        <FormControl size="small" fullWidth sx={{ mt: 'auto' }}>
          <Select
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
                    onFileSelect={(path) => onSalvarInline({ ...nota, arquivo_nota: path })}
                    existingFile={nota.arquivo_nota}
                    metaData={{ fornecedor, nota: nota.numero_nota || `ID-${nota.id}`, vencimento: nota.data_vencimento }}
                    addToast={addToast}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <FileDrop
                    label="Adicionar boleto"
                    onFileSelect={(path) => onSalvarInline({ ...nota, arquivo_boleto: path })}
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
              InputProps={{ startAdornment: <CalendarMonthOutlinedIcon color="action" sx={{ mr: 1 }} /> }}
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
                }}
              >
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={900}>
                      {group.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notasDoGrupo.length} notas
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Solte aqui para marcar como {group.targetStatus}
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
          {dadosAgrupados.map(([nome, itens]) => {
            const totalGrupo = itens.reduce((acc, nota) => acc + parseFloat(nota.valor || 0), 0);

            return (
              <Accordion
                key={nome}
                expanded={Boolean(expandedSupplier[nome])}
                onChange={() => setExpandedSupplier((prev) => ({ ...prev, [nome]: !prev[nome] }))}
                disableGutters
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                    <StorageOutlinedIcon color="primary" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>
                        {nome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {itens.length} notas | Total R$ {totalGrupo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: '#faf9f8', borderTop: '1px solid', borderColor: 'divider' }}>
                  <Stack spacing={1.25}>
                    {itens.map((nota) => (
                      <Paper key={nota.id} variant="outlined" sx={{ p: 2 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                          <Box sx={{ flex: 1, minWidth: 220 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Typography variant="h6" fontWeight={800}>
                                #{nota.numero_nota}
                              </Typography>
                              <Chip size="small" variant="outlined" label={nota.filial?.nome_fantasia || '-'} />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              CNPJ: {nota.cnpj_usado || '-'} | Vencimento:{' '}
                              {nota.data_vencimento ? nota.data_vencimento.split('-').reverse().join('/') : '-'}
                            </Typography>
                          </Box>

                          <Box sx={{ minWidth: 180, textAlign: { xs: 'left', md: 'center' } }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>
                              Valor líquido
                            </Typography>
                            <Typography variant="h6" color="primary" fontWeight={800}>
                              R$ {parseFloat(nota.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </Typography>
                          </Box>

                          <FormControl size="small" sx={{ minWidth: 190 }}>
                            <Select
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

                          <Chip
                            size="small"
                            color={STATUS_COLOR[nota.status_pagamento] || 'default'}
                            label={nota.status_pagamento || 'Sem status'}
                            sx={{ display: { xs: 'none', lg: 'inline-flex' }, fontWeight: 700 }}
                          />

                          <Stack direction="row" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} spacing={0.5}>
                            <Tooltip title="Copiar Protheus">
                              <IconButton onClick={() => onCopiarProtheus(nota)} aria-label="Copiar Protheus">
                                <ContentCopyOutlinedIcon />
                              </IconButton>
                            </Tooltip>
                            {isGopaFunc(nota) && (
                              <Tooltip title="Enviar email">
                                <IconButton onClick={() => onEnviarEmail(nota)} aria-label="Enviar email">
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
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      )}
    </Stack>
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

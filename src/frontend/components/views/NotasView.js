import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
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
} from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import { OPCOES_STATUS } from '@/frontend/utils/constants';

const STATUS_COLOR = {
  'Pendente Nota': 'warning',
  'Nota Recebida': 'info',
  'Pendente Lançamento': 'warning',
  Pendente: 'warning',
  'Em andamento': 'info',
  'Em Andamento': 'info',
  Concluida: 'success',
  Concluída: 'success',
  Divergência: 'error',
  Pago: 'success',
  Cancelada: 'error',
  Rejeitado: 'error',
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
  isGopaFunc,
  busca,
  onRefresh,
}) {
  const [expandedSupplier, setExpandedSupplier] = useState({});

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

  return (
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
                              {OPCOES_STATUS.map((status) => (
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
  );
}

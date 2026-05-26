import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Pagination,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';

const ITENS_POR_PAGINA = 9;
const ABAS_FILTRO = ['Todos', 'Pendente', 'Em Andamento', 'Aprovado', 'Concluido'];

const STATUS_META = {
  Pendente: { color: 'warning', label: 'Pendente' },
  'Em Andamento': { color: 'info', label: 'Em andamento' },
  Aprovado: { color: 'success', label: 'Aprovado' },
  Rejeitado: { color: 'error', label: 'Rejeitado' },
  Concluido: { color: 'default', label: 'Concluido' },
};

export default function SolicitacoesView({
  solicitacoes,
  onNovaSolicitacao,
  onEditarSolicitacao,
  busca,
}) {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [statusAtivo, setStatusAtivo] = useState('Todos');
  const [ultimaBusca, setUltimaBusca] = useState(busca);

  if (busca !== ultimaBusca) {
    setPaginaAtual(1);
    setUltimaBusca(busca);
  }

  const handleStatusChange = (_, novoStatus) => {
    if (!novoStatus) return;
    setStatusAtivo(novoStatus);
    setPaginaAtual(1);
  };

  const dadosFiltrados = solicitacoes.filter((item) => {
    if (statusAtivo !== 'Todos' && item.status !== statusAtivo) return false;
    if (!busca) return true;

    const termo = busca.toLowerCase();
    const valorFormatado = item.valor
      ? parseFloat(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      : '';
    const valorLimpo = valorFormatado.replace(/\./g, '');

    return [
      item.id,
      item.fluig_id,
      item.numero_sc,
      item.numero_pedido,
      item.solicitante,
      item.servico,
      item.status,
      item.fornecedor?.nome_empresa,
      item.filial?.nome_fantasia,
      item.filial?.codigo,
      valorFormatado,
      valorLimpo,
    ]
      .join(' ')
      .toLowerCase()
      .includes(termo);
  });

  const totalItens = dadosFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / ITENS_POR_PAGINA));
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const fim = inicio + ITENS_POR_PAGINA;
  const dadosPaginados = dadosFiltrados.slice(inicio, fim);

  return (
    <Stack spacing={2.5} sx={{ pb: 5 }}>
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
          spacing={2}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <AssignmentOutlinedIcon color="primary" />
              <Typography variant="h5" fontWeight={700}>
                Solicitações de compra
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Pedidos, SCs e aprovações do Fluig
            </Typography>
          </Box>

          <Button variant="contained" startIcon={<AddIcon />} onClick={onNovaSolicitacao}>
            Nova solicitação
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <ToggleButtonGroup
          exclusive
          value={statusAtivo}
          onChange={handleStatusChange}
          size="small"
          sx={{ flexWrap: 'wrap', gap: 1 }}
        >
          {ABAS_FILTRO.map((status) => (
            <ToggleButton key={status} value={status} sx={{ border: '1px solid', borderColor: 'divider' }}>
              {status}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Paper>

      {dadosPaginados.length === 0 ? (
        <Alert icon={<FilterAltOutlinedIcon />} severity="info" variant="outlined">
          Nenhuma solicitação encontrada.
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {dadosPaginados.map((item) => {
            const status = STATUS_META[item.status] || STATUS_META.Pendente;

            return (
              <Paper
                key={item.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderLeft: '4px solid',
                  borderLeftColor: 'primary.main',
                  transition: 'box-shadow 160ms ease, border-color 160ms ease',
                  '&:hover': { boxShadow: '0 8px 22px rgba(0, 0, 0, 0.08)' },
                }}
              >
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  alignItems={{ xs: 'stretch', md: 'center' }}
                  spacing={2}
                >
                  <Box sx={{ minWidth: { md: 170 } }}>
                    <Chip size="small" color={status.color} label={status.label} sx={{ fontWeight: 700 }} />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      ID #{item.id}{item.fluig_id ? ` | Fluig ${item.fluig_id}` : ''}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="subtitle1" fontWeight={700} noWrap>
                        {item.fornecedor?.nome_empresa || 'Fornecedor não informado'}
                      </Typography>
                      <Chip size="small" variant="outlined" label={item.filial?.codigo || '?'} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                      {item.servico || 'Sem descrição'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
                      SC: {item.numero_sc || '-'} | Solicitante: {item.solicitante || '-'}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: { md: 170 } }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      Valor estimado
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      R$ {parseFloat(item.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>

                  <IconButton color="primary" onClick={() => onEditarSolicitacao(item)} aria-label="Editar solicitação">
                    <EditOutlinedIcon />
                  </IconButton>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {totalItens > 0 && (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              Mostrando {inicio + 1} a {Math.min(fim, totalItens)} de {totalItens} resultados
            </Typography>
            <Pagination
              color="primary"
              count={totalPaginas}
              page={paginaAtual}
              onChange={(_, page) => setPaginaAtual(page)}
              shape="rounded"
            />
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

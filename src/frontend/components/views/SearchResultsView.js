import React from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';

const statusColor = (status) => {
  if (status === 'Concluída' || status === 'Concluida') return 'success';
  if (status === 'Cancelada') return 'default';
  if (status === 'Pendente Lançamento') return 'warning';
  return 'info';
};

export default function SearchResultsView({ termoBusca, carregando, resultados, onEditar }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, minHeight: 420 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2.5 }}>
        <SearchIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          Resultados: &quot;{termoBusca}&quot;
        </Typography>
      </Stack>

      {carregando ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : resultados.length === 0 ? (
        <Alert severity="info" variant="outlined">Nada encontrado.</Alert>
      ) : (
        <Stack spacing={1.25}>
          {resultados.map((nota) => (
            <Paper key={nota.id} variant="outlined" sx={{ p: 2, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} spacing={2}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="subtitle1" fontWeight={800} noWrap>
                      {nota.fornecedor?.nome_empresa || nota.nome_fornecedor || 'Fornecedor não informado'}
                    </Typography>
                    <Chip size="small" variant="outlined" label={nota.filial?.nome_fantasia || '-'} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    NF: {nota.numero_nota || '-'} | Pedido: {nota.numero_pedido || '-'} | Vencimento:{' '}
                    {nota.data_vencimento ? nota.data_vencimento.split('T')[0].split('-').reverse().join('/') : '-'}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: 180 }}>
                  <Typography variant="h6" color="primary" fontWeight={800}>
                    R$ {Number(nota.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Chip size="small" color={statusColor(nota.status_pagamento)} label={nota.status_pagamento || 'Sem status'} />
                </Box>

                <IconButton color="primary" onClick={() => onEditar(nota)} aria-label="Editar nota">
                  <EditOutlinedIcon />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

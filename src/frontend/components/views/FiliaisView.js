import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';

export default function FiliaisView({ filiais, onSalvar, onExcluir }) {
  const [showModal, setShowModal] = useState(false);
  const [termo, setTermo] = useState('');
  const [form, setForm] = useState({ id: null, codigo: '', nome_fantasia: '' });

  const dadosFiltrados = filiais.filter((filial) =>
    `${filial.nome_fantasia} ${filial.codigo}`.toLowerCase().includes(termo.toLowerCase())
  );

  const abrirNovo = () => {
    setForm({ id: null, codigo: '', nome_fantasia: '' });
    setShowModal(true);
  };

  const abrirEdicao = (item) => {
    setForm({ ...item });
    setShowModal(true);
  };

  const handleSalvar = () => {
    if (!form.codigo || !form.nome_fantasia) return alert('Preencha todos os campos');
    onSalvar(form);
    setShowModal(false);
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <BusinessOutlinedIcon color="primary" />
              <Typography variant="h5" fontWeight={700}>Filiais</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Unidades cadastradas para lançamento e controle
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Buscar filial"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
              Nova filial
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 140 }}>Código</TableCell>
              <TableCell>Nome fantasia</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dadosFiltrados.map((filial) => (
              <TableRow key={filial.id} hover>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>{filial.codigo}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{filial.nome_fantasia}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => abrirEdicao(filial)} aria-label="Editar filial">
                    <EditOutlinedIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => onExcluir(filial)} aria-label="Excluir filial">
                    <DeleteOutlinedIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {dadosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Nenhuma filial encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showModal} onClose={() => setShowModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>{form.id ? 'Editar filial' : 'Nova filial'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} autoFocus fullWidth />
            <TextField label="Nome fantasia" value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvar}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

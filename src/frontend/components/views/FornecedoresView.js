import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
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
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SearchIcon from '@mui/icons-material/Search';

const emptyForm = {
  id: null,
  nome_empresa: '',
  lista_cnpjs: '',
  lista_contratos: '',
  lista_centro_custos: '',
  padrao_descricao_servico: '',
  padrao_servico_protheus: '',
};

export default function FornecedoresView({ fornecedores, onSalvar, onExcluir }) {
  const [showModal, setShowModal] = useState(false);
  const [termo, setTermo] = useState('');
  const [form, setForm] = useState(emptyForm);

  const dadosFiltrados = fornecedores.filter((fornecedor) =>
    `${fornecedor.nome_empresa} ${fornecedor.lista_cnpjs || ''}`.toLowerCase().includes(termo.toLowerCase())
  );

  const abrirNovo = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const abrirEdicao = (item) => {
    setForm({ ...emptyForm, ...item });
    setShowModal(true);
  };

  const handleSalvar = () => {
    if (!form.nome_empresa) return alert('O nome da empresa é obrigatório');
    onSalvar(form);
    setShowModal(false);
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <GroupsOutlinedIcon color="primary" />
              <Typography variant="h5" fontWeight={700}>Fornecedores</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Parceiros, contratos e padrões de preenchimento
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Buscar nome ou CNPJ"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
              Novo fornecedor
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Empresa</TableCell>
              <TableCell>CNPJs</TableCell>
              <TableCell>Contratos</TableCell>
              <TableCell>Centros de custo</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dadosFiltrados.map((fornecedor) => (
              <TableRow key={fornecedor.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>{fornecedor.nome_empresa}</TableCell>
                <TableCell sx={{ maxWidth: 260 }}>
                  <Typography variant="body2" noWrap title={fornecedor.lista_cnpjs || '-'}>
                    {fornecedor.lista_cnpjs || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {fornecedor.lista_contratos ? <Chip size="small" variant="outlined" label={fornecedor.lista_contratos} /> : '-'}
                </TableCell>
                <TableCell sx={{ maxWidth: 220 }}>
                  <Typography variant="body2" noWrap title={fornecedor.lista_centro_custos || '-'}>
                    {fornecedor.lista_centro_custos || '-'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => abrirEdicao(fornecedor)} aria-label="Editar fornecedor">
                    <EditOutlinedIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => onExcluir(fornecedor)} aria-label="Excluir fornecedor">
                    <DeleteOutlinedIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {dadosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Nenhum fornecedor encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showModal} onClose={() => setShowModal(false)} fullWidth maxWidth="md">
        <DialogTitle>{form.id ? 'Editar fornecedor' : 'Novo fornecedor'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField label="Nome da empresa" value={form.nome_empresa} onChange={(e) => setForm({ ...form, nome_empresa: e.target.value })} autoFocus fullWidth />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Lista de CNPJs" value={form.lista_cnpjs || ''} onChange={(e) => setForm({ ...form, lista_cnpjs: e.target.value })} multiline minRows={3} fullWidth helperText="Separe por ponto e vírgula (;)" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Lista de contratos" value={form.lista_contratos || ''} onChange={(e) => setForm({ ...form, lista_contratos: e.target.value })} multiline minRows={3} fullWidth helperText="Separe por ponto e vírgula (;)" />
              </Grid>
              <Grid size={12}>
                <TextField label="Lista de centros de custo" value={form.lista_centro_custos || ''} onChange={(e) => setForm({ ...form, lista_centro_custos: e.target.value })} fullWidth />
              </Grid>
            </Grid>

            <Divider />

            <Typography variant="subtitle2" color="primary" fontWeight={800}>
              Preenchimento automático
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Descrição padrão" value={form.padrao_descricao_servico || ''} onChange={(e) => setForm({ ...form, padrao_descricao_servico: e.target.value })} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Serviço Protheus" value={form.padrao_servico_protheus || ''} onChange={(e) => setForm({ ...form, padrao_servico_protheus: e.target.value })} fullWidth />
              </Grid>
            </Grid>
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

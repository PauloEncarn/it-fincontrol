import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import SearchIcon from '@mui/icons-material/Search';

const emptyUser = { username: '', password: '', nome_completo: '', setor: '', cargo: '' };

export default function UsuariosView({ usuarios, onCriarUsuario, onToggleStatus, onExcluirUsuario }) {
  const [showModal, setShowModal] = useState(false);
  const [termo, setTermo] = useState('');
  const [formUser, setFormUser] = useState(emptyUser);

  const usuariosFiltrados = usuarios.filter((usuario) =>
    `${usuario.nome_completo} ${usuario.username}`.toLowerCase().includes(termo.toLowerCase())
  );

  const handleCriar = () => {
    if (!formUser.username || !formUser.password || !formUser.nome_completo) return alert('Preencha os campos obrigatórios');
    onCriarUsuario(formUser);
    setFormUser(emptyUser);
    setShowModal(false);
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <ManageAccountsOutlinedIcon color="primary" />
              <Typography variant="h5" fontWeight={700}>Usuários</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Acessos, aprovações e bloqueios do sistema
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Buscar usuário"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowModal(true)}>
              Novo usuário
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Login</TableCell>
              <TableCell>Setor / Cargo</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuariosFiltrados.map((usuario) => (
              <TableRow key={usuario.id} hover>
                <TableCell>
                  <Chip
                    size="small"
                    color={usuario.ativo ? 'success' : 'warning'}
                    icon={usuario.ativo ? <CheckCircleOutlinedIcon /> : <BlockOutlinedIcon />}
                    label={usuario.ativo ? 'Ativo' : 'Pendente'}
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{usuario.nome_completo}</TableCell>
                <TableCell>{usuario.username}</TableCell>
                <TableCell>{usuario.setor || '-'} / {usuario.cargo || '-'}</TableCell>
                <TableCell align="right">
                  <Tooltip title={usuario.ativo ? 'Bloquear acesso' : 'Aprovar acesso'}>
                    <IconButton color={usuario.ativo ? 'warning' : 'success'} onClick={() => onToggleStatus(usuario.id, !usuario.ativo)}>
                      {usuario.ativo ? <BlockOutlinedIcon /> : <CheckCircleOutlinedIcon />}
                    </IconButton>
                  </Tooltip>
                  <IconButton color="error" onClick={() => onExcluirUsuario(usuario)} aria-label="Excluir usuário">
                    <DeleteOutlinedIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {usuariosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showModal} onClose={() => setShowModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Novo usuário</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={12}>
              <TextField label="Nome completo" value={formUser.nome_completo} onChange={(e) => setFormUser({ ...formUser, nome_completo: e.target.value })} fullWidth autoFocus />
            </Grid>
            <Grid size={12}>
              <TextField label="Usuário" value={formUser.username} onChange={(e) => setFormUser({ ...formUser, username: e.target.value })} fullWidth />
            </Grid>
            <Grid size={12}>
              <TextField label="Senha" type="password" value={formUser.password} onChange={(e) => setFormUser({ ...formUser, password: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Setor" value={formUser.setor} onChange={(e) => setFormUser({ ...formUser, setor: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Cargo" value={formUser.cargo} onChange={(e) => setFormUser({ ...formUser, cargo: e.target.value })} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCriar}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

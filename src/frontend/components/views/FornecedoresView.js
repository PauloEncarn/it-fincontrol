import React, { useMemo, useState } from 'react';
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
  Pagination,
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

const listValues = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '').split(/[;|\n]/).map((item) => item.trim()).filter(Boolean);
};

const listText = (value) => listValues(value).join('\n');
const displayText = (value) => listValues(value).join('; ');
const PAGE_SIZE = 25;

function ListCell({ value, maxChips = 3 }) {
  const itens = listValues(value);
  if (!itens.length) return '-';

  return (
    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" title={itens.join('; ')}>
      {itens.slice(0, maxChips).map((item) => (
        <Chip key={item} size="small" variant="outlined" label={item} />
      ))}
      {itens.length > maxChips && <Chip size="small" label={`+${itens.length - maxChips}`} />}
    </Stack>
  );
}

export default function FornecedoresView({ fornecedores, onSalvar, onExcluir }) {
  const [showModal, setShowModal] = useState(false);
  const [termo, setTermo] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [pagina, setPagina] = useState(1);

  const dadosFiltrados = fornecedores.filter((fornecedor) =>
    `${fornecedor.nome_empresa} ${displayText(fornecedor.lista_cnpjs)}`.toLowerCase().includes(termo.toLowerCase())
  );
  const totalPaginas = Math.max(1, Math.ceil(dadosFiltrados.length / PAGE_SIZE));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const dadosPagina = useMemo(() => {
    const inicio = (paginaAtual - 1) * PAGE_SIZE;
    return dadosFiltrados.slice(inicio, inicio + PAGE_SIZE);
  }, [dadosFiltrados, paginaAtual]);
  const inicioPagina = dadosFiltrados.length ? (paginaAtual - 1) * PAGE_SIZE + 1 : 0;
  const fimPagina = Math.min(paginaAtual * PAGE_SIZE, dadosFiltrados.length);

  const abrirNovo = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const abrirEdicao = (item) => {
    setForm({
      ...emptyForm,
      ...item,
      lista_cnpjs: listText(item.lista_cnpjs),
      lista_contratos: listText(item.lista_contratos),
      lista_centro_custos: listText(item.lista_centro_custos),
    });
    setShowModal(true);
  };

  const handleSalvar = () => {
    if (!form.nome_empresa) return alert('O nome da empresa é obrigatório');
    onSalvar({
      ...form,
      lista_cnpjs: listValues(form.lista_cnpjs),
      lista_contratos: listValues(form.lista_contratos),
      lista_centro_custos: listValues(form.lista_centro_custos),
    });
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
              onChange={(e) => {
                setTermo(e.target.value);
                setPagina(1);
              }}
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
            {dadosPagina.map((fornecedor) => (
              <TableRow key={fornecedor.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>{fornecedor.nome_empresa}</TableCell>
                <TableCell sx={{ maxWidth: 260 }}>
                  <ListCell value={fornecedor.lista_cnpjs} />
                </TableCell>
                <TableCell>
                  <ListCell value={fornecedor.lista_contratos} maxChips={2} />
                </TableCell>
                <TableCell sx={{ maxWidth: 220 }}>
                  <ListCell value={fornecedor.lista_centro_custos} />
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

      {dadosFiltrados.length > PAGE_SIZE && (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Mostrando {inicioPagina}-{fimPagina} de {dadosFiltrados.length} fornecedores
            </Typography>
            <Pagination
              count={totalPaginas}
              page={paginaAtual}
              onChange={(_, value) => setPagina(value)}
              color="primary"
              shape="rounded"
            />
          </Stack>
        </Paper>
      )}

      <Dialog open={showModal} onClose={() => setShowModal(false)} fullWidth maxWidth="md">
        <DialogTitle>{form.id ? 'Editar fornecedor' : 'Novo fornecedor'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField label="Nome da empresa" value={form.nome_empresa} onChange={(e) => setForm({ ...form, nome_empresa: e.target.value })} autoFocus fullWidth />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Lista de CNPJs" value={form.lista_cnpjs || ''} onChange={(e) => setForm({ ...form, lista_cnpjs: e.target.value })} multiline minRows={3} fullWidth helperText="Um por linha, ou separe por ;" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Lista de contratos" value={form.lista_contratos || ''} onChange={(e) => setForm({ ...form, lista_contratos: e.target.value })} multiline minRows={3} fullWidth helperText="Um por linha, ou separe por ;" />
              </Grid>
              <Grid size={12}>
                <TextField label="Lista de centros de custo" value={form.lista_centro_custos || ''} onChange={(e) => setForm({ ...form, lista_centro_custos: e.target.value })} multiline minRows={2} fullWidth helperText="Um por linha, ou separe por ;" />
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

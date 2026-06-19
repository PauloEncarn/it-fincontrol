import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Stack,
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
  lista_cnpjs: [],
  lista_contratos: [],
  lista_centro_custos: [],
  lista_servicos: [],
  lista_produtos_protheus: [],
  padrao_descricao_servico: '',
  padrao_servico_protheus: '',
};

const listValues = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '').split(/[;|\n]/).map((item) => item.trim()).filter(Boolean);
};

const displayText = (value) => listValues(value).join('; ');
const PAGE_SIZE = 10;

function ListCell({ value }) {
  const itens = listValues(value);
  if (!itens.length) return '-';

  return (
    <Stack spacing={0.5} sx={{ width: '100%', minWidth: 0 }}>
      {itens.map((item) => (
        <Typography
          key={item}
          variant="body2"
          title={item}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            lineHeight: 1.45,
            overflowWrap: 'anywhere',
            pb: 0.5,
            whiteSpace: 'normal',
            '&:last-of-type': { borderBottom: 0, pb: 0 },
          }}
        >
          {item}
        </Typography>
      ))}
    </Stack>
  );
}

function CatalogoBloco({ label, value }) {
  const total = listValues(value).length;

  return (
    <Paper variant="outlined" sx={{ p: 1.25, height: '100%', minWidth: 0, bgcolor: 'background.default' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 0.75 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={900}>
          {label}
        </Typography>
        <Chip size="small" variant="outlined" label={`${total} itens`} sx={{ height: 20, fontSize: 11 }} />
      </Stack>
      <Box sx={{ maxHeight: 220, overflowY: 'auto', overflowX: 'hidden', pr: 0.5 }}>
        <ListCell value={value} />
      </Box>
    </Paper>
  );
}

function EditableListField({ label, value, onChange, placeholder = 'Novo item' }) {
  const [inputValue, setInputValue] = useState('');
  const itens = listValues(value);

  const addValues = (rawValue) => {
    const novos = listValues(rawValue);
    if (!novos.length) return;

    const atualizados = [...itens];
    novos.forEach((item) => {
      if (!atualizados.includes(item)) atualizados.push(item);
    });

    onChange(atualizados);
    setInputValue('');
  };

  const removeValue = (itemToRemove) => {
    onChange(itens.filter((item) => item !== itemToRemove));
  };

  return (
    <Stack spacing={1} sx={{ width: '100%', minWidth: 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Typography variant="caption" color="text.secondary" fontWeight={800}>
          {label}
        </Typography>
        <Chip size="small" variant="outlined" label={`${itens.length} itens`} />
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%', minWidth: 0 }}>
        <TextField
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addValues(inputValue);
            }
          }}
          onPaste={(e) => {
            const pastedText = e.clipboardData.getData('text');
            if (listValues(pastedText).length > 1) {
              e.preventDefault();
              addValues(pastedText);
            }
          }}
          placeholder={placeholder}
          size="small"
          fullWidth
          sx={{ flex: 1, minWidth: 0 }}
        />
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => addValues(inputValue)}
          sx={{ flexShrink: 0, minWidth: { xs: '100%', sm: 124 } }}
        >
          Adicionar
        </Button>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          p: 1,
          minHeight: 48,
          maxHeight: 132,
          bgcolor: 'background.default',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ width: '100%', minWidth: 0 }}>
          {itens.map((item) => (
            <Chip
              key={item}
              label={item}
              onDelete={() => removeValue(item)}
              sx={{
                maxWidth: '100%',
                minWidth: 0,
                height: 'auto',
                alignItems: 'flex-start',
                '& .MuiChip-label': {
                  display: 'block',
                  overflow: 'visible',
                  overflowWrap: 'anywhere',
                  py: 0.4,
                  textOverflow: 'clip',
                  whiteSpace: 'normal',
                },
              }}
            />
          ))}
          {!itens.length && (
            <Typography variant="body2" color="text.secondary">
              Nenhum item cadastrado.
            </Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

export default function FornecedoresView({ fornecedores, onSalvar, onExcluir }) {
  const [showModal, setShowModal] = useState(false);
  const [termo, setTermo] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [pagina, setPagina] = useState(1);

  const dadosFiltrados = useMemo(() => {
    const busca = termo.trim().toLowerCase();
    if (!busca) return fornecedores;

    return fornecedores.filter((fornecedor) => [
      fornecedor.nome_empresa,
      displayText(fornecedor.lista_cnpjs),
      displayText(fornecedor.lista_contratos),
      displayText(fornecedor.lista_centro_custos),
      displayText(fornecedor.lista_servicos),
      displayText(fornecedor.lista_produtos_protheus),
    ].join(' ').toLowerCase().includes(busca));
  }, [fornecedores, termo]);

  const totalCnpjs = fornecedores.reduce((acc, fornecedor) => acc + listValues(fornecedor.lista_cnpjs).length, 0);
  const totalContratos = fornecedores.reduce((acc, fornecedor) => acc + listValues(fornecedor.lista_contratos).length, 0);
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
      lista_cnpjs: listValues(item.lista_cnpjs),
      lista_contratos: listValues(item.lista_contratos),
      lista_centro_custos: listValues(item.lista_centro_custos),
      lista_servicos: listValues(item.lista_servicos),
      lista_produtos_protheus: listValues(item.lista_produtos_protheus),
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
      lista_servicos: listValues(form.lista_servicos),
      lista_produtos_protheus: listValues(form.lista_produtos_protheus),
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
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
              Novo fornecedor
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={900}>Fornecedores</Typography>
            <Typography variant="h5" fontWeight={900}>{fornecedores.length}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={900}>CNPJs cadastrados</Typography>
            <Typography variant="h5" fontWeight={900}>{totalCnpjs}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={900}>Contratos disponíveis</Typography>
            <Typography variant="h5" fontWeight={900}>{totalContratos}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        {dadosPagina.map((fornecedor) => {
          const cnpjs = listValues(fornecedor.lista_cnpjs);
          const contratos = listValues(fornecedor.lista_contratos);
          const centros = listValues(fornecedor.lista_centro_custos);
          const servicos = listValues(fornecedor.lista_servicos);
          const produtos = listValues(fornecedor.lista_produtos_protheus);

          return (
            <Grid key={fornecedor.id} size={12}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'flex-start' }} justifyContent="space-between">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" fontWeight={900} noWrap title={fornecedor.nome_empresa}>
                        {fornecedor.nome_empresa}
                      </Typography>
                      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
                        <Chip size="small" color="primary" variant="outlined" label={`${cnpjs.length} CNPJs`} />
                        <Chip size="small" variant="outlined" label={`${contratos.length} contratos`} />
                        <Chip size="small" variant="outlined" label={`${servicos.length + produtos.length} itens`} />
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={0.5} justifyContent={{ xs: 'flex-end', md: 'flex-start' }}>
                      <IconButton color="primary" onClick={() => abrirEdicao(fornecedor)} aria-label="Editar fornecedor">
                        <EditOutlinedIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => onExcluir(fornecedor)} aria-label="Excluir fornecedor">
                        <DeleteOutlinedIcon />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Divider />

                  <Grid container spacing={1.25}>
                    <Grid size={{ xs: 12, lg: 4 }}>
                      <CatalogoBloco label="CNPJs" value={cnpjs} />
                    </Grid>
                    <Grid size={{ xs: 12, lg: 4 }}>
                      <CatalogoBloco label="Contratos" value={contratos} />
                    </Grid>
                    <Grid size={{ xs: 12, lg: 4 }}>
                      <CatalogoBloco label="Centros de custo" value={centros} />
                    </Grid>
                    <Grid size={{ xs: 12, lg: 4 }}>
                      <CatalogoBloco label="Serviços" value={servicos} />
                    </Grid>
                    <Grid size={{ xs: 12, lg: 4 }}>
                      <CatalogoBloco label="Produtos Protheus" value={produtos} />
                    </Grid>
                  </Grid>
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {dadosFiltrados.length === 0 && (
        <Paper variant="outlined" sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
          Nenhum fornecedor encontrado.
        </Paper>
      )}

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
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField label="Nome fantasia" value={form.nome_empresa} onChange={(e) => setForm({ ...form, nome_empresa: e.target.value })} autoFocus fullWidth />

            <Box>
              <Typography variant="subtitle2" fontWeight={900} color="primary" sx={{ mb: 1 }}>
                Identificação e contratos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Essas listas alimentam os campos selecionáveis no cadastro de contrato.
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid size={12}>
                <EditableListField label="Lista de CNPJs" value={form.lista_cnpjs} onChange={(lista_cnpjs) => setForm({ ...form, lista_cnpjs })} placeholder="Digite um CNPJ" />
              </Grid>
              <Grid size={12}>
                <EditableListField label="Lista de contratos" value={form.lista_contratos} onChange={(lista_contratos) => setForm({ ...form, lista_contratos })} placeholder="Digite o contrato" />
              </Grid>
            </Grid>

            <Box>
              <Typography variant="subtitle2" fontWeight={900} color="primary" sx={{ mb: 1 }}>
                Catálogos para contratos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cadastre aqui o que poderá ser escolhido em cada contrato desse fornecedor.
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid size={12}>
                <EditableListField label="Lista de centros de custo" value={form.lista_centro_custos} onChange={(lista_centro_custos) => setForm({ ...form, lista_centro_custos })} placeholder="Digite o centro de custo" />
              </Grid>
              <Grid size={12}>
                <EditableListField label="Lista de serviços" value={form.lista_servicos} onChange={(lista_servicos) => setForm({ ...form, lista_servicos })} placeholder="Digite o serviço" />
              </Grid>
              <Grid size={12}>
                <EditableListField label="Lista de produtos Protheus" value={form.lista_produtos_protheus} onChange={(lista_produtos_protheus) => setForm({ ...form, lista_produtos_protheus })} placeholder="Digite o produto" />
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

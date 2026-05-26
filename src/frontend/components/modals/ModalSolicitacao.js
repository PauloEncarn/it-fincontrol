import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { OPCOES_STATUS_COMPRA } from '@/frontend/utils/constants';

export default function ModalSolicitacao({
  isOpen,
  onClose,
  form,
  setForm,
  filiais,
  fornecedores,
  onSalvar,
  onFornecedorChange,
}) {
  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <ShoppingCartOutlinedIcon color="primary" />
          <span>{form.id ? 'Editar solicitação' : 'Nova solicitação'}</span>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField select label="Filial" value={form.filial_id || ''} onChange={(e) => setForm({ ...form, filial_id: e.target.value })} fullWidth required>
              <MenuItem value="">Selecione...</MenuItem>
              {filiais.map((filial) => <MenuItem key={filial.id} value={filial.id}>{filial.codigo} - {filial.nome_fantasia}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Solicitante" value={form.solicitante || ''} onChange={(e) => setForm({ ...form, solicitante: e.target.value })} fullWidth required />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select label="Fornecedor" value={form.fornecedor_id || ''} onChange={(e) => onFornecedorChange(e.target.value)} fullWidth>
              <MenuItem value="">Selecione...</MenuItem>
              {fornecedores.map((fornecedor) => <MenuItem key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome_empresa}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid size={12}><Divider /></Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="CNPJ" value={form.cnpj || ''} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Condição de pagamento" value={form.condicao_pagamento || ''} onChange={(e) => setForm({ ...form, condicao_pagamento: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Valor" type="number" value={form.valor || ''} onChange={(e) => setForm({ ...form, valor: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Vencimento previsto" type="date" value={form.data_vencimento || ''} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>

          <Grid size={12}>
            <Typography variant="subtitle2" color="primary" fontWeight={800}>Detalhes do pedido</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Nº SC" value={form.numero_sc || ''} onChange={(e) => setForm({ ...form, numero_sc: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Nº pedido" value={form.numero_pedido || ''} onChange={(e) => setForm({ ...form, numero_pedido: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Centro de custo" value={form.centro_custo || ''} onChange={(e) => setForm({ ...form, centro_custo: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Fluig" value={form.fluig_id || ''} onChange={(e) => setForm({ ...form, fluig_id: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="Serviço / produto" value={form.servico || ''} onChange={(e) => setForm({ ...form, servico: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="Serviço Protheus" value={form.servico_protheus || ''} onChange={(e) => setForm({ ...form, servico_protheus: e.target.value })} fullWidth />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="Nota fiscal" value={form.numero_nota || ''} onChange={(e) => setForm({ ...form, numero_nota: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select label="Status atual" value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })} fullWidth>
              {OPCOES_STATUS_COMPRA.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField label="Observações" value={form.observacao || ''} onChange={(e) => setForm({ ...form, observacao: e.target.value })} multiline minRows={3} fullWidth />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSalvar}>Salvar solicitação</Button>
      </DialogActions>
    </Dialog>
  );
}

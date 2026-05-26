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
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import FileDrop from '@/frontend/components/ui/FileDrop';
import { OPCOES_STATUS } from '@/frontend/utils/constants';

export default function ModalLancamento({
  isOpen,
  onClose,
  form,
  setForm,
  filiais,
  fornecedores,
  opcoesFornecedor,
  onFornecedorChange,
  onSalvar,
  onSalvarEEnviar,
  sendingEmail,
  addToast,
  isGopa,
}) {
  const nomeFornecedorAtual = fornecedores.find((fornecedor) => fornecedor.id == form.fornecedor_id)?.nome_empresa || '';

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <AddCircleOutlinedIcon color="primary" />
          <span>{form.id ? 'Editar lançamento' : 'Novo lançamento'}</span>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField select label="Filial" value={form.filial_id || ''} onChange={(e) => setForm({ ...form, filial_id: e.target.value })} fullWidth>
              <MenuItem value="">Selecione...</MenuItem>
              {filiais.map((filial) => <MenuItem key={filial.id} value={filial.id}>{filial.codigo} - {filial.nome_fantasia}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField select label="Fornecedor" value={form.fornecedor_id || ''} onChange={(e) => onFornecedorChange(e.target.value)} fullWidth>
              <MenuItem value="">Selecione...</MenuItem>
              {fornecedores.map((fornecedor) => <MenuItem key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome_empresa}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField select label="Centro de custo" value={form.centro_custo_usado || ''} onChange={(e) => setForm({ ...form, centro_custo_usado: e.target.value })} fullWidth>
              <MenuItem value="">Selecione...</MenuItem>
              {opcoesFornecedor.ccs.map((opcao) => <MenuItem key={opcao} value={opcao}>{opcao}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select label="CNPJ" value={form.cnpj_usado || ''} onChange={(e) => setForm({ ...form, cnpj_usado: e.target.value })} fullWidth>
              <MenuItem value="">Selecione...</MenuItem>
              {opcoesFornecedor.cnpjs.map((opcao) => <MenuItem key={opcao} value={opcao}>{opcao}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select label="Contrato" value={form.contrato_usado || ''} onChange={(e) => setForm({ ...form, contrato_usado: e.target.value })} fullWidth>
              <MenuItem value="">Selecione...</MenuItem>
              {opcoesFornecedor.contratos.map((opcao) => <MenuItem key={opcao} value={opcao}>{opcao}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid size={12}><Divider /></Grid>

          {form.contrato_id && (
            <>
              <Grid size={12}>
                <Typography variant="subtitle2" color="primary" fontWeight={800}>Competência mensal</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Competência" value={form.competencia || ''} fullWidth InputProps={{ readOnly: true }} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Valor previsto" type="number" value={form.valor_previsto || ''} onChange={(e) => setForm({ ...form, valor_previsto: e.target.value })} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Contrato ID" value={form.contrato_id || ''} fullWidth InputProps={{ readOnly: true }} />
              </Grid>
              <Grid size={12}><Divider /></Grid>
            </>
          )}

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Nº nota" value={form.numero_nota || ''} onChange={(e) => setForm({ ...form, numero_nota: e.target.value })} fullWidth required />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField label="Série" value={form.serie || ''} onChange={(e) => setForm({ ...form, serie: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Valor" type="number" value={form.valor || ''} onChange={(e) => setForm({ ...form, valor: e.target.value })} fullWidth required />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField select label="Status" value={form.status_pagamento || ''} onChange={(e) => setForm({ ...form, status_pagamento: e.target.value })} fullWidth>
              {OPCOES_STATUS.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
            </TextField>
          </Grid>

          {!form.id && (
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Repetir por meses" type="number" inputProps={{ min: 1, max: 60 }} value={form.repetir_por || 1} onChange={(e) => setForm({ ...form, repetir_por: e.target.value })} fullWidth />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Data envio TI" type="date" value={form.data_envio || ''} onChange={(e) => setForm({ ...form, data_envio: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Vencimento" type="date" value={form.data_vencimento || ''} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} fullWidth required InputLabelProps={{ shrink: true }} />
          </Grid>

          <Grid size={12}>
            <Typography variant="subtitle2" color="primary" fontWeight={800}>Controle interno</Typography>
          </Grid>
          {!isGopa && (
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Fluig" value={form.solicitacao_fluig || ''} onChange={(e) => setForm({ ...form, solicitacao_fluig: e.target.value })} fullWidth />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="Pedido" value={form.numero_pedido || ''} onChange={(e) => setForm({ ...form, numero_pedido: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="Medição" value={form.numero_medicao || ''} onChange={(e) => setForm({ ...form, numero_medicao: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="Descrição serviço" value={form.descricao_servico || ''} onChange={(e) => setForm({ ...form, descricao_servico: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="Serviço Protheus" value={form.servico_protheus || ''} onChange={(e) => setForm({ ...form, servico_protheus: e.target.value })} fullWidth />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FileDrop label="Anexar nota fiscal" onFileSelect={(path) => setForm({ ...form, arquivo_nota: path })} existingFile={form.arquivo_nota} metaData={{ fornecedor: nomeFornecedorAtual, nota: form.numero_nota, vencimento: form.data_vencimento }} addToast={addToast} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FileDrop label="Anexar boleto" onFileSelect={(path) => setForm({ ...form, arquivo_boleto: path })} existingFile={form.arquivo_boleto} metaData={{ fornecedor: nomeFornecedorAtual, nota: form.numero_nota, vencimento: form.data_vencimento }} addToast={addToast} />
          </Grid>
          <Grid size={12}>
            <TextField label="Observações" value={form.observacao || ''} onChange={(e) => setForm({ ...form, observacao: e.target.value })} multiline minRows={3} fullWidth />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSalvar}>Salvar</Button>
        {isGopa && (
          <Button variant="contained" color="secondary" startIcon={<SendOutlinedIcon />} disabled={sendingEmail} onClick={onSalvarEEnviar}>
            Salvar e enviar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import FileDrop from '@/frontend/components/ui/FileDrop';
import { API_URL } from '@/frontend/utils/constants';
import { getStoredToken } from '@/frontend/utils/authStorage';

const formatDateForInput = (value) => {
  if (!value) return '';
  const text = String(value).split('T')[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
};

const maskInvoiceNumber = (value) => String(value || '').replace(/\D/g, '').slice(0, 9);

const formatInvoiceNumber = (value) => {
  const digits = maskInvoiceNumber(value);
  return digits ? digits.padStart(9, '0') : '';
};

const formatMoneyCopy = (value) => Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const formatDateCopy = (value) => {
  const text = formatDateForInput(value);
  return text ? text.split('-').reverse().join('/') : '-';
};

const CopyAction = ({ label, value, onCopy }) => (
  <Tooltip title={`Copiar ${label}`}>
    <span>
      <IconButton
        size="small"
        onClick={() => onCopy(label, value)}
        disabled={value === null || value === undefined || value === ''}
        aria-label={`Copiar ${label}`}
        sx={{ flex: '0 0 auto', mt: 1 }}
      >
        <ContentCopyOutlinedIcon fontSize="small" />
      </IconButton>
    </span>
  </Tooltip>
);

const CopyableField = ({ label, value, onCopy, children }) => (
  <Stack direction="row" spacing={0.75} alignItems="flex-start">
    <Stack sx={{ flex: 1, minWidth: 0 }}>{children}</Stack>
    <CopyAction label={label} value={value} onCopy={onCopy} />
  </Stack>
);

export default function ModalLancamento({
  isOpen,
  onClose,
  form,
  setForm,
  filiais,
  fornecedores,
  opcoesFornecedor,
  onFornecedorChange,
  onContratoChange,
  onSalvar,
  addToast,
  isGopa,
}) {
  const sessionId = useMemo(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, [form.id]);
  const [lockState, setLockState] = useState({ loading: false, lockedByOther: false, lock: null, error: null });
  const filialAtual = filiais.find((filial) => filial.id == form.filial_id);
  const nomeFilialAtual = filialAtual ? [filialAtual.codigo, filialAtual.nome_fantasia].filter(Boolean).join(' - ') : '';
  const nomeFornecedorAtual = fornecedores.find((fornecedor) => fornecedor.id == form.fornecedor_id)?.nome_empresa || '';
  const setDateField = (field, value) => setForm({ ...form, [field]: value });
  const setInvoiceNumber = (value) => setForm({ ...form, numero_nota: maskInvoiceNumber(value) });
  const cnpjs = Array.isArray(opcoesFornecedor?.cnpjs) ? opcoesFornecedor.cnpjs : [];
  const contratos = Array.isArray(opcoesFornecedor?.contratos) ? opcoesFornecedor.contratos : [];
  const contratosCadastrados = Array.isArray(opcoesFornecedor?.contratosCadastrados) ? opcoesFornecedor.contratosCadastrados : [];
  const centrosCusto = Array.isArray(opcoesFornecedor?.ccs) ? opcoesFornecedor.ccs : [];
  const lockedByOther = Boolean(lockState.lockedByOther);

  useEffect(() => {
    if (!isOpen || !form.id) {
      setLockState({ loading: false, lockedByOther: false, lock: null, error: null });
      return undefined;
    }

    let active = true;
    const token = getStoredToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const acquireLock = async () => {
      setLockState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(`${API_URL}/lancamentos/${form.id}/lock`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await response.json();

        if (!active) return;
        if (response.status === 423) {
          setLockState({ loading: false, lockedByOther: true, lock: data.lock, error: data.error });
          return;
        }
        if (!response.ok) throw new Error(data.error || 'Erro ao bloquear nota para edicao.');

        setLockState({ loading: false, lockedByOther: false, lock: data.lock, error: null });
      } catch (error) {
        if (active) setLockState({ loading: false, lockedByOther: false, lock: null, error: error.message });
      }
    };

    const releaseLock = () => {
      fetch(`${API_URL}/lancamentos/${form.id}/lock`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ session_id: sessionId }),
        keepalive: true,
      }).catch(() => {});
    };

    acquireLock();
    const interval = setInterval(acquireLock, 30000);

    return () => {
      active = false;
      clearInterval(interval);
      releaseLock();
    };
  }, [form.id, isOpen, sessionId]);

  const observacaoProtheus = [
    `Fornecedor: ${nomeFornecedorAtual || '-'}`,
    `CPF/CNPJ: ${form.cnpj_usado || '-'}`,
    `NF: ${form.numero_nota || '-'}`,
    `Vencimento: ${formatDateCopy(form.data_vencimento)}`,
    `Valor R$: ${formatMoneyCopy(form.valor)}`,
    `Contrato: ${form.contrato_usado || '-'}`,
    `Produto/Servico Protheus: ${form.servico_protheus || '-'}`,
    `Fluig: ${form.solicitacao_fluig || '-'}`,
    `Pedido: ${form.numero_pedido || '-'}`,
    `Medicao: ${form.numero_medicao || '-'}`,
    `Centro de custo: ${form.centro_custo_usado || '-'}`,
  ].join(' | ');

  const copiarCampo = (label, value) => {
    const texto = value === null || value === undefined || value === '' ? '-' : String(value);
    if (!navigator?.clipboard?.writeText) {
      addToast?.('error', 'Area de transferencia indisponivel neste navegador.');
      return;
    }

    navigator.clipboard.writeText(texto)
      .then(() => addToast?.('success', `${label} copiado!`))
      .catch(() => addToast?.('error', `Nao foi possivel copiar ${label}.`));
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <AddCircleOutlinedIcon color="primary" />
          <span>{form.id ? 'Editar lancamento' : 'Novo lancamento'}</span>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
        {lockState.error && (
          <Alert severity={lockedByOther ? 'warning' : 'error'} variant="outlined">
            {lockedByOther
              ? `${lockState.error} Voce pode visualizar, mas nao editar ate a pessoa sair da nota.`
              : lockState.error}
          </Alert>
        )}
        {!lockedByOther && form.id && lockState.lock && (
          <Alert severity="info" variant="outlined">
            Voce esta editando esta nota. O bloqueio e renovado automaticamente enquanto o modal estiver aberto.
          </Alert>
        )}
        <Box component="fieldset" disabled={lockedByOther} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <CopyableField onCopy={copiarCampo} label="Filial" value={nomeFilialAtual}>
              <TextField select label="Filial" value={form.filial_id || ''} onChange={(e) => setForm({ ...form, filial_id: e.target.value })} fullWidth>
                <MenuItem value="">Selecione...</MenuItem>
                {filiais.map((filial) => <MenuItem key={filial.id} value={filial.id}>{filial.codigo} - {filial.nome_fantasia}</MenuItem>)}
              </TextField>
            </CopyableField>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <CopyableField onCopy={copiarCampo} label="Fornecedor" value={nomeFornecedorAtual}>
              <TextField select label="Fornecedor" value={form.fornecedor_id || ''} onChange={(e) => onFornecedorChange(e.target.value)} fullWidth>
                <MenuItem value="">Selecione...</MenuItem>
                {fornecedores.map((fornecedor) => <MenuItem key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome_empresa}</MenuItem>)}
              </TextField>
            </CopyableField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <CopyableField onCopy={copiarCampo} label="Centro de custo" value={form.centro_custo_usado}>
              <TextField select label="Centro de custo" value={form.centro_custo_usado || ''} onChange={(e) => setForm({ ...form, centro_custo_usado: e.target.value })} fullWidth>
                <MenuItem value="">Selecione...</MenuItem>
                {centrosCusto.map((opcao) => <MenuItem key={opcao} value={opcao}>{opcao}</MenuItem>)}
              </TextField>
            </CopyableField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CopyableField onCopy={copiarCampo} label="CNPJ" value={form.cnpj_usado}>
              <TextField select label="CNPJ" value={form.cnpj_usado || ''} onChange={(e) => setForm({ ...form, cnpj_usado: e.target.value })} fullWidth>
                <MenuItem value="">Selecione...</MenuItem>
                {cnpjs.map((opcao) => <MenuItem key={opcao} value={opcao}>{opcao}</MenuItem>)}
              </TextField>
            </CopyableField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CopyableField onCopy={copiarCampo} label="Contrato" value={form.contrato_usado}>
              {contratosCadastrados.length ? (
                <TextField
                  select
                  label="Contrato cadastrado"
                  value={form.contrato_id || ''}
                  onChange={(e) => onContratoChange?.(e.target.value)}
                  fullWidth
                  helperText="Selecione o item correto pelo contrato, filial e servico"
                >
                  <MenuItem value="">Selecione...</MenuItem>
                  {contratosCadastrados.map((contrato) => (
                    <MenuItem key={contrato.id} value={contrato.id}>{contrato.label}</MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField select label="Contrato" value={form.contrato_usado || ''} onChange={(e) => setForm({ ...form, contrato_id: null, contrato_usado: e.target.value })} fullWidth helperText="Cadastre contratos na tela de Contratos para vincular a nota">
                  <MenuItem value="">Selecione...</MenuItem>
                  {contratos.map((opcao) => <MenuItem key={opcao} value={opcao}>{opcao}</MenuItem>)}
                </TextField>
              )}
            </CopyableField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <CopyableField onCopy={copiarCampo} label="Numero do contrato" value={form.contrato_usado}>
              <TextField label="Numero do contrato" value={form.contrato_usado || ''} fullWidth slotProps={{ input: { readOnly: true } }} />
            </CopyableField>
          </Grid>
          <Grid size={{ xs: 12, md: 9 }}>
            <CopyableField onCopy={copiarCampo} label="Descricao do contrato" value={form.descricao_servico}>
              <TextField label="Descricao/servico do contrato" value={form.descricao_servico || ''} fullWidth slotProps={{ input: { readOnly: true } }} />
            </CopyableField>
          </Grid>

          <Grid size={12}><Divider /></Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <CopyableField onCopy={copiarCampo} label="Numero da nota" value={form.numero_nota}>
              <TextField label="Numero da nota" value={form.numero_nota || ''} onChange={(e) => setInvoiceNumber(e.target.value)} onBlur={() => setForm({ ...form, numero_nota: formatInvoiceNumber(form.numero_nota) })} fullWidth required helperText="9 digitos; ex.: 018 vira 000000018" slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 9 } }} />
            </CopyableField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <CopyableField onCopy={copiarCampo} label="Serie" value={form.serie}>
              <TextField label="Serie" value={form.serie || ''} onChange={(e) => setForm({ ...form, serie: e.target.value })} fullWidth />
            </CopyableField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <CopyableField onCopy={copiarCampo} label="Valor" value={form.valor}>
              <TextField label="Valor" value={form.valor || ''} onChange={(e) => setForm({ ...form, valor: e.target.value })} fullWidth required placeholder="1566,93" slotProps={{ htmlInput: { inputMode: 'decimal' } }} />
            </CopyableField>
          </Grid>

          {!form.id && (
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Repetir por meses" type="number" slotProps={{ htmlInput: { min: 1, max: 60 } }} value={form.repetir_por || 1} onChange={(e) => setForm({ ...form, repetir_por: e.target.value })} fullWidth />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 3 }}>
            <CopyableField onCopy={copiarCampo} label="Data envio TI" value={formatDateCopy(form.data_envio)}>
              <TextField label="Data envio TI" type="date" value={formatDateForInput(form.data_envio)} onChange={(e) => setDateField('data_envio', e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            </CopyableField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <CopyableField onCopy={copiarCampo} label="Vencimento" value={formatDateCopy(form.data_vencimento)}>
              <TextField label="Vencimento" type="date" value={formatDateForInput(form.data_vencimento)} onChange={(e) => setDateField('data_vencimento', e.target.value)} fullWidth required slotProps={{ inputLabel: { shrink: true } }} />
            </CopyableField>
          </Grid>

          <Grid size={12}>
            <Typography variant="subtitle2" color="primary" fontWeight={800}>Controle interno</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <CopyableField onCopy={copiarCampo} label="Medicao" value={form.numero_medicao}>
              <TextField label="Medicao" value={form.numero_medicao || ''} onChange={(e) => setForm({ ...form, numero_medicao: e.target.value })} fullWidth />
            </CopyableField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <CopyableField onCopy={copiarCampo} label="Pedido" value={form.numero_pedido}>
              <TextField label="Pedido" value={form.numero_pedido || ''} onChange={(e) => setForm({ ...form, numero_pedido: e.target.value })} fullWidth />
            </CopyableField>
          </Grid>
          {!isGopa && (
            <Grid size={{ xs: 12, md: 4 }}>
              <CopyableField onCopy={copiarCampo} label="Fluig" value={form.solicitacao_fluig}>
                <TextField label="Fluig" value={form.solicitacao_fluig || ''} onChange={(e) => setForm({ ...form, solicitacao_fluig: e.target.value })} fullWidth />
              </CopyableField>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 6 }}>
            <CopyableField onCopy={copiarCampo} label="Descricao servico" value={form.descricao_servico}>
              <TextField label="Descricao servico" value={form.descricao_servico || ''} onChange={(e) => setForm({ ...form, descricao_servico: e.target.value })} fullWidth />
            </CopyableField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CopyableField onCopy={copiarCampo} label="Servico Protheus" value={form.servico_protheus}>
              <TextField label="Servico Protheus" value={form.servico_protheus || ''} onChange={(e) => setForm({ ...form, servico_protheus: e.target.value })} fullWidth />
            </CopyableField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FileDrop label="Anexar nota fiscal" onFileSelect={(path) => setForm({ ...form, arquivo_nota: path })} existingFile={form.arquivo_nota} metaData={{ fornecedor: nomeFornecedorAtual, nota: form.numero_nota, vencimento: form.data_vencimento }} addToast={addToast} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FileDrop label="Anexar boleto" onFileSelect={(path) => setForm({ ...form, arquivo_boleto: path })} existingFile={form.arquivo_boleto} metaData={{ fornecedor: nomeFornecedorAtual, nota: form.numero_nota, vencimento: form.data_vencimento }} addToast={addToast} />
          </Grid>
          <Grid size={12}>
            <Typography variant="subtitle2" color="primary" fontWeight={800}>Boleto compartilhado</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <CopyableField onCopy={copiarCampo} label="Grupo do boleto" value={form.boleto_grupo}>
              <TextField label="Grupo do boleto" value={form.boleto_grupo || ''} onChange={(e) => setForm({ ...form, boleto_grupo: e.target.value })} fullWidth helperText="Use o mesmo grupo nas notas do mesmo boleto" />
            </CopyableField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <CopyableField onCopy={copiarCampo} label="Valor do boleto" value={form.valor_boleto}>
              <TextField label="Valor do boleto" value={form.valor_boleto || ''} onChange={(e) => setForm({ ...form, valor_boleto: e.target.value })} fullWidth placeholder="1566,93" slotProps={{ htmlInput: { inputMode: 'decimal' } }} />
            </CopyableField>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <CopyableField onCopy={copiarCampo} label="Observacao do boleto" value={form.observacao_boleto}>
              <TextField label="Observacao do boleto" value={form.observacao_boleto || ''} onChange={(e) => setForm({ ...form, observacao_boleto: e.target.value })} fullWidth />
            </CopyableField>
          </Grid>
          <Grid size={12}>
            <CopyableField onCopy={copiarCampo} label="Observacao Protheus" value={observacaoProtheus}>
              <TextField label="Observacao Protheus" value={observacaoProtheus} multiline minRows={2} fullWidth slotProps={{ input: { readOnly: true } }} />
            </CopyableField>
          </Grid>
          <Grid size={12}>
            <CopyableField onCopy={copiarCampo} label="Observacoes" value={form.observacao}>
              <TextField label="Observacoes" value={form.observacao || ''} onChange={(e) => setForm({ ...form, observacao: e.target.value })} multiline minRows={3} fullWidth />
            </CopyableField>
          </Grid>
        </Grid>
        </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSalvar} disabled={lockedByOther}>Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}


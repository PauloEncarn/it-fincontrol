'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic'; // Import para Lazy Loading
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Box, CircularProgress, CssBaseline, ThemeProvider, Typography } from '@mui/material';

import { API_URL } from '@/frontend/utils/constants';
import { sharepointTheme } from '@/frontend/theme/sharepointTheme';

import LoginScreen from '@/frontend/components/ui/LoginScreen';
import ToastContainer from '@/frontend/components/ui/ToastContainer';
import ConfirmDialog from '@/frontend/components/ui/ConfirmDialog';
import Header from '@/frontend/components/layout/Header';
import Sidebar from '@/frontend/components/layout/Sidebar';

import DashboardView from '@/frontend/components/views/DashboardView';
import NotasView from '@/frontend/components/views/NotasView'; 
import ContratosView from '@/frontend/components/views/ContratosView';
import SearchResultsView from '@/frontend/components/views/SearchResultsView';
import SolicitacoesView from '@/frontend/components/views/SolicitacoesView';
import FiliaisView from '@/frontend/components/views/FiliaisView';
import FornecedoresView from '@/frontend/components/views/FornecedoresView';
import UsuariosView from '@/frontend/components/views/UsuariosView';

// --- PERFORMANCE: DYNAMIC IMPORTS (Lazy Loading) ---
// O código destes modais só será baixado se o usuário precisar deles
const ModalLancamento = dynamic(() => import('@/frontend/components/modals/ModalLancamento'), {
  loading: () => (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 1700, display: 'grid', placeItems: 'center', bgcolor: 'rgba(0, 0, 0, 0.2)' }}>
      <CircularProgress sx={{ color: 'white' }} />
    </Box>
  ),
  ssr: false
});

const ModalSolicitacao = dynamic(() => import('@/frontend/components/modals/ModalSolicitacao'), {
  ssr: false
});
// ---------------------------------------------------

const initialFormLancamento = { id: null, competencia: '', filial_id: '', fornecedor_id: '', cnpj_usado: '', contrato_usado: '', centro_custo_usado: '', numero_nota: '', serie: 'U', valor: '', valor_previsto: '', data_envio: '', data_vencimento: '', descricao_servico: '', servico_protheus: '', numero_medicao: '', numero_pedido: '', solicitacao_fluig: '', observacao: '', etapa: 'pendente', status_pagamento: 'Pendente Nota', arquivo_nota: '', arquivo_boleto: '', repetir_por: '1' };
const initialFormSolicitacao = { id: null, filial_id: '', fornecedor_id: '', solicitante: '', cnpj: '', condicao_pagamento: '', valor: '', numero_sc: '', numero_pedido: '', servico: '', servico_protheus: '', centro_custo: '', numero_nota: '', fluig_id: '', data_vencimento: '', status: 'Em Andamento', observacao: '' };

function DashboardContent() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  
  // FILTROS
  const [competenciaNotas, setCompetenciaNotas] = useState(new Date()); 
  const [filialFiltro, setFilialFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [contratosPrecisaFornecedores, setContratosPrecisaFornecedores] = useState(false);

  // MODAIS
  const [showModal, setShowModal] = useState(false); 
  const [showModalSolicitacao, setShowModalSolicitacao] = useState(false);
  const [form, setForm] = useState(initialFormLancamento);
  const [formSolicitacao, setFormSolicitacao] = useState(initialFormSolicitacao);
  const [opcoesFornecedor, setOpcoesFornecedor] = useState({ cnpjs: [], contratos: [], ccs: [] });
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const authConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // --- EFEITOS ---
  useEffect(() => { const timer = setTimeout(() => { const storedToken = localStorage.getItem('token'); if (storedToken) setToken(storedToken); setLoadingInit(false); }, 0); return () => clearTimeout(timer); }, []);

  // Limpa a busca ao trocar de aba (Usabilidade)
  useEffect(() => {
    setTermoBusca('');
    setContratosPrecisaFornecedores(false);
    setSelectedContrato(null);
  }, [currentView]);

  const addToast = useCallback((type, message) => { const id = Date.now(); setToasts(prev => [...prev, { id, type, message }]); setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000); }, []);
  const openConfirm = (title, message, action) => { setConfirmConfig({ isOpen: true, title, message, onConfirm: () => { action(); setConfirmConfig(p => ({...p, isOpen: false})); } }); };
  const handleLogin = (t) => { localStorage.setItem('token', t); setToken(t); };
  const handleLogout = () => { localStorage.removeItem('token'); setToken(null); queryClient.clear(); };

  // --- QUERIES OTIMIZADAS ---
  
  // PERFORMANCE: staleTime evita requisições repetidas para dados estáticos
  const { data: filiais = [] } = useQuery({ 
      queryKey: ['filiais'], 
      queryFn: () => axios.get(`${API_URL}/filiais/`, authConfig).then(res => res.data), 
      staleTime: 1000 * 60 * 10, // 10 minutos
      enabled: !!token 
  });
  
  const { data: fornecedores = [] } = useQuery({ 
      queryKey: ['fornecedores'], 
      queryFn: () => axios.get(`${API_URL}/fornecedores/`, authConfig).then(res => res.data), 
      staleTime: 1000 * 60 * 5, // 5 minutos
      enabled: !!token && (
        currentView === 'notas' ||
        currentView === 'dashboard' ||
        currentView === 'solicitacoes' ||
        currentView === 'fornecedores' ||
        currentView === 'subcontratos' ||
        showModal ||
        showModalSolicitacao ||
        contratosPrecisaFornecedores
      )
  });
  
  const { data: usuarios = [] } = useQuery({ queryKey: ['usuarios'], queryFn: () => axios.get(`${API_URL}/usuarios/`, authConfig).then(res => res.data), enabled: !!token && currentView === 'usuarios' });

  const { data: dadosNotas = [], isLoading: loadingNotas } = useQuery({ 
      queryKey: ['notas_operacional', filialFiltro, competenciaNotas.getMonth(), competenciaNotas.getFullYear()], 
      queryFn: async () => { 
          const params = { filial_id: filialFiltro || undefined, mes: competenciaNotas.getMonth() + 1, ano: competenciaNotas.getFullYear() }; 
          const res = await axios.get(`${API_URL}/dados-agrupados/`, { ...authConfig, params }); 
          let lista = []; 
          res.data.forEach(forn => { if(forn.lancamentos) forn.lancamentos.forEach(nota => lista.push({ ...nota, nome_fornecedor: forn.nome_empresa })); }); 
          return lista; 
      }, 
      enabled: !!token && currentView === 'notas'
  });

  const { data: dadosDashboard = [] } = useQuery({ 
      queryKey: ['dashboard_full'], 
      queryFn: async () => { 
        const res = await axios.get(`${API_URL}/lancamentos/`, authConfig); 
        return res.data; 
      }, 
      enabled: !!token && currentView === 'dashboard'
  });

  const { data: notificacoes = [] } = useQuery({
      queryKey: ['notificacoes'],
      queryFn: () => axios.get(`${API_URL}/notificacoes/`, authConfig).then(res => res.data),
      enabled: !!token,
      staleTime: 1000 * 60
  });

  const { data: contratos = [] } = useQuery({
      queryKey: ['contratos'],
      queryFn: () => axios.get(`${API_URL}/contratos/`, authConfig).then(res => res.data),
      enabled: !!token && (currentView === 'contratos' || currentView === 'subcontratos')
  });

  const { data: lancamentosContrato = [] } = useQuery({
      queryKey: ['contrato_lancamentos', selectedContrato?.id],
      queryFn: () => axios.get(`${API_URL}/contratos/${selectedContrato.id}/lancamentos`, authConfig).then(res => res.data),
      enabled: !!token && !!selectedContrato?.id
  });

  const { data: dadosBusca = [], isFetching: carregandoBusca } = useQuery({ queryKey: ['busca', termoBusca], queryFn: async () => { if (!termoBusca) return []; const res = await axios.get(`${API_URL}/lancamentos/?busca=${termoBusca}`, authConfig); return res.data; }, enabled: !!token && termoBusca.length > 2 });

  // SOLICITAÇÕES: Baixa tudo para filtrar e enriquecer no front
  const { data: solicitacoes = [] } = useQuery({ 
      queryKey: ['solicitacoes'], 
      queryFn: async () => { 
          const res = await axios.get(`${API_URL}/solicitacoes`, authConfig); 
          return res.data; 
      }, 
      enabled: !!token 
  });

  // --- REFRESH LOGIC ---
  const atualizarListas = async () => {
      // exact: false força atualização de chaves parciais (ex: notas_operacional independente do mes)
      await queryClient.invalidateQueries({ queryKey: ['notas_operacional'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['dashboard_full'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['solicitacoes'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['busca'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['contratos'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['contrato_lancamentos'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['notificacoes'], exact: false });
  };

  const abrirNotificacao = useCallback((notificacao) => {
      setCurrentView(notificacao.targetView || 'notas');
      setTermoBusca(notificacao.search || notificacao.numero_nota || notificacao.fornecedor || '');
  }, []);

  const handleManualRefresh = async () => {
      addToast('info', 'Sincronizando dados...');
      await atualizarListas();
      setTimeout(() => addToast('success', 'Dados atualizados!'), 500);
  };

  // --- MUTATIONS ---
  const mutationLancamento = useMutation({ mutationFn: (nota) => nota.id ? axios.put(`${API_URL}/lancamentos/${nota.id}`, nota, authConfig) : axios.post(`${API_URL}/lancamentos/`, nota, authConfig), onSuccess: () => { atualizarListas(); }});
  
  const mutationStatus = useMutation({ 
      mutationFn: ({id, status, etapa}) => axios.patch(`${API_URL}/lancamentos/${id}/status`, { status, etapa }, authConfig), 
      onSuccess: () => { 
          atualizarListas(); 
          addToast('success', 'Nota atualizada!'); 
      } 
  });

  const mutationFilial = useMutation({ mutationFn: (data) => data.id ? axios.put(`${API_URL}/filiais/${data.id}`, data, authConfig) : axios.post(`${API_URL}/filiais/`, data, authConfig), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['filiais'] }); addToast('success', 'Filial salva!'); } });
  const mutationFornecedor = useMutation({ mutationFn: (data) => data.id ? axios.put(`${API_URL}/fornecedores/${data.id}`, data, authConfig) : axios.post(`${API_URL}/fornecedores/`, data, authConfig), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fornecedores'] }); addToast('success', 'Fornecedor salvo!'); } });

  const mutationContrato = useMutation({
      mutationFn: (data) => data.id ? axios.put(`${API_URL}/contratos/${data.id}`, data, authConfig) : axios.post(`${API_URL}/contratos/`, data, authConfig),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['contratos'] });
          addToast('success', 'Contrato salvo!');
      },
      onError: (err) => addToast('error', 'Erro ao salvar contrato: ' + (err.response?.data?.error || err.message))
  });

  const mutationGerarCompetencia = useMutation({
      mutationFn: ({ contratoId, competencia }) => axios.post(`${API_URL}/contratos/${contratoId}/lancamentos`, { competencia }, authConfig),
      onSuccess: () => {
          atualizarListas();
          addToast('success', 'Nota gerada em Pendente Fatura!');
      },
      onError: (err) => addToast('error', 'Erro ao gerar nota: ' + (err.response?.data?.error || err.message))
  });

  const mutationSolicitacao = useMutation({ 
      mutationFn: (dados) => dados.id ? axios.put(`${API_URL}/solicitacoes/${dados.id}`, dados, authConfig) : axios.post(`${API_URL}/solicitacoes/`, dados, authConfig), 
      onSuccess: () => { 
          atualizarListas(); 
          addToast('success', 'Solicitação salva!'); 
          setShowModalSolicitacao(false); 
      }, 
      onError: (err) => addToast('error', 'Erro ao salvar: ' + err.message) 
  });

  const mutationUsuario = useMutation({ mutationFn: (dados) => axios.post(`${API_URL}/usuarios/`, dados, authConfig), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); addToast('success', 'Usuário criado!'); }, onError: () => addToast('error', 'Erro ao criar usuário.') });
  const mutationUsuarioStatus = useMutation({ mutationFn: ({ id, ativo }) => axios.put(`${API_URL}/usuarios/${id}`, { ativo }, authConfig), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); addToast('success', 'Acesso atualizado!'); }, onError: () => addToast('error', 'Erro ao atualizar acesso.') });
  const mutationDeleteUsuario = useMutation({ mutationFn: (id) => axios.delete(`${API_URL}/usuarios/${id}`, authConfig), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); addToast('success', 'Usuário excluído!'); }, onError: () => addToast('error', 'Erro ao excluir usuário.') });

  // --- HELPERS E CALLBACKS (Otimizados com useCallback) ---
  const getFilialNota = useCallback((nota) => {
    const fId = nota.filial_id || (form && form.filial_id);
    return filiais.find(f => f.id == fId);
  }, [filiais, form]);
  const isGopaFunc = useCallback((nota) => getFilialNota(nota)?.nome_fantasia?.toUpperCase().includes('GOPA'), [getFilialNota]);
  
  const splitOptions = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return String(value || '').split(/[;|\n]/).map((item) => item.trim()).filter(Boolean);
  };
  const getDateInputValue = (value) => value ? String(value).split('T')[0] : '';
  const normalizeDateForApi = (value) => {
    const text = String(value || '').trim();
    if (!text) return null;
    const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
    const brDate = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (brDate) return `${brDate[3]}-${brDate[2]}-${brDate[1]}`;
    return text.includes('/') ? null : text;
  };

  const handleFornecedorChange = useCallback((id) => { const forn = fornecedores.find(f => f.id == id); if (forn) { const opcoes = { cnpjs: splitOptions(forn.lista_cnpjs), contratos: splitOptions(forn.lista_contratos), ccs: splitOptions(forn.lista_centro_custos) }; setOpcoesFornecedor(opcoes); setForm(p => ({ ...p, fornecedor_id: id, cnpj_usado: p.cnpj_usado || opcoes.cnpjs[0] || '', contrato_usado: p.contrato_usado || opcoes.contratos[0] || '', centro_custo_usado: p.centro_custo_usado || opcoes.ccs[0] || '', descricao_servico: p.descricao_servico || forn.padrao_descricao_servico || '', servico_protheus: p.servico_protheus || forn.padrao_servico_protheus || '' })); } else { setOpcoesFornecedor({ cnpjs: [], contratos: [], ccs: [] }); setForm(p => ({...p, fornecedor_id: id, cnpj_usado: '', contrato_usado: '', centro_custo_usado: ''})); } }, [fornecedores]);
  
  const handleFornecedorSolicitacaoChange = useCallback((id) => { const forn = fornecedores.find(f => f.id == id); if (forn) { setFormSolicitacao(prev => ({ ...prev, fornecedor_id: id, cnpj: splitOptions(forn.lista_cnpjs)[0] || '', centro_custo: splitOptions(forn.lista_centro_custos)[0] || '', servico: forn.padrao_descricao_servico || '', servico_protheus: forn.padrao_servico_protheus || '' })); } else { setFormSolicitacao(prev => ({ ...prev, fornecedor_id: id, cnpj: '', centro_custo: '' })); } }, [fornecedores]);
  
  const abrirEdicaoLancamento = useCallback((nota) => { handleFornecedorChange(nota.fornecedor_id); setForm({...nota, data_envio: getDateInputValue(nota.data_envio), data_vencimento: getDateInputValue(nota.data_vencimento)}); setShowModal(true); }, [handleFornecedorChange]);
  
  const duplicarNota = useCallback((nota) => { openConfirm("Duplicar Lançamento", "Deseja criar uma cópia?", () => { handleFornecedorChange(nota.fornecedor_id); setForm({ ...nota, id: null, contrato_id: null, competencia: '', numero_nota: '', arquivo_nota: '', arquivo_boleto: '', data_envio: '', data_vencimento: getDateInputValue(nota.data_vencimento), etapa: 'pendente', status_pagamento: 'Pendente Nota', repetir_por: '1' }); setShowModal(true); }); }, [handleFornecedorChange]);
  
  const notaCompletaParaAnalise = (nota) => Boolean(
    nota.filial_id &&
    nota.fornecedor_id &&
    nota.numero_nota &&
    nota.valor &&
    nota.data_vencimento &&
    nota.cnpj_usado &&
    nota.centro_custo_usado &&
    nota.numero_pedido &&
    !isGopaFunc(nota) &&
    nota.solicitacao_fluig
  );

  const prepararPayloadLancamento = (dados) => {
    const payload = {
      ...dados,
      data_envio: normalizeDateForApi(dados.data_envio),
      data_vencimento: normalizeDateForApi(dados.data_vencimento),
    };
    const etapaAtual = payload.etapa || 'pendente';

    if (['pendente', 'em_andamento'].includes(etapaAtual)) {
      if (notaCompletaParaAnalise(payload)) {
        payload.etapa = 'em_analise';
        payload.status_pagamento = 'Aguardando Aprovação Fluig';
      } else {
        payload.etapa = 'em_andamento';
        payload.status_pagamento = 'Em Andamento';
      }
    }

    return payload;
  };

  const salvarLancamento = async () => {
    if (!form.filial_id || !form.fornecedor_id || !form.valor) {
      return addToast('error', 'Preencha os campos obrigatórios!');
    }

    const payload = prepararPayloadLancamento(form);
    try {
      await mutationLancamento.mutateAsync(payload);
      addToast('success', payload.etapa === 'em_analise' ? 'Lançamento salvo e enviado para análise!' : 'Lançamento salvo!');
      setShowModal(false);
    } catch {
      addToast('error', 'Erro ao salvar.');
    }
  };

  const salvarLancamentoInline = async (dados) => {
    const payload = prepararPayloadLancamento(dados);
    try {
      await mutationLancamento.mutateAsync(payload);
      addToast('success', payload.etapa === 'em_analise' ? 'Nota salva e enviada para análise!' : 'Nota salva!');
    } catch {
      addToast('error', 'Erro ao salvar nota.');
    }
  };
  
  const salvarEEnviar = async () => { if (!form.arquivo_nota) return addToast('error', 'Anexe a nota fiscal para enviar.'); const payload = prepararPayloadLancamento(form); try { setSendingEmail(true); const response = await mutationLancamento.mutateAsync(payload); const notaSalva = response.data; await handleEnviarEmail({...payload, id: notaSalva.id || form.id}); setShowModal(false); } catch (e) { addToast('error', 'Erro no processo Salvar/Enviar.'); } finally { setSendingEmail(false); } };

  // ENVIO DE EMAIL
  const handleEnviarEmail = async (dadosNota) => {
    const nota = dadosNota || form;
    if (!nota.id || !nota.arquivo_nota) return addToast('error', 'Salve a nota e anexe arquivos.');
    setSendingEmail(true);
    
    try {
      // Resolve nome do fornecedor
      let nomeFornecedorFinal = nota.nome_fornecedor;
      if (!nomeFornecedorFinal && nota.fornecedor_id) {
          const f = fornecedores.find(x => x.id == nota.fornecedor_id);
          if (f) nomeFornecedorFinal = f.nome_empresa;
      }

      await axios.post(`${API_URL}/enviar-email`, { 
        id: nota.id, 
        numero_nota: nota.numero_nota, 
        fornecedor: nomeFornecedorFinal || 'Fornecedor',
        valor: nota.valor, 
        vencimento: nota.data_vencimento, 
        arquivos: [nota.arquivo_nota, nota.arquivo_boleto] 
      }, authConfig);

      const novoStatus = 'Email Enviado p/ Balança';
      if(form.id === nota.id) setForm(p => ({...p, status_pagamento: novoStatus}));
      
      mutationStatus.mutate({id: nota.id, status: novoStatus});
      addToast('success', 'E-mail enviado para GOPA com sucesso!'); 

    } catch (error) {
      console.error(error);
      addToast('error', 'Falha ao enviar e-mail.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleEnviarEmailGopa = async (nota) => {
    const obrigatorios = [
      ['número da nota', nota.numero_nota],
      ['pedido', nota.numero_pedido],
      ['medição', nota.numero_medicao],
      ['nota fiscal', nota.arquivo_nota],
      ['boleto', nota.arquivo_boleto],
      ['vencimento', nota.data_vencimento],
    ];
    const faltando = obrigatorios.filter(([, valor]) => !valor).map(([label]) => label);

    if (faltando.length) {
      addToast('error', `Preencha antes de enviar: ${faltando.join(', ')}.`);
      abrirEdicaoLancamento(nota);
      return;
    }

    let nomeFornecedorFinal = nota.nome_fornecedor;
    if (!nomeFornecedorFinal && nota.fornecedor_id) {
      const fornecedor = fornecedores.find(x => x.id == nota.fornecedor_id);
      if (fornecedor) nomeFornecedorFinal = fornecedor.nome_empresa;
    }

    setSendingEmail(true);

    try {
      await axios.post(`${API_URL}/enviar-email`, {
        tipo: 'gopa',
        id: nota.id,
        numero_nota: nota.numero_nota,
        fornecedor: nomeFornecedorFinal || 'Fornecedor',
        valor: nota.valor,
        vencimento: nota.data_vencimento,
        numero_pedido: nota.numero_pedido,
        numero_medicao: nota.numero_medicao,
        arquivos: [nota.arquivo_nota, nota.arquivo_boleto],
      }, authConfig);

      mutationStatus.mutate({
        id: nota.id,
        etapa: 'em_analise',
        status: 'Aguardando Confirmação GOPA',
      });
      addToast('success', 'E-mail enviado para GOPA e nota enviada para análise!');
    } catch (error) {
      console.error(error);
      addToast('error', 'Falha ao enviar e-mail para GOPA.');
    } finally {
      setSendingEmail(false);
    }
  };

  // --- PERFORMANCE: DADOS ENRIQUECIDOS (Memoized) ---
  // Cruza IDs com Nomes apenas quando as listas mudam, evitando travamentos no render
  const solicitacoesCompletas = useMemo(() => {
    return solicitacoes.map(sol => {
        const fornecedorEncontrado = fornecedores.find(f => f.id === sol.fornecedor_id);
        const filialEncontrada = filiais.find(f => f.id === sol.filial_id);
        return {
            ...sol,
            fornecedor: sol.fornecedor || fornecedorEncontrado, 
            filial: sol.filial || filialEncontrada
        };
    });
  }, [solicitacoes, fornecedores, filiais]);

  if (loadingInit) return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
      <CircularProgress size={44} />
    </Box>
  );
  if (!token) return <LoginScreen onLogin={handleLogin} addToast={addToast} />;

// --- TRADUÇÃO DOS TÍTULOS DO RODAPÉ ---
  const titulosRodape = {
      'dashboard': 'Página Inicial',
      'notas': 'Lançamentos',
      'contratos': 'Contratos',
      'subcontratos': 'Subcontratos',
      'solicitacoes': 'Solicitações de Compra',
      'filiais': 'Gerenciar Filiais',
      'fornecedores': 'Gerenciar Fornecedores',
      'usuarios': 'Gerenciar Usuários'
  };


  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <ToastContainer toasts={toasts} removeToast={(id) => setToasts(p => p.filter(t => t.id !== id))} />
        <ConfirmDialog isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} onConfirm={confirmConfig.onConfirm} onCancel={() => setConfirmConfig(p => ({...p, isOpen: false}))} />
        {loadingNotas && currentView === 'notas' && (
            <Box sx={{ position: 'fixed', inset: 0, zIndex: 1600, display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,255,255,0.72)' }}>
                <CircularProgress size={44} />
            </Box>
        )}
        
        <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} currentView={currentView} setActiveView={setCurrentView} onLogout={handleLogout} />
        
        <Box component="main" sx={{ flex: 1, minWidth: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header 
                currentView={currentView} 
                onOpenMenu={() => setIsMenuOpen(true)}
                termoBusca={termoBusca} 
                setTermoBusca={setTermoBusca} 
                onNovoLancamento={() => { setForm(initialFormLancamento); setShowModal(true); }}
                onNovaSolicitacao={() => { setFormSolicitacao(initialFormSolicitacao); setShowModalSolicitacao(true); }}
                onRefresh={handleManualRefresh}
                notificacoes={notificacoes}
                onNotificationClick={abrirNotificacao}
            />

            <Box sx={{ width: '100%', maxWidth: 1680, mx: 'auto', px: { xs: 2, md: 3 }, py: 3, pb: 8 }}>
                {/* Busca Global só aparece se não estiver nas Views com Filtro Local */}
                {termoBusca.length > 2 && currentView !== 'dashboard' && currentView !== 'notas' && currentView !== 'solicitacoes' ? (
                    <SearchResultsView termoBusca={termoBusca} carregando={carregandoBusca} resultados={dadosBusca} onEditar={abrirEdicaoLancamento} />
                ) : (
                    <>
                        {currentView === 'dashboard' && (
                            <DashboardView 
                                notas={dadosDashboard} 
                                solicitacoes={solicitacoes} 
                                filiais={filiais}
                                fornecedores={fornecedores}
                            />
                        )}

                        {currentView === 'notas' && (
                            <NotasView 
                                notas={dadosNotas} 
                                competencia={competenciaNotas}
                                setCompetencia={setCompetenciaNotas}
                                filiais={filiais}
                                filialFiltro={filialFiltro}
                                setFilialFiltro={setFilialFiltro}
                                statusFiltro={statusFiltro}
                                setStatusFiltro={setStatusFiltro}
                                onEditar={abrirEdicaoLancamento}
                                onDuplicar={duplicarNota}
                                onCopiarProtheus={(n) => navigator.clipboard.writeText(`${n.fornecedor?.nome_empresa} | CPF/CNPJ: ${n.cnpj_usado||'?'} | NF: ${n.numero_nota} | Valor R$: ${n.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}`).then(()=>addToast('success', "Copiado!"))}
                                onEnviarEmail={handleEnviarEmail}
                                onEnviarEmailGopa={handleEnviarEmailGopa}
                                onDownload={(path) => window.open(path.startsWith('http') ? path : `${API_URL}/${path}`, '_blank')}
                                onStatusChange={(id, st) => mutationStatus.mutate({id, status: st})}
                                onEtapaChange={(id, etapa, status) => mutationStatus.mutate({id, etapa, status})}
                                onSalvarInline={salvarLancamentoInline}
                                isGopaFunc={isGopaFunc}
                                busca={termoBusca}
                                onRefresh={handleManualRefresh}
                                addToast={addToast}
                            />
                        )}

                        {currentView === 'contratos' && (
                            <ContratosView
                                mode="contratos"
                                contratos={contratos}
                                filiais={filiais}
                                fornecedores={fornecedores}
                                onLoadFornecedores={() => setContratosPrecisaFornecedores(true)}
                                lancamentos={lancamentosContrato}
                                selectedContrato={selectedContrato}
                                setSelectedContrato={setSelectedContrato}
                                onSalvar={(contrato) => mutationContrato.mutate(contrato)}
                                onGerarCompetencia={(contratoId, competencia) => mutationGerarCompetencia.mutate({ contratoId, competencia })}
                                onEditarLancamento={abrirEdicaoLancamento}
                            />
                        )}

                        {currentView === 'subcontratos' && (
                            <ContratosView
                                mode="subcontratos"
                                contratos={contratos}
                                filiais={filiais}
                                fornecedores={fornecedores}
                                onLoadFornecedores={() => setContratosPrecisaFornecedores(true)}
                                lancamentos={lancamentosContrato}
                                selectedContrato={selectedContrato}
                                setSelectedContrato={setSelectedContrato}
                                onSalvar={(contrato) => mutationContrato.mutate(contrato)}
                                onGerarCompetencia={(contratoId, competencia) => mutationGerarCompetencia.mutate({ contratoId, competencia })}
                                onEditarLancamento={abrirEdicaoLancamento}
                            />
                        )}

                        {currentView === 'solicitacoes' && (
                             <SolicitacoesView 
                                solicitacoes={solicitacoesCompletas} // Usa lista enriquecida (Memoized)
                                busca={termoBusca}
                                onNovaSolicitacao={() => { setFormSolicitacao(initialFormSolicitacao); setShowModalSolicitacao(true); }} 
                                onEditarSolicitacao={(s) => { setFormSolicitacao(s); setShowModalSolicitacao(true); }} 
                            />
                        )}

                        {currentView === 'filiais' && <FiliaisView filiais={filiais} onSalvar={(f) => mutationFilial.mutate(f)} onExcluir={(f) => openConfirm("Excluir Filial", `Deseja excluir ${f.nome_fantasia}?`, () => axios.delete(`${API_URL}/filiais/${f.id}`, authConfig).then(() => { queryClient.invalidateQueries({ queryKey: ['filiais'] }); addToast('success', 'Filial excluída!'); }))} />}
                        {currentView === 'fornecedores' && <FornecedoresView fornecedores={fornecedores} onSalvar={(f) => mutationFornecedor.mutate(f)} onExcluir={(f) => openConfirm("Excluir Fornecedor", `Deseja excluir ${f.nome_empresa}?`, () => axios.delete(`${API_URL}/fornecedores/${f.id}`, authConfig).then(() => { queryClient.invalidateQueries({ queryKey: ['fornecedores'] }); addToast('success', 'Fornecedor excluído!'); }))} />}
                        {currentView === 'usuarios' && <UsuariosView usuarios={usuarios} onCriarUsuario={(u) => mutationUsuario.mutate(u)} onToggleStatus={(id, novoStatus) => mutationUsuarioStatus.mutate({ id, ativo: novoStatus })} onExcluirUsuario={(u) => openConfirm("Excluir Usuário", `Tem certeza que deseja excluir ${u.nome_completo}?`, () => mutationDeleteUsuario.mutate(u.id))} />}
                    </>
                )}
            </Box>
            <Box component="footer" sx={{ mt: 'auto', borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', py: 1.5, px: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    © {new Date().getFullYear()} Cicopal | Gestão de Notas - {titulosRodape[currentView] || 'Sistema'}
                </Typography>
            </Box>
        </Box>
        
        {/* Modais são renderizados condicionalmente ou via Portal, mas o Dynamic Import cuida do carregamento do JS */}
        {showModal && <ModalLancamento isOpen={showModal} onClose={() => setShowModal(false)} form={form} setForm={setForm} filiais={filiais} fornecedores={fornecedores} opcoesFornecedor={opcoesFornecedor} onFornecedorChange={handleFornecedorChange} onSalvar={salvarLancamento} onSalvarEEnviar={salvarEEnviar} sendingEmail={sendingEmail} addToast={addToast} isGopa={isGopaFunc({filial_id: form.filial_id})} />}
        {showModalSolicitacao && <ModalSolicitacao isOpen={showModalSolicitacao} onClose={() => setShowModalSolicitacao(false)} form={formSolicitacao} setForm={setFormSolicitacao} filiais={filiais} fornecedores={fornecedores} onSalvar={() => mutationSolicitacao.mutate(formSolicitacao)} onFornecedorChange={handleFornecedorSolicitacaoChange} />}
    </Box>
  );
}

export default function Home() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider theme={sharepointTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <DashboardContent />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

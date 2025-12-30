'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react'; 

import { API_URL } from '@/utils/constants';

import LoginScreen from '@/components/ui/LoginScreen';
import ToastContainer from '@/components/ui/ToastContainer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

import DashboardView from '@/components/views/DashboardView';
import NotasView from '@/components/views/NotasView'; 
import SearchResultsView from '@/components/views/SearchResultsView';
import SolicitacoesView from '@/components/views/SolicitacoesView';
import FiliaisView from '@/components/views/FiliaisView';
import FornecedoresView from '@/components/views/FornecedoresView';
import UsuariosView from '@/components/views/UsuariosView';

import ModalLancamento from '@/components/modals/ModalLancamento';
import ModalSolicitacao from '@/components/modals/ModalSolicitacao';

const initialFormLancamento = { id: null, filial_id: '', fornecedor_id: '', cnpj_usado: '', contrato_usado: '', centro_custo_usado: '', numero_nota: '', serie: 'U', valor: '', data_envio: '', data_vencimento: '', descricao_servico: '', servico_protheus: '', numero_medicao: '', numero_pedido: '', solicitacao_fluig: '', observacao: '', status_pagamento: 'Pendente Lançamento', arquivo_nota: '', arquivo_boleto: '', repetir_por: '1' };
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
  const [termoBusca, setTermoBusca] = useState(''); // Estado global da busca

  // MODAIS
  const [showModal, setShowModal] = useState(false); 
  const [showModalSolicitacao, setShowModalSolicitacao] = useState(false);
  const [form, setForm] = useState(initialFormLancamento);
  const [formSolicitacao, setFormSolicitacao] = useState(initialFormSolicitacao);
  const [opcoesFornecedor, setOpcoesFornecedor] = useState({ cnpjs: [], contratos: [], ccs: [] });
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  // --- EFEITOS ---
  useEffect(() => { const timer = setTimeout(() => { const storedToken = localStorage.getItem('token'); if (storedToken) setToken(storedToken); setLoadingInit(false); }, 0); return () => clearTimeout(timer); }, []);

  // 1. CORREÇÃO: Limpa a busca automaticamente ao trocar de aba (Evita "Cache" de busca)
  useEffect(() => {
    setTermoBusca('');
  }, [currentView]);

  const addToast = useCallback((type, message) => { const id = Date.now(); setToasts(prev => [...prev, { id, type, message }]); setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000); }, []);
  const openConfirm = (title, message, action) => { setConfirmConfig({ isOpen: true, title, message, onConfirm: () => { action(); setConfirmConfig(p => ({...p, isOpen: false})); } }); };
  const handleLogin = (t) => { localStorage.setItem('token', t); setToken(t); };
  const handleLogout = () => { localStorage.removeItem('token'); setToken(null); queryClient.clear(); };

  // --- QUERIES ---
// 1. Filiais: Só busca de novo após 10 minutos
  const { data: filiais = [] } = useQuery({ 
      queryKey: ['filiais'], 
      queryFn: () => axios.get(`${API_URL}/filiais/`, authConfig).then(res => res.data), 
      staleTime: 1000 * 60 * 10, // <--- ADICIONE ISSO (10 min)
      enabled: !!token 
  });

  // 2. Fornecedores: Só busca de novo após 5 minutos
  const { data: fornecedores = [] } = useQuery({ 
      queryKey: ['fornecedores'], 
      queryFn: () => axios.get(`${API_URL}/fornecedores/`, authConfig).then(res => res.data), 
      staleTime: 1000 * 60 * 5, // <--- ADICIONE ISSO (5 min)
      enabled: !!token 
  });
  
  
  const { data: usuarios = [] } = useQuery({ queryKey: ['usuarios'], queryFn: () => axios.get(`${API_URL}/usuarios/`, authConfig).then(res => res.data), enabled: !!token && currentView === 'usuarios' });
  
  // DADOS PARA NOTAS
  const { data: dadosNotas = [], isLoading: loadingNotas } = useQuery({ 
      queryKey: ['notas_operacional', filialFiltro, competenciaNotas.getMonth(), competenciaNotas.getFullYear()], 
      queryFn: async () => { 
          const params = { filial_id: filialFiltro || undefined, mes: competenciaNotas.getMonth() + 1, ano: competenciaNotas.getFullYear() }; 
          const res = await axios.get(`${API_URL}/dados-agrupados/`, { ...authConfig, params }); 
          let lista = []; 
          res.data.forEach(forn => { if(forn.lancamentos) forn.lancamentos.forEach(nota => lista.push({ ...nota, nome_fornecedor: forn.nome_empresa })); }); 
          return lista; 
      }, 
      enabled: !!token && currentView === 'notas' // Mantém carregado mesmo buscando
  });

  const { data: dadosDashboard = [] } = useQuery({ 
      queryKey: ['dashboard_full'], 
      queryFn: async () => { 
        const res = await axios.get(`${API_URL}/lancamentos/`, authConfig); 
        return res.data; 
      }, 
      enabled: !!token && currentView === 'dashboard'
  });

  // BUSCA GLOBAL
  const { data: dadosBusca = [], isFetching: carregandoBusca } = useQuery({ queryKey: ['busca', termoBusca], queryFn: async () => { if (!termoBusca) return []; const res = await axios.get(`${API_URL}/lancamentos/?busca=${termoBusca}`, authConfig); return res.data; }, enabled: !!token && termoBusca.length > 2 });

  // 2. CORREÇÃO: SOLICITAÇÕES (Baixa TUDO para filtrar no Front e permitir Enriquecimento)
  const { data: solicitacoes = [] } = useQuery({ 
      queryKey: ['solicitacoes'], 
      queryFn: async () => { 
          // Removido params de busca daqui para filtrar localmente
          const res = await axios.get(`${API_URL}/solicitacoes`, authConfig); 
          return res.data; 
      }, 
      enabled: !!token 
  });

  // --- HELPER: REFRESH MANUAL E AUTOMÁTICO ---
  const atualizarListas = async () => {
      // O 'exact: false' força a atualização de qualquer lista derivada dessas chaves
      await queryClient.invalidateQueries({ queryKey: ['notas_operacional'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['dashboard_full'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['solicitacoes'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['busca'], exact: false });
  };

  const handleManualRefresh = async () => {
      addToast('info', 'Sincronizando dados...');
      await atualizarListas();
      setTimeout(() => addToast('success', 'Dados atualizados!'), 500);
  };

  // --- MUTATIONS ---
  const mutationLancamento = useMutation({ mutationFn: (nota) => nota.id ? axios.put(`${API_URL}/lancamentos/${nota.id}`, nota, authConfig) : axios.post(`${API_URL}/lancamentos/`, nota, authConfig), onSuccess: () => { atualizarListas(); }});
  
  const mutationStatus = useMutation({ 
      mutationFn: ({id, status}) => axios.patch(`${API_URL}/lancamentos/${id}/status`, { status }, authConfig), 
      onSuccess: () => { 
          atualizarListas(); 
          addToast('success', 'Status atualizado!'); 
      } 
  });

  const mutationFilial = useMutation({ mutationFn: (data) => data.id ? axios.put(`${API_URL}/filiais/${data.id}`, data, authConfig) : axios.post(`${API_URL}/filiais/`, data, authConfig), onSuccess: () => { queryClient.invalidateQueries(['filiais']); addToast('success', 'Filial salva!'); } });
  const mutationFornecedor = useMutation({ mutationFn: (data) => data.id ? axios.put(`${API_URL}/fornecedores/${data.id}`, data, authConfig) : axios.post(`${API_URL}/fornecedores/`, data, authConfig), onSuccess: () => { queryClient.invalidateQueries(['fornecedores']); addToast('success', 'Fornecedor salvo!'); } });
  
  const mutationSolicitacao = useMutation({ 
      mutationFn: (dados) => dados.id ? axios.put(`${API_URL}/solicitacoes/${dados.id}`, dados, authConfig) : axios.post(`${API_URL}/solicitacoes/`, dados, authConfig), 
      onSuccess: () => { 
          atualizarListas(); 
          addToast('success', 'Solicitação salva!'); 
          setShowModalSolicitacao(false); 
      }, 
      onError: (err) => addToast('error', 'Erro ao salvar: ' + err.message) 
  });

  const mutationUsuario = useMutation({ mutationFn: (dados) => axios.post(`${API_URL}/usuarios/`, dados, authConfig), onSuccess: () => { queryClient.invalidateQueries(['usuarios']); addToast('success', 'Usuário criado!'); }, onError: () => addToast('error', 'Erro ao criar usuário.') });
  const mutationUsuarioStatus = useMutation({ mutationFn: ({ id, ativo }) => axios.put(`${API_URL}/usuarios/${id}`, { ativo }, authConfig), onSuccess: () => { queryClient.invalidateQueries(['usuarios']); addToast('success', 'Acesso atualizado!'); }, onError: () => addToast('error', 'Erro ao atualizar acesso.') });
  const mutationDeleteUsuario = useMutation({ mutationFn: (id) => axios.delete(`${API_URL}/usuarios/${id}`, authConfig), onSuccess: () => { queryClient.invalidateQueries(['usuarios']); addToast('success', 'Usuário excluído!'); }, onError: () => addToast('error', 'Erro ao excluir usuário.') });

  // HELPERS
  const isGopaFunc = (nota) => { const fId = nota.filial_id || (form && form.filial_id); const filial = filiais.find(f => f.id == fId); return filial?.nome_fantasia?.toUpperCase().includes('GOPA') || filial?.nome_fantasia?.toUpperCase().includes('REFRESA'); };
  const handleFornecedorChange = (id) => { const forn = fornecedores.find(f => f.id == id); if (forn) { setOpcoesFornecedor({ cnpjs: (forn.lista_cnpjs || '').split(';'), contratos: (forn.lista_contratos || '').split(';'), ccs: (forn.lista_centro_custos || '').split(';') }); setForm(p => ({ ...p, fornecedor_id: id, cnpj_usado: '', contrato_usado: '', centro_custo_usado: '', descricao_servico: forn.padrao_descricao_servico || '', servico_protheus: forn.padrao_servico_protheus || '' })); } else { setForm(p => ({...p, fornecedor_id: id})); } };
  const handleFornecedorSolicitacaoChange = (id) => { const forn = fornecedores.find(f => f.id == id); if (forn) { setFormSolicitacao(prev => ({ ...prev, fornecedor_id: id, cnpj: (forn.lista_cnpjs || '').split(';')[0] || '', centro_custo: (forn.lista_centro_custos || '').split(';')[0] || '', servico: forn.padrao_descricao_servico || '', servico_protheus: forn.padrao_servico_protheus || '' })); } else { setFormSolicitacao(prev => ({ ...prev, fornecedor_id: id })); } };
  
  const abrirEdicaoLancamento = (nota) => { handleFornecedorChange(nota.fornecedor_id); setTimeout(() => setForm({...nota, data_envio: nota.data_envio ? nota.data_envio.split('T')[0] : '', data_vencimento: nota.data_vencimento.split('T')[0]}), 50); setShowModal(true); };
  const duplicarNota = (nota) => { openConfirm("Duplicar Lançamento", "Deseja criar uma cópia?", () => { handleFornecedorChange(nota.fornecedor_id); setTimeout(() => setForm({ ...nota, id: null, numero_nota: '', arquivo_nota: '', arquivo_boleto: '', data_envio: '', status_pagamento: 'Pendente Lançamento', repetir_por: '1' }), 50); setShowModal(true); }); };
  const salvarLancamento = async () => { if (!form.filial_id || !form.fornecedor_id || !form.valor || !form.numero_nota) return addToast('error', 'Preencha os campos obrigatórios!'); const payload = { ...form, data_envio: form.data_envio === '' ? null : form.data_envio }; try { await mutationLancamento.mutateAsync(payload); addToast('success', 'Lançamento salvo!'); setShowModal(false); } catch { addToast('error', 'Erro ao salvar.'); } };
  const salvarEEnviar = async () => { if (!form.arquivo_nota) return addToast('error', 'Anexe a nota fiscal para enviar.'); const payload = { ...form, data_envio: form.data_envio === '' ? null : form.data_envio }; try { setSendingEmail(true); const response = await mutationLancamento.mutateAsync(payload); const notaSalva = response.data; await handleEnviarEmail({...payload, id: notaSalva.id || form.id}); setShowModal(false); } catch (e) { addToast('error', 'Erro no processo Salvar/Enviar.'); } finally { setSendingEmail(false); } };

  // 3. CORREÇÃO: ENVIO DE EMAIL (Resolução do nome do fornecedor)
  const handleEnviarEmail = async (dadosNota) => {
    const nota = dadosNota || form;
    if (!nota.id || !nota.arquivo_nota) return addToast('error', 'Salve a nota e anexe arquivos.');
    setSendingEmail(true);
    
    try {
      // Garante que temos o nome do fornecedor
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

  // 4. CORREÇÃO: ENRIQUECIMENTO DE DADOS PARA SOLICITAÇÕES
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
}, [solicitacoes, fornecedores, filiais]); // Só recalcula se um desses mudar

  if (loadingInit) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-[#1E22A8]" size={48}/></div>;
  if (!token) return <LoginScreen onLogin={handleLogin} addToast={addToast} />;

  return (
    <div className="flex min-h-screen bg-[#F0F2F5] font-sans">
        <ToastContainer toasts={toasts} removeToast={(id) => setToasts(p => p.filter(t => t.id !== id))} />
        <ConfirmDialog isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} onConfirm={confirmConfig.onConfirm} onCancel={() => setConfirmConfig(p => ({...p, isOpen: false}))} />
        {loadingNotas && currentView === 'notas' && <div className="fixed inset-0 bg-white/80 z-[60] flex items-center justify-center"><Loader2 className="animate-spin text-[#1E22A8]" size={48}/></div>}
        
        <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} currentView={currentView} setActiveView={setCurrentView} onLogout={handleLogout} />
        
        <main className="flex-1 max-h-screen overflow-y-auto w-full transition-all flex flex-col">
            <Header 
                currentView={currentView} 
                onOpenMenu={() => setIsMenuOpen(true)}
                termoBusca={termoBusca} 
                setTermoBusca={setTermoBusca} 
                onNovoLancamento={() => { setForm(initialFormLancamento); setShowModal(true); }}
                onNovaSolicitacao={() => { setFormSolicitacao(initialFormSolicitacao); setShowModalSolicitacao(true); }}
                onRefresh={handleManualRefresh} // Botão de Refresh no Header
            />

            <div className="p-8 max-w-[1600px] mx-auto pb-24 w-full">
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
                                onDownload={(path) => window.open(path.startsWith('http') ? path : `${API_URL}/${path}`, '_blank')}
                                onStatusChange={(id, st) => mutationStatus.mutate({id, status: st})}
                                isGopaFunc={isGopaFunc}
                                busca={termoBusca} // Envia busca para filtro local
                                onRefresh={handleManualRefresh}
                            />
                        )}

                        {currentView === 'solicitacoes' && (
                             <SolicitacoesView 
                                solicitacoes={solicitacoesCompletas} // Usa lista enriquecida (com nomes)
                                busca={termoBusca}
                                onNovaSolicitacao={() => { setFormSolicitacao(initialFormSolicitacao); setShowModalSolicitacao(true); }} 
                                onEditarSolicitacao={(s) => { setFormSolicitacao(s); setShowModalSolicitacao(true); }} 
                            />
                        )}

                        {currentView === 'filiais' && <FiliaisView filiais={filiais} onSalvar={(f) => mutationFilial.mutate(f)} onExcluir={(f) => openConfirm("Excluir Filial", `Deseja excluir ${f.nome_fantasia}?`, () => axios.delete(`${API_URL}/filiais/${f.id}`, authConfig).then(() => { queryClient.invalidateQueries(['filiais']); addToast('success', 'Filial excluída!'); }))} />}
                        {currentView === 'fornecedores' && <FornecedoresView fornecedores={fornecedores} onSalvar={(f) => mutationFornecedor.mutate(f)} onExcluir={(f) => openConfirm("Excluir Fornecedor", `Deseja excluir ${f.nome_empresa}?`, () => axios.delete(`${API_URL}/fornecedores/${f.id}`, authConfig).then(() => { queryClient.invalidateQueries(['fornecedores']); addToast('success', 'Fornecedor excluído!'); }))} />}
                        {currentView === 'usuarios' && <UsuariosView usuarios={usuarios} onCriarUsuario={(u) => mutationUsuario.mutate(u)} onToggleStatus={(id, novoStatus) => mutationUsuarioStatus.mutate({ id, ativo: novoStatus })} onExcluirUsuario={(u) => openConfirm("Excluir Usuário", `Tem certeza que deseja excluir ${u.nome_completo}?`, () => mutationDeleteUsuario.mutate(u.id))} />}
                    </>
                )}
            </div>
            <footer className="mt-auto py-6 text-center text-gray-500 text-sm font-medium border-t border-gray-200 bg-white">© {new Date().getFullYear()} <span className="font-bold text-[#1E22A8]">Cicopal</span> <span className="mx-2 text-gray-300">|</span> GESTÃO DE NOTAS 🤖</footer>
        </main>
        
        <ModalLancamento isOpen={showModal} onClose={() => setShowModal(false)} form={form} setForm={setForm} filiais={filiais} fornecedores={fornecedores} opcoesFornecedor={opcoesFornecedor} onFornecedorChange={handleFornecedorChange} onSalvar={salvarLancamento} onSalvarEEnviar={salvarEEnviar} sendingEmail={sendingEmail} addToast={addToast} isGopa={isGopaFunc({filial_id: form.filial_id})} />
        <ModalSolicitacao isOpen={showModalSolicitacao} onClose={() => setShowModalSolicitacao(false)} form={formSolicitacao} setForm={setFormSolicitacao} filiais={filiais} fornecedores={fornecedores} onSalvar={() => mutationSolicitacao.mutate(formSolicitacao)} onFornecedorChange={handleFornecedorSolicitacaoChange} />
    </div>
  );
}

export default function Home() { const [queryClient] = useState(() => new QueryClient()); return ( <QueryClientProvider client={queryClient}> <DashboardContent /> </QueryClientProvider> ); }
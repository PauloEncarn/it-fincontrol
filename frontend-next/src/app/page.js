'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader2, Menu } from 'lucide-react'; // <--- Menu importado

// --- IMPORTS (Mantenha seus caminhos) ---
import { API_URL } from '@/utils/constants';
import LoginScreen from '@/components/ui/LoginScreen';
import ToastContainer from '@/components/ui/ToastContainer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import DashboardView from '@/components/views/DashboardView';
import SearchResultsView from '@/components/views/SearchResultsView';
import SolicitacoesView from '@/components/views/SolicitacoesView';
import FiliaisView from '@/components/views/FiliaisView';
import FornecedoresView from '@/components/views/FornecedoresView';
import UsuariosView from '@/components/views/UsuariosView';
import ModalLancamento from '@/components/modals/ModalLancamento';
import ModalSolicitacao from '@/components/modals/ModalSolicitacao';

// --- DADOS INICIAIS ---
const initialFormLancamento = { 
    id: null, filial_id: '', fornecedor_id: '', cnpj_usado: '', contrato_usado: '', 
    centro_custo_usado: '', numero_nota: '', serie: 'U', valor: '', data_envio: '', 
    data_vencimento: '', descricao_servico: '', servico_protheus: '', numero_medicao: '', 
    numero_pedido: '', solicitacao_fluig: '', observacao: '', status_pagamento: 'Pendente Lançamento', 
    arquivo_nota: '', arquivo_boleto: '', repetir_por: '1' 
};

const initialFormSolicitacao = {
    id: null, filial_id: '', fornecedor_id: '', solicitante: '', cnpj: '', 
    condicao_pagamento: '', valor: '', numero_sc: '', numero_pedido: '', 
    servico: '', servico_protheus: '', centro_custo: '', numero_nota: '', 
    fluig_id: '', data_vencimento: '', status: 'Pendente', observacao: ''
};

function DashboardContent() {
  const queryClient = useQueryClient();
  
  // ESTADOS
  const [token, setToken] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  
  // 🔥 ESTADO DO MENU (ABERTO/FECHADO)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // FILTROS
  const [competencia, setCompetencia] = useState(new Date());
  const [filialFiltro, setFilialFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');

  // MODAIS
  const [showModal, setShowModal] = useState(false); 
  const [showModalSolicitacao, setShowModalSolicitacao] = useState(false);
  const [form, setForm] = useState(initialFormLancamento);
  const [formSolicitacao, setFormSolicitacao] = useState(initialFormSolicitacao);
  const [opcoesFornecedor, setOpcoesFornecedor] = useState({ cnpjs: [], contratos: [], ccs: [] });
  const [sendingEmail, setSendingEmail] = useState(false);

  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const timer = setTimeout(() => { 
        const storedToken = localStorage.getItem('token'); 
        if (storedToken) setToken(storedToken); 
        setLoadingInit(false); 
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const addToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const openConfirm = (title, message, action) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm: () => { action(); setConfirmConfig(p => ({...p, isOpen: false})); } });
  };

  const handleLogin = (t) => { localStorage.setItem('token', t); setToken(t); };
  const handleLogout = () => { localStorage.removeItem('token'); setToken(null); queryClient.clear(); };

  // --- QUERIES E MUTATIONS (MANTIVE IGUAL) ---
  const { data: filiais = [] } = useQuery({ queryKey: ['filiais'], queryFn: () => axios.get(`${API_URL}/filiais/`, authConfig).then(res => res.data), enabled: !!token });
  const { data: fornecedores = [] } = useQuery({ queryKey: ['fornecedores'], queryFn: () => axios.get(`${API_URL}/fornecedores/`, authConfig).then(res => res.data), enabled: !!token });
  const { data: usuarios = [] } = useQuery({ queryKey: ['usuarios'], queryFn: () => axios.get(`${API_URL}/usuarios/`, authConfig).then(res => res.data), enabled: !!token && currentView === 'usuarios' });
  
  const { data: dadosDashboard = [], isLoading: loadingDash } = useQuery({ 
      queryKey: ['dashboard', filialFiltro, competencia.getMonth(), competencia.getFullYear()], 
      queryFn: async () => { 
          const params = { filial_id: filialFiltro || undefined, mes: competencia.getMonth() + 1, ano: competencia.getFullYear() }; 
          const res = await axios.get(`${API_URL}/dados-agrupados/`, { ...authConfig, params }); 
          let lista = []; 
          res.data.forEach(forn => { if(forn.lancamentos) forn.lancamentos.forEach(nota => lista.push({ ...nota, nome_fornecedor: forn.nome_empresa })); }); 
          return lista; 
      }, enabled: !!token && !termoBusca 
  });

  const { data: dadosBusca = [], isFetching: carregandoBusca } = useQuery({ 
      queryKey: ['busca', termoBusca], 
      queryFn: async () => { if (!termoBusca) return []; const res = await axios.get(`${API_URL}/lancamentos/?busca=${termoBusca}`, authConfig); return res.data; }, enabled: !!token && termoBusca.length > 2 
  });

  const { data: solicitacoes = [] } = useQuery({
    queryKey: ['solicitacoes', termoBusca],
    queryFn: async () => { const res = await axios.get(`${API_URL}/solicitacoes`, { params: { busca: termoBusca || undefined }, ...authConfig }); return res.data; }, enabled: !!token && currentView === 'solicitacoes'
  });

  const mutationLancamento = useMutation({ mutationFn: (nota) => nota.id ? axios.put(`${API_URL}/lancamentos/${nota.id}`, nota, authConfig) : axios.post(`${API_URL}/lancamentos/`, nota, authConfig), onSuccess: () => { queryClient.invalidateQueries(['dashboard']); queryClient.invalidateQueries(['busca']); }});
  const mutationStatus = useMutation({ mutationFn: ({id, status}) => axios.patch(`${API_URL}/lancamentos/${id}/status`, { status }, authConfig), onSuccess: () => { queryClient.invalidateQueries(['dashboard']); queryClient.invalidateQueries(['busca']); addToast('success', 'Status atualizado!'); } });
  const mutationFilial = useMutation({ mutationFn: (data) => data.id ? axios.put(`${API_URL}/filiais/${data.id}`, data, authConfig) : axios.post(`${API_URL}/filiais/`, data, authConfig), onSuccess: () => { queryClient.invalidateQueries(['filiais']); addToast('success', 'Filial salva!'); } });
  const mutationFornecedor = useMutation({ mutationFn: (data) => data.id ? axios.put(`${API_URL}/fornecedores/${data.id}`, data, authConfig) : axios.post(`${API_URL}/fornecedores/`, data, authConfig), onSuccess: () => { queryClient.invalidateQueries(['fornecedores']); addToast('success', 'Fornecedor salvo!'); } });
  const mutationSolicitacao = useMutation({ mutationFn: (dados) => dados.id ? axios.put(`${API_URL}/solicitacoes/${dados.id}`, dados, authConfig) : axios.post(`${API_URL}/solicitacoes/`, dados, authConfig), onSuccess: () => { queryClient.invalidateQueries(['solicitacoes']); addToast('success', 'Solicitação salva!'); setShowModalSolicitacao(false); }, onError: (err) => addToast('error', 'Erro ao salvar: ' + err.message) });
  const mutationUsuario = useMutation({ mutationFn: (dados) => axios.post(`${API_URL}/usuarios/`, dados, authConfig), onSuccess: () => { queryClient.invalidateQueries(['usuarios']); addToast('success', 'Usuário criado!'); }, onError: () => addToast('error', 'Erro ao criar usuário.') });
  const mutationUsuarioStatus = useMutation({ mutationFn: ({ id, ativo }) => axios.put(`${API_URL}/usuarios/${id}`, { ativo }, authConfig), onSuccess: () => { queryClient.invalidateQueries(['usuarios']); addToast('success', 'Acesso atualizado!'); }, onError: () => addToast('error', 'Erro ao atualizar acesso.') });
  const mutationDeleteUsuario = useMutation({ mutationFn: (id) => axios.delete(`${API_URL}/usuarios/${id}`, authConfig), onSuccess: () => { queryClient.invalidateQueries(['usuarios']); addToast('success', 'Usuário excluído!'); }, onError: () => addToast('error', 'Erro ao excluir usuário.') });

  // FUNÇÕES AUXILIARES
  const isGopaFunc = (nota) => { const fId = nota.filial_id || (form && form.filial_id); const filial = filiais.find(f => f.id == fId); return filial?.nome_fantasia?.toUpperCase().includes('GOPA') || filial?.nome_fantasia?.toUpperCase().includes('REFRESA'); };
  const handleFornecedorChange = (id) => { const forn = fornecedores.find(f => f.id == id); if (forn) { setOpcoesFornecedor({ cnpjs: (forn.lista_cnpjs || '').split(';'), contratos: (forn.lista_contratos || '').split(';'), ccs: (forn.lista_centro_custos || '').split(';') }); setForm(p => ({ ...p, fornecedor_id: id, cnpj_usado: '', contrato_usado: '', centro_custo_usado: '', descricao_servico: forn.padrao_descricao_servico || '', servico_protheus: forn.padrao_servico_protheus || '' })); } else { setForm(p => ({...p, fornecedor_id: id})); } };
  const handleFornecedorSolicitacaoChange = (id) => { const forn = fornecedores.find(f => f.id == id); if (forn) { setFormSolicitacao(prev => ({ ...prev, fornecedor_id: id, cnpj: (forn.lista_cnpjs || '').split(';')[0] || '', centro_custo: (forn.lista_centro_custos || '').split(';')[0] || '', servico: forn.padrao_descricao_servico || '', servico_protheus: forn.padrao_servico_protheus || '' })); } else { setFormSolicitacao(prev => ({ ...prev, fornecedor_id: id })); } };
  const abrirEdicaoLancamento = (nota) => { handleFornecedorChange(nota.fornecedor_id); setTimeout(() => setForm({...nota, data_envio: nota.data_envio ? nota.data_envio.split('T')[0] : '', data_vencimento: nota.data_vencimento.split('T')[0]}), 50); setShowModal(true); };
  const duplicarNota = (nota) => { openConfirm("Duplicar Lançamento", "Deseja criar uma cópia?", () => { handleFornecedorChange(nota.fornecedor_id); setTimeout(() => setForm({ ...nota, id: null, numero_nota: '', arquivo_nota: '', arquivo_boleto: '', data_envio: '', status_pagamento: 'Pendente Lançamento', repetir_por: '1' }), 50); setShowModal(true); }); };
  const salvarLancamento = async () => { if (!form.filial_id || !form.fornecedor_id || !form.valor || !form.numero_nota) return addToast('error', 'Preencha os campos obrigatórios!'); const payload = { ...form, data_envio: form.data_envio === '' ? null : form.data_envio }; try { await mutationLancamento.mutateAsync(payload); addToast('success', 'Lançamento salvo!'); setShowModal(false); } catch { addToast('error', 'Erro ao salvar.'); } };
  const salvarEEnviar = async () => { if (!form.arquivo_nota) return addToast('error', 'Anexe a nota fiscal para enviar.'); const payload = { ...form, data_envio: form.data_envio === '' ? null : form.data_envio }; try { setSendingEmail(true); const response = await mutationLancamento.mutateAsync(payload); const notaSalva = response.data; await handleEnviarEmail({...payload, id: notaSalva.id || form.id}); setShowModal(false); } catch (e) { addToast('error', 'Erro no processo Salvar/Enviar.'); } finally { setSendingEmail(false); } };
  const handleEnviarEmail = async (dadosNota) => { const nota = dadosNota || form; if (!nota.id || !nota.arquivo_nota) return addToast('error', 'Salve a nota e anexe arquivos.'); setSendingEmail(true); try { await axios.post(`${API_URL}/enviar-email`, { numero_nota: nota.numero_nota, fornecedor: nota.nome_fornecedor, valor: nota.valor, vencimento: nota.data_vencimento, arquivos: [nota.arquivo_nota, nota.arquivo_boleto] }, authConfig); if(form.id === nota.id) setForm(p => ({...p, status_pagamento: 'Email Enviado p/ Balança'})); mutationStatus.mutate({id: nota.id, status: 'Email Enviado p/ Balança'}); addToast('success', 'E-mail enviado!'); } catch { addToast('error', 'Falha ao enviar.'); } finally { setSendingEmail(false); } };
  const getGroupedData = () => { const notas = statusFiltro.length ? dadosDashboard.filter(n => statusFiltro.includes(n.status_pagamento)) : dadosDashboard; const grupos = {}; notas.forEach(n => { if(!grupos[n.nome_fornecedor]) grupos[n.nome_fornecedor]=[]; grupos[n.nome_fornecedor].push(n); }); return Object.entries(grupos).sort((a,b) => a[0].localeCompare(b[0])); };

  if (loadingInit) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-[#1E22A8]" size={48}/></div>;
  if (!token) return <LoginScreen onLogin={handleLogin} addToast={addToast} />;

 return (
    <div className="flex min-h-screen bg-[#F0F2F5] font-sans relative">
        <ToastContainer toasts={toasts} removeToast={(id) => setToasts(p => p.filter(t => t.id !== id))} />
        <ConfirmDialog isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} onConfirm={confirmConfig.onConfirm} onCancel={() => setConfirmConfig(p => ({...p, isOpen: false}))} />
        
        {loadingDash && <div className="fixed inset-0 bg-white/80 z-[60] flex items-center justify-center"><Loader2 className="animate-spin text-[#1E22A8]" size={48}/></div>}

        {/* SIDEBAR (GAVETA) */}
        <Sidebar 
            isOpen={isMenuOpen} 
            onClose={() => setIsMenuOpen(false)} 
            currentView={currentView}
            setActiveView={setCurrentView} 
            activeView={currentView}
            onLogout={handleLogout}
        />

        {/* ÁREA PRINCIPAL */}
        <main className="flex-1 max-h-screen overflow-y-auto w-full transition-all flex flex-col">
            
            {/* AQUI ESTAVA O HEADER DUPLICADO - REMOVI! AGORA SÓ TEM O HEADER ABAIXO */}

            {/* HEADER UNIFICADO (FILTROS + MENU) */}
            <Header 
                currentView={currentView}
                onOpenMenu={() => setIsMenuOpen(true)} // <--- Passamos a função aqui
                termoBusca={termoBusca}
                setTermoBusca={setTermoBusca}
                filiais={filiais}
                filialFiltro={filialFiltro}
                setFilialFiltro={setFilialFiltro}
                onNovoLancamento={() => { setForm(initialFormLancamento); setShowModal(true); }}
                dadosExportacao={dadosDashboard}
            />

            <div className="p-8 max-w-[1600px] mx-auto pb-24 w-full">
                
                {/* VIEWS (Conteúdo) */}
                {termoBusca.length > 2 && currentView === 'dashboard' ? (
                    <SearchResultsView 
                        termoBusca={termoBusca}
                        carregando={carregandoBusca}
                        resultados={dadosBusca}
                        onEditar={abrirEdicaoLancamento}
                    />
                ) : (
                    <>
                        {currentView === 'dashboard' && (
                            <DashboardView 
                                kpis={dadosDashboard}
                                filtros={statusFiltro}
                                onFilter={(s) => setStatusFiltro(p => p.includes(s) ? p.filter(i => i !== s) : [...p, s])}
                                dadosAgrupados={getGroupedData()}
                                competencia={competencia}
                                setCompetencia={setCompetencia}
                                mudarMes={(d) => { const nd = new Date(competencia); nd.setMonth(competencia.getMonth() + d); setCompetencia(nd); }}
                                onEditar={abrirEdicaoLancamento}
                                onDuplicar={duplicarNota}
                                onCopiarProtheus={(n) => navigator.clipboard.writeText(`${n.fornecedor?.nome_empresa} | CPF/CNPJ: ${n.cnpj_usado||'?'} | NF: ${n.numero_nota} | Valor R$: ${n.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}`).then(()=>addToast('success', "Copiado!"))}
                                onEnviarEmail={handleEnviarEmail}
                                onDownload={(path) => window.open(path.startsWith('http') ? path : `${API_URL}/${path}`, '_blank')}
                                onStatusChange={(id, st) => mutationStatus.mutate({id, status: st})}
                                isGopaFunc={isGopaFunc}
                            />
                        )}

                        {/* ... Mantenha os outros views (Solicitacoes, Filiais, etc) aqui ... */}
                        {currentView === 'solicitacoes' && <SolicitacoesView solicitacoes={solicitacoes} onNovaSolicitacao={() => { setFormSolicitacao(initialFormSolicitacao); setShowModalSolicitacao(true); }} onEditarSolicitacao={(s) => { setFormSolicitacao(s); setShowModalSolicitacao(true); }} />}
                        {currentView === 'filiais' && <FiliaisView filiais={filiais} onSalvar={(f) => mutationFilial.mutate(f)} onExcluir={(f) => openConfirm("Excluir Filial", `Deseja excluir ${f.nome_fantasia}?`, () => axios.delete(`${API_URL}/filiais/${f.id}`, authConfig).then(() => { queryClient.invalidateQueries(['filiais']); addToast('success', 'Filial excluída!'); }))} />}
                        {currentView === 'fornecedores' && <FornecedoresView fornecedores={fornecedores} onSalvar={(f) => mutationFornecedor.mutate(f)} onExcluir={(f) => openConfirm("Excluir Fornecedor", `Deseja excluir ${f.nome_empresa}?`, () => axios.delete(`${API_URL}/fornecedores/${f.id}`, authConfig).then(() => { queryClient.invalidateQueries(['fornecedores']); addToast('success', 'Fornecedor excluído!'); }))} />}
                        {currentView === 'usuarios' && <UsuariosView usuarios={usuarios} onCriarUsuario={(u) => mutationUsuario.mutate(u)} onToggleStatus={(id, novoStatus) => mutationUsuarioStatus.mutate({ id, ativo: novoStatus })} onExcluirUsuario={(u) => openConfirm("Excluir Usuário", `Tem certeza que deseja excluir ${u.nome_completo}?`, () => mutationDeleteUsuario.mutate(u.id))} />}

                    </>
                )}
            </div>

            <footer className="mt-auto py-6 text-center text-gray-500 text-sm font-medium border-t border-gray-200 bg-white">
                © {new Date().getFullYear()} <span className="font-bold text-[#1E22A8]">Cicopal</span> <span className="mx-2 text-gray-300">|</span> GESTÃO DE NOTAS 🤖
            </footer>

        </main>
        
        {/* MODAIS (Mantenha igual) */}
        <ModalLancamento isOpen={showModal} onClose={() => setShowModal(false)} form={form} setForm={setForm} filiais={filiais} fornecedores={fornecedores} opcoesFornecedor={opcoesFornecedor} onFornecedorChange={handleFornecedorChange} onSalvar={salvarLancamento} onSalvarEEnviar={salvarEEnviar} sendingEmail={sendingEmail} addToast={addToast} isGopa={isGopaFunc({filial_id: form.filial_id})} />
        <ModalSolicitacao isOpen={showModalSolicitacao} onClose={() => setShowModalSolicitacao(false)} form={formSolicitacao} setForm={setFormSolicitacao} filiais={filiais} fornecedores={fornecedores} onSalvar={() => mutationSolicitacao.mutate(formSolicitacao)} onFornecedorChange={handleFornecedorSolicitacaoChange} />
    </div>
  );
}

export default function Home() {
  const [queryClient] = useState(() => new QueryClient());
  return ( <QueryClientProvider client={queryClient}> <DashboardContent /> </QueryClientProvider> );
}
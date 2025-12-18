'use client';

import React, { useState, useEffect, useCallback } from 'react';
import BotaoExportar from '@/components/BotaoExportar';
import axios from 'axios';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  ChevronDown, Plus, Server, Menu, Calendar, Clock, AlertTriangle, CheckCircle, X, 
  UploadCloud, FileText, Copy, Edit2, Paperclip, ClipboardList, Loader2, ArrowRight, 
  Building, Users, LogOut, UserPlus, Lock, Trash2, ChevronLeft, ChevronRight, Search,
  AlertCircle, Mail, Send, ShoppingCart
} from 'lucide-react';


// --- CONFIGURAÇÃO ---
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");

// --- CONSTANTES ---
const CORES = { 
  azulCicopal: '#1E22A8',      
  vermelhoCicopal: '#E30613',  
  amareloAlerta: '#F9C531', 
  azulClaro: '#2196F3',
  roxoEmail: '#8B5CF6'
};

const CLEAN_PANEL = "bg-white/95 backdrop-blur-sm border border-white/50 shadow-xl rounded-2xl";
const INPUT_STYLE = "w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1E22A8] focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400";
const LABEL_STYLE = "text-[11px] font-black uppercase text-[#1E22A8] tracking-widest mb-1.5 block ml-1";
const BUTTON_PRIMARY = "bg-[#1E22A8] hover:bg-[#E30613] text-white font-black px-6 py-3 rounded-xl shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider text-sm";

const STATUS_STYLES = {
  'Aguardando Fatura': { bg: 'bg-[#F9C531]/10', border: 'border-[#F9C531]', text: 'text-amber-600', icon: <Clock/> },
  'Pendente Lançamento': { bg: 'bg-[#E30613]/10', border: 'border-[#E30613]', text: 'text-[#E30613]', icon: <AlertTriangle/> },
  'Aguardando Pagamento': { bg: 'bg-[#1E22A8]/10', border: 'border-[#1E22A8]', text: 'text-[#1E22A8]', icon: <Calendar/> },
  'Email Enviado p/ Balança': { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600', icon: <Mail/> },
  'Concluída': { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-600', icon: <CheckCircle/> },
};
const OPCOES_STATUS = ['Aguardando Fatura', 'Pendente Lançamento', 'Aguardando Pagamento', 'Email Enviado p/ Balança', 'Concluída'];
const OPCOES_STATUS_COMPRA = ['Pendente', 'Em Cotação', 'Aprovado', 'Pedido Realizado', 'Entregue', 'Cancelado'];
// --- COMPONENTES VISUAIS ---

const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-24 right-4 z-[110] flex flex-col gap-3 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-xl border-l-4 min-w-[300px] animate-in slide-in-from-right duration-300 bg-white ${t.type === 'error' ? 'border-[#E30613]' : 'border-[#1E22A8]'}`}>
        <div className={`${t.type === 'error' ? 'text-[#E30613]' : 'text-[#1E22A8]'}`}>
          {t.type === 'error' ? <AlertCircle size={24}/> : <CheckCircle size={24}/>}
        </div>
        <div className="flex-1">
          <h4 className={`font-black text-xs uppercase tracking-wider ${t.type === 'error' ? 'text-[#E30613]' : 'text-[#1E22A8]'}`}>{t.type === 'error' ? 'Atenção' : 'Sucesso'}</h4>
          <p className="text-sm font-bold text-slate-700">{t.message}</p>
        </div>
        <button onClick={() => removeToast(t.id)} className="text-slate-300 hover:text-slate-500"><X size={16}/></button>
      </div>
    ))}
  </div>
);

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1E22A8]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border-t-4 border-[#E30613] animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-black text-[#1E22A8] mb-2">{title}</h3>
        <p className="text-slate-600 mb-6 font-medium">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-slate-500 font-bold hover:bg-slate-100 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="px-6 py-2 rounded-lg bg-[#E30613] text-white font-bold hover:bg-[#C2000B] shadow-lg shadow-red-500/30 transition-all active:scale-95">Confirmar</button>
        </div>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin, addToast }) => {
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); const fd = new FormData(); fd.append('username', username); fd.append('password', password); try { const res = await axios.post(`${API_URL}/token`, fd); onLogin(res.data.access_token); } catch { addToast('error', 'Credenciais inválidas'); } finally { setLoading(false); } };
  return (
    <div className="min-h-screen bg-[#1E22A8] flex items-center justify-center p-4 relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-[#E30613]"></div>
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-sm border-t-4 border-t-[#E30613]">
        <div className="flex justify-center mb-8"><Image src="/logo-cicopal.png" alt="Cicopal" width={200} height={80} className="h-16 w-auto object-contain" priority onError={(e) => e.target.style.display = 'none'} /></div>
        <h1 className="text-xl font-bold text-center text-slate-700 mb-8 tracking-tight uppercase">GESTÃO DE NOTAS <span className="text-[#1E22A8]">TI</span></h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="text-left"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Usuário</label><input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-800 font-bold focus:bg-white focus:border-[#1E22A8] outline-none transition-all" value={username} onChange={e => setUsername(e.target.value)} autoFocus/></div>
          <div className="text-left"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Senha</label><input type="password" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-800 font-bold focus:bg-white focus:border-[#1E22A8] outline-none transition-all" value={password} onChange={e => setPassword(e.target.value)}/></div>
          <button type="submit" className={`w-full ${BUTTON_PRIMARY}`} disabled={loading}>{loading ? <Loader2 className="animate-spin" size={18}/> : <Lock size={18}/>} ACESSAR</button>
        </form>
      </div>
    </div>
  );
};

const FileDrop = ({ label, onFileSelect, existingFile, metaData, addToast }) => {
  const [localFile, setLocalFile] = useState(null);
  const displayFileName = localFile ? localFile.name : (existingFile ? existingFile.split('/').pop() : null);
  const handleFile = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!metaData.fornecedor || !metaData.nota) return addToast('error', "Selecione Fornecedor e Nota antes.");
    setLocalFile(file); 
    const fd = new FormData(); fd.append("file", file); fd.append("fornecedor", metaData.fornecedor); fd.append("nota", metaData.nota); fd.append("vencimento", metaData.vencimento || "S_D");
    try { const res = await axios.post(`${API_URL}/upload/`, fd); onFileSelect(res.data.path); addToast('success', 'Arquivo anexado!'); } catch { addToast('error', "Erro no upload"); setLocalFile(null); }
  };
  const theme = displayFileName ? 'border-[#1E22A8] text-[#1E22A8] bg-blue-50' : 'border-slate-300 text-slate-400 bg-slate-50';
  return (<div className="w-full"><label className={LABEL_STYLE}>{label}</label><div className={`relative border-2 border-dashed rounded-xl p-2 hover:bg-white transition-all text-center cursor-pointer group h-[80px] flex flex-col items-center justify-center ${theme}`}><input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFile} accept=".pdf,.png,.jpg"/><div className="flex flex-col items-center justify-center gap-1">{displayFileName ? <CheckCircle size={24}/> : <UploadCloud size={24}/>}<span className="text-[10px] font-bold uppercase truncate max-w-[180px]">{displayFileName || "Arrastar Arquivo"}</span></div></div></div>);
};

const KpiCard = ({ title, count, colorHex, icon, isActive, onClick }) => (
  <div onClick={onClick} className={`bg-white p-6 border-l-[6px] rounded-2xl shadow-sm transition-all duration-200 group relative overflow-hidden cursor-pointer select-none ${isActive ? 'ring-2 ring-[#1E22A8] -translate-y-1' : 'hover:-translate-y-1 hover:shadow-md'}`} style={{ borderColor: colorHex }}>
    {isActive && <div className="absolute top-3 right-3 text-[#1E22A8]"><CheckCircle size={20} fill="#F9C531"/></div>}
    <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity transform rotate-12 scale-[2.5]" style={{ color: colorHex }}>{icon}</div>
    <div className="relative z-10"><p className={`text-[11px] font-black uppercase tracking-widest mb-2 ${isActive ? 'text-[#1E22A8]' : 'text-slate-400'}`}>{title}</p><p className="text-4xl font-black text-[#1E22A8] tracking-tighter">{count}</p></div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

function DashboardContent() {

const initialFormSolicitacao = {
    id: null,
    filial_id: '',
    fornecedor_id: '',
    solicitante: '', // Quem pediu (ex: Gerente)
    cnpj: '',
    condicao_pagamento: '',
    valor: '',
    numero_sc: '',      // Solicitação de Compra
    numero_pedido: '',
    servico: '',        // O que é (Mouse, Manutenção, etc)
    servico_protheus: '',
    centro_custo: '',
    numero_nota: '',    // NFe quando chegar
    fluig_id: '',
    data_vencimento: '',
    status: 'Pendente',
    observacao: ''
  };

  const [formSolicitacao, setFormSolicitacao] = useState(initialFormSolicitacao);
  const [showModalSolicitacao, setShowModalSolicitacao] = useState(false);

  // --- BUSCA DE DADOS (QUERY) ---
  const { data: solicitacoes = [], refetch: refetchSolicitacoes } = useQuery({
    queryKey: ['solicitacoes', termoBusca],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/solicitacoes/${termoBusca ? `?busca=${termoBusca}` : ''}`, authConfig);
      return res.data;
    },
    enabled: !!token && currentView === 'solicitacoes' // Só busca se estiver na aba certa
  });

  // --- SALVAR (MUTATION) ---
  const mutationSolicitacao = useMutation({
    mutationFn: (dados) => {
      if (dados.id) return axios.put(`${API_URL}/solicitacoes/${dados.id}`, dados, authConfig);
      return axios.post(`${API_URL}/solicitacoes/`, dados, authConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['solicitacoes']);
      addToast('success', 'Solicitação salva com sucesso!');
      setShowModalSolicitacao(false);
    },
    onError: (err) => addToast('error', 'Erro ao salvar: ' + err.message)
  });

  // Função auxiliar para preencher dados quando troca o fornecedor na Solicitação
  const handleFornecedorSolicitacao = (id) => {
    const forn = fornecedores.find(f => f.id == id);
    if (forn) {
      setFormSolicitacao(prev => ({
        ...prev,
        fornecedor_id: id,
        cnpj: (forn.lista_cnpjs || '').split(';')[0] || '', // Pega o primeiro CNPJ
        centro_custo: (forn.lista_centro_custos || '').split(';')[0] || '', // Pega o primeiro CC
        servico: forn.padrao_descricao_servico || '',
        servico_protheus: forn.padrao_servico_protheus || ''
      }));
    } else {
      setFormSolicitacao(prev => ({ ...prev, fornecedor_id: id }));
    }
  };

  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [sendingEmail, setSendingEmail] = useState(false);

  const addToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const openConfirm = (title, message, action) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm: () => { action(); setConfirmConfig(p => ({...p, isOpen: false})); } });
  };

  const [loadingInit, setLoadingInit] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => { const storedToken = localStorage.getItem('token'); if (storedToken) setToken(storedToken); setLoadingInit(false); }, 0);
    return () => clearTimeout(timer);
  }, []);

  const [currentView, setCurrentView] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const authConfig = { headers: { Authorization: `Bearer ${token}` } };
  const [competencia, setCompetencia] = useState(new Date());

  const [filialFiltro, setFilialFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  
  const [expandedSupplier, setExpandedSupplier] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [editingFilial, setEditingFilial] = useState(null);
  const [editingFornecedor, setEditingFornecedor] = useState(null);
  const [opcoesFornecedor, setOpcoesFornecedor] = useState({ cnpjs: [], contratos: [], ccs: [] });
  const [formUser, setFormUser] = useState({ username: '', password: '', nome_completo: '', cpf: '', setor: '', cargo: '' });
  
  const initialForm = { id: null, filial_id: '', fornecedor_id: '', cnpj_usado: '', contrato_usado: '', centro_custo_usado: '', numero_nota: '', serie: 'U', valor: '', data_envio: '', data_vencimento: '', descricao_servico: '', servico_protheus: '', numero_medicao: '', numero_pedido: '', solicitacao_fluig: '', observacao: '', status_pagamento: 'Pendente Lançamento', arquivo_nota: '', arquivo_boleto: '', repetir_por: '1' };
  const [form, setForm] = useState(initialForm);

  const { data: filiais = [] } = useQuery({ queryKey: ['filiais'], queryFn: () => axios.get(`${API_URL}/filiais/`, authConfig).then(res => res.data), enabled: !!token });
  const { data: fornecedores = [] } = useQuery({ queryKey: ['fornecedores'], queryFn: () => axios.get(`${API_URL}/fornecedores/`, authConfig).then(res => res.data), enabled: !!token });
  const { data: dadosDashboard = [], isLoading: loadingDash } = useQuery({ queryKey: ['dashboard', filialFiltro, competencia.getMonth(), competencia.getFullYear()], queryFn: async () => { const params = { filial_id: filialFiltro || undefined, mes: competencia.getMonth() + 1, ano: competencia.getFullYear() }; const res = await axios.get(`${API_URL}/dados-agrupados/`, { ...authConfig, params }); let lista = []; res.data.forEach(forn => { if(forn.lancamentos) forn.lancamentos.forEach(nota => lista.push({ ...nota, nome_fornecedor: forn.nome_empresa })); }); return lista; }, enabled: !!token && !termoBusca });
  const { data: usuarios = [], refetch: refetchUsuarios } = useQuery({ queryKey: ['usuarios'], queryFn: () => axios.get(`${API_URL}/usuarios/`, authConfig).then(res => res.data), enabled: !!token && currentView === 'usuarios' });
  const { data: dadosBusca = [], isFetching: carregandoBusca } = useQuery({ queryKey: ['busca', termoBusca], queryFn: async () => { if (!termoBusca) return []; const res = await axios.get(`${API_URL}/lancamentos/?busca=${termoBusca}`, authConfig); return res.data; }, enabled: !!token && termoBusca.length > 2 });

  // MUTATIONS (usando mutateAsync para permitir chain)
  const mutationLancamento = useMutation({ mutationFn: (nota) => nota.id ? axios.put(`${API_URL}/lancamentos/${nota.id}`, nota, authConfig) : axios.post(`${API_URL}/lancamentos/`, nota, authConfig), onSuccess: () => { queryClient.invalidateQueries(['dashboard']); queryClient.invalidateQueries(['busca']); }});
  const mutationStatus = useMutation({ mutationFn: ({id, status}) => axios.patch(`${API_URL}/lancamentos/${id}/status`, { status }, authConfig), onSuccess: () => { queryClient.invalidateQueries(['dashboard']); queryClient.invalidateQueries(['busca']); addToast('success', 'Status atualizado!'); } });
  const mutationFilial = useMutation({ mutationFn: (data) => data.id ? axios.put(`${API_URL}/filiais/${data.id}`, data, authConfig) : axios.post(`${API_URL}/filiais/`, data, authConfig), onSuccess: () => { queryClient.invalidateQueries(['filiais']); setEditingFilial(null); addToast('success', 'Filial salva!'); } });
  const mutationDeleteFilial = useMutation({ mutationFn: (id) => axios.delete(`${API_URL}/filiais/${id}`, authConfig), onSuccess: () => { queryClient.invalidateQueries(['filiais']); addToast('success', 'Filial excluída!'); }, onError: () => addToast('error', 'Erro ao excluir filial.') });
  const mutationFornecedor = useMutation({ mutationFn: (data) => data.id ? axios.put(`${API_URL}/fornecedores/${data.id}`, data, authConfig) : axios.post(`${API_URL}/fornecedores/`, data, authConfig), onSuccess: () => { queryClient.invalidateQueries(['fornecedores']); setEditingFornecedor(null); addToast('success', 'Fornecedor salvo!'); } });
  
  // Helpers
  const handleLogin = (t) => { localStorage.setItem('token', t); setToken(t); };
  const handleLogout = () => { localStorage.removeItem('token'); setToken(null); queryClient.clear(); };
  const handleStatusFilter = (s) => setStatusFiltro(p => p.includes(s) ? p.filter(i => i !== s) : [...p, s]);
  const handleFornecedorChange = (id) => { const forn = fornecedores.find(f => f.id == id); if (forn) { setOpcoesFornecedor({ cnpjs: (forn.lista_cnpjs || '').split(';'), contratos: (forn.lista_contratos || '').split(';'), ccs: (forn.lista_centro_custos || '').split(';') }); setForm(p => ({ ...p, fornecedor_id: id, cnpj_usado: '', contrato_usado: '', centro_custo_usado: '', descricao_servico: forn.padrao_descricao_servico || '', servico_protheus: forn.padrao_servico_protheus || '' })); } else setForm(p => ({...p, fornecedor_id: id})); };
  const mudarMes = (delta) => { const novaData = new Date(competencia); novaData.setMonth(competencia.getMonth() + delta); setCompetencia(novaData); };
  const criarUsuario = async () => { if(!formUser.username) return addToast('error', 'Preencha o login'); try { await axios.post(`${API_URL}/usuarios/`, formUser, authConfig); addToast('success', 'Usuário criado!'); refetchUsuarios(); setFormUser({ username: '', password: '', nome_completo: '', cpf: '', setor: '', cargo: '' }); } catch { addToast('error', 'Erro ao criar usuário'); } };
  const duplicarNota = (nota) => { openConfirm("Duplicar Lançamento", "Deseja criar uma cópia?", () => { setIsEditMode(false); handleFornecedorChange(nota.fornecedor_id); setTimeout(() => setForm({ ...nota, id: null, numero_nota: '', arquivo_nota: '', arquivo_boleto: '', data_envio: '', status_pagamento: 'Pendente Lançamento', repetir_por: '1' }), 50); setShowModal(true); }); };
  const abrirEdicao = (nota) => { setIsEditMode(true); handleFornecedorChange(nota.fornecedor_id); setTimeout(() => setForm({...nota, data_envio: nota.data_envio ? nota.data_envio.split('T')[0] : '', data_vencimento: nota.data_vencimento.split('T')[0]}), 50); setShowModal(true); };
  const getGroupedData = () => { const grupos = {}; const notas = statusFiltro.length ? dadosDashboard.filter(n => statusFiltro.includes(n.status_pagamento)) : dadosDashboard; notas.forEach(n => { if(!grupos[n.nome_fornecedor]) grupos[n.nome_fornecedor]=[]; grupos[n.nome_fornecedor].push(n); }); return Object.entries(grupos).sort((a,b) => a[0].localeCompare(b[0])); };
  const getSemaforoClass = (venc, status) => { if (status === 'Concluída') return 'border-emerald-500 bg-emerald-50/10'; const dias = Math.ceil((new Date(venc.split('T')[0]) - new Date().setHours(0,0,0,0))/86400000); if (dias < 0) return 'border-[#E30613] bg-red-50'; if (dias <= 5) return 'border-[#F77F00] bg-orange-50'; if (dias <= 10) return 'border-[#F9C531] bg-yellow-50'; return 'border-slate-200 bg-white'; };
  const getAlertBadge = (venc, status) => { if (status === 'Concluída') return <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 w-fit"><CheckCircle size={16}/> CONCLUÍDO</span>; const dias = Math.ceil((new Date(venc.split('T')[0]) - new Date().setHours(0,0,0,0))/86400000); if (dias < 0) return <span className="bg-[#1E22A8] text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 animate-pulse w-fit"><X size={16}/> VENCIDA HÁ {Math.abs(dias)} DIAS</span>; if (dias === 0) return <span className="bg-[#D62828] text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 animate-bounce w-fit"><AlertTriangle size={16}/> HOJE!</span>; return <span className="bg-blue-50 text-blue-500 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 w-fit"><Clock size={16}/> VENCE EM {dias} DIAS</span>; };
  const copiarProtheus = (n) => navigator.clipboard.writeText(`${n.fornecedor?.nome_empresa} | CPF/CNPJ: ${n.cnpj_usado||'?'} | NF: ${n.numero_nota} | Valor R$: ${n.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})} | Vencimento: ${n.data_vencimento.split('T')[0].split('-').reverse().join('/')}`).then(()=>addToast('success', "Copiado!"));
  const downloadFile = (path) => { if (!path) return; if (path.startsWith('http')) window.open(path, '_blank'); else window.open(`${API_URL}/${path}`, '_blank'); };
  
  const nomeFornecedorAtual = fornecedores.find(f => f.id == form.fornecedor_id)?.nome_empresa || "";
  const mesExibicao = competencia.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  // --- NOVA FUNÇÃO DE E-MAIL (GOPA) ---
  const handleEnviarEmail = async (dadosNota) => {
    // Se passar dadosNota (do grid), usa. Senão usa o state form (do modal)
    const nota = dadosNota || form;

    if (!nota.id || !nota.arquivo_nota) return addToast('error', 'Salve a nota e anexe arquivos.');
    setSendingEmail(true);
    try {
        await axios.post(`${API_URL}/enviar-email`, {
            numero_nota: nota.numero_nota,
            fornecedor: nomeFornecedorAtual || nota.nome_fornecedor,
            valor: nota.valor,
            vencimento: nota.data_vencimento,
            arquivos: [nota.arquivo_nota, nota.arquivo_boleto]
        }, authConfig);
        
        // Atualiza se for o modal aberto
        if(form.id === nota.id) setForm(p => ({...p, status_pagamento: 'Email Enviado p/ Balança'}));
        
        // Atualiza na lista
        mutationStatus.mutate({id: nota.id, status: 'Email Enviado p/ Balança'});
        addToast('success', 'E-mail enviado!');
    } catch { addToast('error', 'Falha ao enviar.'); } finally { setSendingEmail(false); }
  };


  
  // --- CORREÇÃO AQUI: Renomeado de salvarForm para salvarApenas ---
  const salvarApenas = async () => {
    if (!form.filial_id || !form.fornecedor_id || !form.valor || !form.numero_nota) return addToast('error', 'Preencha os campos obrigatórios!'); 
    const payload = { ...form, data_envio: form.data_envio === '' ? null : form.data_envio }; 
    try {
        await mutationLancamento.mutateAsync(payload); // Espera salvar
        addToast('success', 'Lançamento salvo!');
        setShowModal(false);
    } catch {
        addToast('error', 'Erro ao salvar.');
    }
  };

  // FUNÇÃO DE SALVAR E ENVIAR
  const salvarEEnviar = async () => {
    if (!form.filial_id || !form.fornecedor_id || !form.valor || !form.numero_nota) return addToast('error', 'Preencha os campos obrigatórios!'); 
    if (!form.arquivo_nota) return addToast('error', 'Anexe a nota fiscal para enviar.');

    const payload = { ...form, data_envio: form.data_envio === '' ? null : form.data_envio }; 
    try {
        setSendingEmail(true);
        // 1. Salva
        const response = await mutationLancamento.mutateAsync(payload);
        const notaSalva = response.data;

        // 2. Envia
        await handleEnviarEmail({...payload, id: notaSalva.id || form.id});
        setShowModal(false);
    } catch (e) {
        console.error(e);
        addToast('error', 'Erro no processo Salvar/Enviar.');
    } finally {
        setSendingEmail(false);
    }
  };

  const isNoteGopa = (nota) => {
      const nome = nota.filial?.nome_fantasia || '';
      return nome.toUpperCase().includes('GOPA') || nome.toUpperCase().includes('REFRESA');
  };

  // Safe check for GOPA
  const isGopa = filiais.find(f => f.id == form.filial_id)?.nome_fantasia?.toUpperCase().includes('GOPA') 
              || filiais.find(f => f.id == form.filial_id)?.nome_fantasia?.toUpperCase().includes('REFRESA');

  if (loadingInit) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-[#1E22A8]" size={48}/></div>;
  if (!token) return <LoginScreen onLogin={handleLogin} addToast={addToast} />;

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-slate-800 pb-40">
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(p => p.filter(t => t.id !== id))} />
      <ConfirmDialog isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} onConfirm={confirmConfig.onConfirm} onCancel={() => setConfirmConfig(p => ({...p, isOpen: false}))} />
      
      {loadingDash && <div className="fixed inset-0 bg-white/80 z-[60] flex items-center justify-center"><Loader2 className="animate-spin text-[#1E22A8]" size={48}/></div>}
      
      <header className="bg-[#1E22A8] px-6 py-4 sticky top-0 z-40 flex justify-between items-center shadow-xl shadow-[#1E22A8]/20 gap-4">
        <div className="flex items-center gap-4"><button onClick={() => setIsMenuOpen(true)} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"><Menu size={24}/></button><div className="text-white flex items-center gap-3 hidden md:flex"><Image src="/logo-cicopal.png" alt="Cicopal" width={40} height={40} className="h-10 w-auto object-contain bg-white/10 rounded p-1" /><div><h1 className="text-xl font-black tracking-tight leading-none">CICOPAL <span className="font-light opacity-80">GESTÃO DE NOTAS</span></h1></div></div></div>
        {currentView === 'dashboard' && (<div className="flex-1 max-w-2xl mx-4 relative"><input className="w-full bg-black/20 border border-white/10 text-white placeholder:text-white/60 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:bg-black/40 font-bold" placeholder="Buscar..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} /><Search className="absolute left-3 top-3 text-white/60" size={18} />{termoBusca && (<button onClick={() => setTermoBusca('')} className="absolute right-3 top-3 text-white/60 hover:text-white"><X size={18}/></button>)}</div>)}
        
        {/* PARTE CORRIGIDA DO HEADER (LADO DIREITO) */}
        <div className="flex gap-3 items-center">
            {currentView === 'dashboard' && (
                <>
                    <div className="relative group hidden md:block">
                        <select className="appearance-none bg-black/20 border border-white/10 text-white font-bold text-sm rounded-lg px-4 py-2 pr-10 outline-none focus:bg-black/30 cursor-pointer" value={filialFiltro} onChange={e => setFilialFiltro(e.target.value)}>
                            <option value="">🏢 Todas as Filiais</option>
                            {filiais.map(f => <option key={f.id} value={f.id}>{f.codigo} - {f.nome_fantasia}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-white/70 pointer-events-none" size={14}/>
                    </div>

                    {/* BOTÃO EXPORTAR INSERIDO AQUI */}
                    <BotaoExportar dados={dadosDashboard} />

                    <button onClick={() => { setForm(initialForm); setIsEditMode(false); setShowModal(true); }} className="bg-[#E30613] text-white hover:bg-white hover:text-[#E30613] px-5 py-2 rounded-lg font-black text-sm flex gap-2 items-center shadow-lg active:scale-95 whitespace-nowrap transition-colors">
                        <Plus size={18}/> <span className="hidden md:inline">LANÇAR</span>
                    </button>
                </>
            )}
        </div>
      </header>

      

<nav className="space-y-2 flex-1">
  <button
    onClick={() => { 
      setCurrentView('dashboard'); 
      setIsMenuOpen(false); 
    }}
    className="w-full flex items-center gap-4 text-slate-600 font-bold p-4 rounded-xl hover:bg-slate-50"
  >
    <Server size={20}/> DASHBOARD
  </button>

  <button
    onClick={() => { 
      setCurrentView('filiais'); 
      setIsMenuOpen(false); 
    }}
    className="w-full flex items-center gap-4 text-slate-600 font-bold p-4 rounded-xl hover:bg-slate-50"
  >
    <Building size={20}/> FILIAIS
  </button>

  <button
    onClick={() => { 
      setCurrentView('fornecedores'); 
      setIsMenuOpen(false); 
    }}
    className="w-full flex items-center gap-4 text-slate-600 font-bold p-4 rounded-xl hover:bg-slate-50"
  >
    <Users size={20}/> FORNECEDORES
  </button>

  <button
    onClick={() => { 
      setCurrentView('usuarios'); 
      refetchUsuarios(); 
      setIsMenuOpen(false); 
    }}
    className="w-full flex items-center gap-4 text-slate-600 font-bold p-4 rounded-xl hover:bg-slate-50"
  >
    <UserPlus size={20}/> USUÁRIOS
  </button>

  {/* 🔽 BOTÃO ADICIONADO */}
  <button
    onClick={() => { 
      setCurrentView('solicitacoes'); 
      setIsMenuOpen(false); 
    }}
    className="w-full flex items-center gap-4 text-slate-600 font-bold p-4 rounded-xl hover:bg-slate-50"
  >
    <ShoppingCart size={20}/> SOLICITAÇÕES
  </button>
</nav>


      <main className="max-w-[1600px] mx-auto p-6 space-y-10 mt-4">
        {termoBusca.length > 2 && currentView === 'dashboard' ? (
             <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[500px]"><h2 className="text-2xl font-black text-[#1E22A8] mb-6 flex items-center gap-2"><Search className="text-[#F9C531]"/> RESULTADOS: &quot;{termoBusca}&quot;</h2>{carregandoBusca ? (<div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#1E22A8]" size={40}/></div>) : dadosBusca.length === 0 ? (<div className="text-center text-slate-400 p-10 font-bold">Nada encontrado.</div>) : (<div className="space-y-3">{dadosBusca.map(n => (<div key={n.id} className={`bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-all flex flex-col md:flex-row justify-between items-center gap-4 ${getSemaforoClass(n.data_vencimento, n.status_pagamento)}`}><div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="font-black text-[#1E22A8] text-lg">{n.fornecedor?.nome_empresa}</span><span className="text-[10px] bg-white border px-2 py-0.5 rounded font-bold uppercase">{n.filial?.nome_fantasia}</span></div><div className="flex gap-4 text-xs text-slate-500 font-bold uppercase"><span>NF: {n.numero_nota}</span><span>PEDIDO: {n.numero_pedido || '-'}</span><span>VENC: {n.data_vencimento.split('T')[0].split('-').reverse().join('/')}</span></div></div><div className="text-right"><div className="font-black text-xl text-[#1E22A8]">R$ {n.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div><div className="text-[10px] font-bold uppercase text-slate-400">{n.status_pagamento}</div></div><div className="flex gap-2"><button onClick={() => {setIsEditMode(true); handleFornecedorChange(n.fornecedor_id); setTimeout(() => setForm({...n, data_envio: n.data_envio ? n.data_envio.split('T')[0] : '', data_vencimento: n.data_vencimento.split('T')[0]}), 50); setShowModal(true);}} className="p-2 bg-white border rounded-lg hover:text-[#1E22A8]"><Edit2 size={18}/></button></div></div>))}</div>)}</div>
        ) : (currentView === 'dashboard' && (<><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><KpiCard title="Aguardando Fatura" count={dadosDashboard.filter(n=>n.status_pagamento==='Aguardando Fatura').length} colorHex={CORES.amareloAlerta} icon={<Clock size={100}/>} isActive={statusFiltro.includes('Aguardando Fatura')} onClick={()=>handleStatusFilter('Aguardando Fatura')}/><KpiCard title="Pendente Lançamento" count={dadosDashboard.filter(n=>n.status_pagamento==='Pendente Lançamento').length} colorHex={CORES.vermelhoCicopal} icon={<AlertTriangle size={100}/>} isActive={statusFiltro.includes('Pendente Lançamento')} onClick={()=>handleStatusFilter('Pendente Lançamento')}/><KpiCard title="Aguardando Pagto" count={dadosDashboard.filter(n=>n.status_pagamento==='Aguardando Pagamento').length} colorHex={CORES.azulCicopal} icon={<Calendar size={100}/>} isActive={statusFiltro.includes('Aguardando Pagamento')} onClick={()=>handleStatusFilter('Aguardando Pagamento')}/><KpiCard title="Concluída" count={dadosDashboard.filter(n=>n.status_pagamento==='Concluída').length} colorHex="#10B981" icon={<CheckCircle size={100}/>} isActive={statusFiltro.includes('Concluída')} onClick={()=>handleStatusFilter('Concluída')}/></div><div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100"><button onClick={() => mudarMes(-1)} className="p-2 hover:bg-slate-100 rounded-full text-[#1E22A8]"><ChevronLeft/></button><div className="text-center"><h2 className="text-2xl font-black text-[#1E22A8] uppercase tracking-tight">{mesExibicao}</h2><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Competência Atual</p></div><button onClick={() => mudarMes(1)} className="p-2 hover:bg-slate-100 rounded-full text-[#1E22A8]"><ChevronRight/></button></div>
        
        <div className="space-y-4 pb-40">
            {getGroupedData().map(([nm, nts]) => { 
                const exp = expandedSupplier[nm]; 
                return (
                    <div key={nm} className={`${CLEAN_PANEL} overflow-hidden transition-all duration-300 border-l-4 border-l-[#1E22A8]`}>
                        <div onClick={()=>setExpandedSupplier(p=>({...p,[nm]:!p[nm]}))} className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"><div className="flex items-center gap-4"><div className="bg-[#1E22A8]/5 p-2 rounded-lg text-[#1E22A8]"><Server size={20}/></div><span className="font-bold text-lg text-[#1E22A8] tracking-wide">{nm}</span></div><div className="flex items-center gap-3"><span className="text-xs font-bold bg-[#1E22A8] text-white px-3 py-1 rounded-full shadow-sm">{nts.length}</span><div className={`p-1 rounded-full bg-slate-100 transition-transform duration-300 ${exp?'rotate-180':''}`}><ChevronDown size={18}/></div></div></div>
                        {exp && <div className="bg-slate-50 p-4 grid gap-3 border-t border-slate-100">{nts.map(n => (
                            <div key={n.id} className={`bg-white rounded-xl shadow-sm border-l-[6px] p-5 hover:shadow-md transition-all relative overflow-hidden group ${getSemaforoClass(n.data_vencimento, n.status_pagamento)}`}>
                                <div className="flex flex-col xl:flex-row justify-between gap-6 mb-4">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col justify-center">
                                            <div className="flex items-center gap-3 mb-2"><span className="text-2xl font-black text-slate-800">#{n.numero_nota}</span><span className="text-[10px] font-bold bg-[#1E22A8]/10 text-[#1E22A8] px-2 py-1 rounded border border-[#1E22A8]/20 uppercase tracking-wide">{n.filial?.nome_fantasia || 'MATRIZ'}</span></div>
                                            <div className="mb-4">{getAlertBadge(n.data_vencimento, n.status_pagamento)}</div>
                                            <div className="flex flex-wrap gap-4"><div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200"><span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">CNPJ</span><span className="text-lg font-black text-[#1E22A8]">{n.cnpj_usado || '-'}</span></div><div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200"><span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">CONTRATO</span><span className="text-lg font-black text-[#1E22A8]">{n.contrato_usado || '-'}</span></div></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Valor Total</p><p className="text-3xl font-black text-[#1E22A8]">R$ {n.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p></div>
                                        <div className="flex gap-2 pl-6 border-l-2 border-slate-100 flex-col sm:flex-row">
                                            <button onClick={()=>copiarProtheus(n)} className="h-10 px-4 bg-[#1E22A8] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#E30613] transition-colors shadow-sm" title="Copiar p/ Protheus"><ClipboardList size={16}/> Copiar</button>
                                            
                                            {/* BOTÃO ENVIAR P/ BALANÇA (NO GRID) - EXPANDIDO PARA EVITAR ERRO */}
                                            {isNoteGopa(n) && n.status_pagamento !== 'Email Enviado p/ Balança' && (
                                                <button 
                                                    onClick={() => handleEnviarEmail(n)} 
                                                    className="h-10 px-4 bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                                                >
                                                    <Mail size={16}/> Enviar
                                                </button>
                                            )}

                                            <div className="flex gap-1">
                                                {n.arquivo_nota && (
                                                    <button onClick={()=>downloadFile(n.arquivo_nota)} className="h-10 w-10 bg-red-50 text-[#E30613] border border-red-100 rounded-lg hover:bg-[#E30613] hover:text-white transition-colors flex items-center justify-center" title="Ver Nota">
                                                        <FileText size={18}/>
                                                    </button>
                                                )}
                                                {n.arquivo_boleto && (
                                                    <button onClick={()=>downloadFile(n.arquivo_boleto)} className="h-10 w-10 bg-blue-50 text-[#1E22A8] border border-blue-100 rounded-lg hover:bg-[#1E22A8] hover:text-white transition-colors flex items-center justify-center" title="Ver Boleto">
                                                        <Paperclip size={18}/>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={()=>abrirEdicao(n)} className="h-10 w-10 text-slate-400 hover:text-[#1E22A8] bg-slate-100 rounded-lg transition-colors flex items-center justify-center" title="Editar"><Edit2 size={18}/></button>
                                                <button onClick={()=>duplicarNota(n)} className="h-10 w-10 text-slate-400 hover:text-[#1E22A8] bg-slate-100 rounded-lg transition-colors flex items-center justify-center" title="Duplicar"><Copy size={18}/></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-y-3 gap-x-6 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100"><div><strong className="block text-[#1E22A8] uppercase text-[10px] font-black mb-1">Vencimento</strong><span className="text-base font-bold text-slate-600">{n.data_vencimento.split('T')[0].split('-').reverse().join('/')}</span></div><div><strong className="block text-[#1E22A8] uppercase text-[10px] font-black mb-1">Envio TI</strong><span className="text-base font-bold text-slate-600">{n.data_envio ? n.data_envio.split('T')[0].split('-').reverse().join('/') : '-'}</span></div><div><strong className="block text-[#1E22A8] uppercase text-[10px] font-black mb-1">Centro Custo</strong><span className="text-base font-bold text-slate-600">{n.centro_custo_usado || '-'}</span></div><div><strong className="block text-[#1E22A8] uppercase text-[10px] font-black mb-1">Fluig</strong><span className="text-base font-bold text-slate-600">{n.solicitacao_fluig || '-'}</span></div><div className="relative"><strong className="block text-[#1E22A8] uppercase text-[10px] font-black mb-1">Status Atual</strong><select value={n.status_pagamento || ""} onChange={async (e) => { const st = e.target.value; mutationStatus.mutate({id: n.id, status: st}); }} className={`w-full appearance-none text-[11px] font-black uppercase py-1.5 px-3 rounded-lg border-2 cursor-pointer outline-none transition-all ${STATUS_STYLES[n.status_pagamento]?.bg} ${STATUS_STYLES[n.status_pagamento]?.border} ${STATUS_STYLES[n.status_pagamento]?.text}`}>{OPCOES_STATUS.map(s => <option key={s} value={s}>{s}</option>)}</select></div></div></div>))}</div>}</div>)})}</div > </>))}
        {currentView === 'filiais' && (<div className="bg-white rounded-3xl p-8 shadow-xl animate-in zoom-in-95"><div className="flex justify-between mb-6"><h2 className="text-3xl font-black text-[#1E22A8] flex gap-3 items-center"><div className="bg-[#1E22A8] p-2 rounded-lg text-white"><Building/></div> FILIAIS</h2><button onClick={()=>setEditingFilial({codigo:'', nome_fantasia:''})} className="bg-[#1E22A8] text-white px-4 py-2 rounded-xl font-bold flex gap-2"><Plus size={18}/> Nova</button></div>{editingFilial && <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-blue-200 grid grid-cols-2 gap-4"><div><label className={LABEL_STYLE}>Código</label><input className={INPUT_STYLE} value={editingFilial.codigo || ""} onChange={e=>setEditingFilial({...editingFilial, codigo:e.target.value})}/></div><div><label className={LABEL_STYLE}>Nome</label><input className={INPUT_STYLE} value={editingFilial.nome_fantasia || ""} onChange={e=>setEditingFilial({...editingFilial, nome_fantasia:e.target.value})}/></div><div className="col-span-2 flex gap-2"><button onClick={()=>mutationFilial.mutate(editingFilial)} className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold">Salvar</button><button onClick={()=>setEditingFilial(null)} className="bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold">Cancelar</button></div></div>}<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filiais.map(f => (<div key={f.id} className="p-4 border-2 border-slate-100 rounded-xl flex justify-between items-center group hover:border-blue-200"><div><span className="font-bold text-slate-700 block">{f.nome_fantasia}</span><span className="text-xs font-black bg-slate-200 text-slate-500 px-2 py-0.5 rounded-lg">{f.codigo}</span></div><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={()=>setEditingFilial(f)} className="p-2 text-[#1E22A8] hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button><button onClick={()=>{openConfirm("Excluir Filial", `Deseja realmente excluir ${f.nome_fantasia}?`, () => mutationDeleteFilial.mutate(f.id))}} className="p-2 text-[#E30613] hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button></div></div>))}</div></div>)}
        {currentView === 'fornecedores' && (<div className="bg-white rounded-3xl p-8 shadow-xl animate-in zoom-in-95"><div className="flex justify-between mb-6"><h2 className="text-3xl font-black text-[#1E22A8] flex gap-3 items-center"><div className="bg-[#1E22A8] p-2 rounded-lg text-white"><Users/></div> FORNECEDORES</h2><button onClick={()=>setEditingFornecedor({nome_empresa:'', lista_cnpjs:'', lista_contratos:'', lista_centro_custos:'', padrao_descricao_servico:'', padrao_servico_protheus:''})} className="bg-[#1E22A8] text-white px-4 py-2 rounded-xl font-bold flex gap-2"><Plus size={18}/> Nova</button></div>{editingFornecedor && <div className="bg-slate-50 p-6 rounded-xl mb-6 border border-blue-200 grid grid-cols-2 gap-4"><div className="col-span-2"><label className={LABEL_STYLE}>Nome</label><input className={INPUT_STYLE} value={editingFornecedor.nome_empresa || ""} onChange={e=>setEditingFornecedor({...editingFornecedor, nome_empresa:e.target.value})}/></div><div><label className={LABEL_STYLE}>CNPJs</label><input className={INPUT_STYLE} value={editingFornecedor.lista_cnpjs || ""} onChange={e=>setEditingFornecedor({...editingFornecedor, lista_cnpjs:e.target.value})}/></div><div><label className={LABEL_STYLE}>Contratos</label><input className={INPUT_STYLE} value={editingFornecedor.lista_contratos || ""} onChange={e=>setEditingFornecedor({...editingFornecedor, lista_contratos:e.target.value})}/></div><div className="col-span-2 flex gap-2"><button onClick={()=>mutationFornecedor.mutate(editingFornecedor)} className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold">Salvar</button><button onClick={()=>setEditingFornecedor(null)} className="bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold">Cancelar</button></div></div>}<div className="grid grid-cols-1 gap-4">{fornecedores.map(f => (<div key={f.id} className="p-5 border-2 border-slate-100 rounded-xl hover:border-[#1E22A8] transition-colors group flex justify-between items-start"><div className="flex-1"><h3 className="font-black text-lg text-[#1E22A8] mb-2">{f.nome_empresa}</h3><div className="grid grid-cols-2 gap-4 text-xs text-slate-500"><div><strong className="block uppercase text-slate-400">Contratos</strong>{f.lista_contratos}</div><div><strong className="block uppercase text-slate-400">Centro de Custo</strong>{f.lista_centro_custos}</div></div></div><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4"><button onClick={()=>setEditingFornecedor(f)} className="p-2 text-[#1E22A8] hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button><button onClick={()=>{openConfirm("Excluir Fornecedor", `Deseja realmente excluir ${f.nome_empresa}?`, () => axios.delete(`${API_URL}/fornecedores/${f.id}`, authConfig).then(()=>{queryClient.invalidateQueries(['fornecedores']); addToast('success', 'Fornecedor excluído!');}))}} className="p-2 text-[#E30613] hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button></div></div>))}</div></div>)}
        {currentView === 'usuarios' && (<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in zoom-in-95"><div className="lg:col-span-1 bg-white rounded-3xl p-8 shadow-xl h-fit"><h3 className="text-xl font-black text-[#1E22A8] mb-4">NOVO USUÁRIO</h3><div className="space-y-4"><div><label className={LABEL_STYLE}>Nome</label><input className={INPUT_STYLE} value={formUser.nome_completo || ""} onChange={e=>setFormUser({...formUser, nome_completo:e.target.value})}/></div><div><label className={LABEL_STYLE}>Login</label><input className={INPUT_STYLE} value={formUser.username || ""} onChange={e=>setFormUser({...formUser, username:e.target.value})}/></div><div><label className={LABEL_STYLE}>Senha</label><input type="password" className={INPUT_STYLE} value={formUser.password || ""} onChange={e=>setFormUser({...formUser, password:e.target.value})}/></div><button onClick={criarUsuario} className={`w-full ${BUTTON_PRIMARY} mt-4`}>CADASTRAR</button></div></div><div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-xl"><h3 className="text-xl font-black text-[#1E22A8] mb-6">USUÁRIOS ATIVOS</h3><div className="space-y-4">{usuarios.map(u => (<div key={u.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50"><div className="flex items-center gap-4"><div className="bg-[#1E22A8] text-white h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg">{u.nome_completo.charAt(0)}</div><div><p className="font-bold text-[#1E22A8]">{u.nome_completo}</p><p className="text-xs text-slate-400 font-bold uppercase">{u.cargo} • {u.setor}</p></div></div><span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">ATIVO</span></div>))}</div></div></div>)}
        {currentView === 'solicitacoes' && (
  <div className="bg-white rounded-3xl p-8 shadow-xl animate-in zoom-in-95">
    <div className="flex justify-between mb-6">
      <h2 className="text-3xl font-black text-[#1E22A8] flex gap-3 items-center">
        <div className="bg-[#1E22A8] p-2 rounded-lg text-white"><ShoppingCart/></div> 
        SOLICITAÇÕES DE COMPRA
      </h2>
      <button 
        onClick={() => { setFormSolicitacao(initialFormSolicitacao); setShowModalSolicitacao(true); }} 
        className="bg-[#1E22A8] text-white px-4 py-2 rounded-xl font-bold flex gap-2 items-center hover:bg-[#E30613] transition-colors"
      >
        <Plus size={18}/> Nova Solicitação
      </button>
    </div>

    {/* LISTA DE SOLICITAÇÕES (TABELA EM CARDS) */}
    <div className="space-y-3">
      {solicitacoes.length === 0 ? (
        <div className="text-center p-10 text-slate-400 font-bold">Nenhuma solicitação encontrada.</div>
      ) : (
        solicitacoes.map(s => (
          <div key={s.id} className="p-4 border-2 border-slate-100 rounded-xl hover:border-blue-300 transition-all bg-slate-50 flex flex-col md:flex-row justify-between gap-4 items-center">
             <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                   <span className="font-black text-[#1E22A8] text-lg">#{s.numero_sc || 'S/N'}</span>
                   <span className="text-[10px] bg-white border px-2 py-0.5 rounded font-bold uppercase text-slate-500">{s.filial?.nome_fantasia}</span>
                   <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase text-white ${s.status === 'Pendente' ? 'bg-amber-400' : s.status === 'Aprovado' ? 'bg-blue-500' : s.status === 'Pedido Realizado' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                      {s.status}
                   </span>
                </div>
                <div className="font-bold text-slate-700">{s.fornecedor?.nome_empresa || 'Fornecedor não informado'}</div>
                <div className="text-xs text-slate-500 font-bold uppercase flex gap-3">
                   <span>SOLICITANTE: {s.solicitante}</span>
                   <span>•</span>
                   <span>ITEM: {s.servico || '-'}</span>
                </div>
             </div>
             
             <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Valor Estimado</div>
                <div className="text-xl font-black text-[#1E22A8]">R$ {parseFloat(s.valor || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
             </div>

             <div className="flex gap-2">
                <button onClick={() => { setFormSolicitacao(s); setShowModalSolicitacao(true); }} className="p-2 bg-white border rounded-lg hover:text-[#1E22A8] transition-colors"><Edit2 size={18}/></button>
             </div>
          </div>
        ))
      )}
    </div>
  </div>
)}

{/* --- MODAL DE SOLICITAÇÕES --- */}
{showModalSolicitacao && (
  <div className="fixed inset-0 bg-[#1E22A8]/60 backdrop-blur-md z-[80] flex items-center justify-center p-4">
    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
       <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-2xl font-black flex gap-3 text-[#1E22A8] items-center"><ShoppingCart/> {formSolicitacao.id ? 'EDITAR SOLICITAÇÃO' : 'NOVA SOLICITAÇÃO'}</h2>
          <button onClick={() => setShowModalSolicitacao(false)} className="bg-white p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-[#E30613]"><X size={24}/></button>
       </div>

       <div className="flex-1 overflow-y-auto p-8 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             
             {/* DADOS BÁSICOS */}
             <div className="md:col-span-1"><label className={LABEL_STYLE}>Filial *</label><select className={INPUT_STYLE} value={formSolicitacao.filial_id || ""} onChange={e => setFormSolicitacao({...formSolicitacao, filial_id: e.target.value})}><option value="">Selecione...</option>{filiais.map(f => <option key={f.id} value={f.id}>{f.codigo} - {f.nome_fantasia}</option>)}</select></div>
             <div className="md:col-span-1"><label className={LABEL_STYLE}>Solicitante *</label><input className={INPUT_STYLE} placeholder="Quem pediu?" value={formSolicitacao.solicitante || ""} onChange={e => setFormSolicitacao({...formSolicitacao, solicitante: e.target.value})}/></div>
             <div className="md:col-span-2"><label className={LABEL_STYLE}>Fornecedor</label><select className={INPUT_STYLE} value={formSolicitacao.fornecedor_id || ""} onChange={e => handleFornecedorSolicitacao(e.target.value)}><option value="">Selecione...</option>{fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome_empresa}</option>)}</select></div>

             <div className="md:col-span-4 h-[1px] bg-slate-100 my-2"></div>

             {/* DADOS FINANCEIROS */}
             <div className="md:col-span-1"><label className={LABEL_STYLE}>CNPJ</label><input className={INPUT_STYLE} value={formSolicitacao.cnpj || ""} onChange={e => setFormSolicitacao({...formSolicitacao, cnpj: e.target.value})}/></div>
             <div className="md:col-span-1"><label className={LABEL_STYLE}>Cond. Pagamento</label><input className={INPUT_STYLE} placeholder="Ex: 30 dias" value={formSolicitacao.condicao_pagamento || ""} onChange={e => setFormSolicitacao({...formSolicitacao, condicao_pagamento: e.target.value})}/></div>
             <div className="md:col-span-1"><label className={LABEL_STYLE}>Valor R$</label><input type="number" className={INPUT_STYLE} value={formSolicitacao.valor || ""} onChange={e => setFormSolicitacao({...formSolicitacao, valor: e.target.value})}/></div>
             <div className="md:col-span-1"><label className={LABEL_STYLE}>Vencimento (Previsto)</label><input type="date" className={INPUT_STYLE} value={formSolicitacao.data_vencimento || ""} onChange={e => setFormSolicitacao({...formSolicitacao, data_vencimento: e.target.value})}/></div>

             {/* DETALHES DO PEDIDO */}
             <div className="md:col-span-4 bg-blue-50 p-4 rounded-xl border border-blue-100 grid grid-cols-4 gap-4">
                <div className="col-span-4 text-[#1E22A8] font-black text-xs uppercase tracking-widest flex gap-2 items-center"><FileText size={14}/> Detalhes do Pedido</div>
                <div className="col-span-1"><label className={LABEL_STYLE}>Nº SC</label><input className={INPUT_STYLE} value={formSolicitacao.numero_sc || ""} onChange={e => setFormSolicitacao({...formSolicitacao, numero_sc: e.target.value})}/></div>
                <div className="col-span-1"><label className={LABEL_STYLE}>Nº Pedido</label><input className={INPUT_STYLE} value={formSolicitacao.numero_pedido || ""} onChange={e => setFormSolicitacao({...formSolicitacao, numero_pedido: e.target.value})}/></div>
                <div className="col-span-1"><label className={LABEL_STYLE}>Centro de Custo</label><input className={INPUT_STYLE} value={formSolicitacao.centro_custo || ""} onChange={e => setFormSolicitacao({...formSolicitacao, centro_custo: e.target.value})}/></div>
                <div className="col-span-1"><label className={LABEL_STYLE}>Fluig</label><input className={INPUT_STYLE} value={formSolicitacao.fluig_id || ""} onChange={e => setFormSolicitacao({...formSolicitacao, fluig_id: e.target.value})}/></div>
                <div className="col-span-2"><label className={LABEL_STYLE}>Serviço / Produto</label><input className={INPUT_STYLE} value={formSolicitacao.servico || ""} onChange={e => setFormSolicitacao({...formSolicitacao, servico: e.target.value})}/></div>
                <div className="col-span-2"><label className={LABEL_STYLE}>Serviço (Protheus)</label><input className={INPUT_STYLE} value={formSolicitacao.servico_protheus || ""} onChange={e => setFormSolicitacao({...formSolicitacao, servico_protheus: e.target.value})}/></div>
             </div>

             {/* CONTROLE */}
             <div className="md:col-span-2"><label className={LABEL_STYLE}>Nota Fiscal (Se houver)</label><input className={INPUT_STYLE} value={formSolicitacao.numero_nota || ""} onChange={e => setFormSolicitacao({...formSolicitacao, numero_nota: e.target.value})}/></div>
             <div className="md:col-span-2">
                <label className={LABEL_STYLE}>Status Atual</label>
                <select className={INPUT_STYLE} value={formSolicitacao.status} onChange={e => setFormSolicitacao({...formSolicitacao, status: e.target.value})}>
                   {OPCOES_STATUS_COMPRA.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             
             <div className="col-span-4"><label className={LABEL_STYLE}>Observações</label><textarea className={`${INPUT_STYLE} h-24 resize-none`} value={formSolicitacao.observacao || ""} onChange={e => setFormSolicitacao({...formSolicitacao, observacao: e.target.value})}/></div>
          </div>
       </div>

       <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
          <button onClick={() => setShowModalSolicitacao(false)} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-[#E30613]">Cancelar</button>
          <button onClick={() => mutationSolicitacao.mutate(formSolicitacao)} className="bg-[#1E22A8] text-white px-8 py-3 rounded-xl font-black shadow-lg hover:bg-blue-700 active:scale-95 transition-all">SALVAR SOLICITAÇÃO</button>
       </div>
    </div>
  </div>
)}
      </main>

{/* FOOTER SIMPLES - CLEAN */}
<footer className="fixed bottom-0 left-0 right-0 py-4 bg-white border-t border-gray-200 z-10 flex items-center justify-center">
  <p className="text-gray-500 text-sm font-medium">
    © {new Date().getFullYear()} <span className="font-bold text-[#1E22A8]">Cicopal</span> <span className="mx-2 text-gray-300">|</span> GESTÃO DE NOTAS 🤖
  </p>
</footer>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1E22A8]/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/50">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-2xl font-black flex gap-3 text-[#1E22A8] items-center tracking-tight"><div className="bg-[#1E22A8] p-2 rounded-xl text-white shadow-lg"><Plus size={24}/></div>{isEditMode ? 'EDITAR LANÇAMENTO' : 'NOVO LANÇAMENTO'}</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-[#E30613] bg-white hover:bg-red-50 p-2 rounded-full transition-all shadow-sm"><X size={24}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1"><label className={LABEL_STYLE}>Filial</label><select className={INPUT_STYLE} value={form.filial_id || ""} onChange={e => setForm({...form, filial_id: e.target.value})}><option>Selecione...</option>{filiais.map(f => <option key={f.id} value={f.id}>{f.codigo} - {f.nome_fantasia}</option>)}</select></div>
                    <div className="md:col-span-1"><label className={LABEL_STYLE}>Fornecedor</label><select className={INPUT_STYLE} value={form.fornecedor_id || ""} onChange={e => handleFornecedorChange(e.target.value)}><option>Selecione...</option>{fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome_empresa}</option>)}</select></div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                       <div className="col-span-2"><label className={LABEL_STYLE}>Centro de Custo</label><select className={`${INPUT_STYLE} !bg-white`} value={form.centro_custo_usado || ""} onChange={e => setForm({...form, centro_custo_usado: e.target.value})}><option value="">Selecione...</option>{opcoesFornecedor.ccs.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                       <div><label className={LABEL_STYLE}>CNPJ</label><select className={`${INPUT_STYLE} !bg-white text-xs`} value={form.cnpj_usado || ""} onChange={e => setForm({...form, cnpj_usado: e.target.value})}><option value="">Selecione...</option>{opcoesFornecedor.cnpjs.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                       <div><label className={LABEL_STYLE}>Contrato</label><select className={`${INPUT_STYLE} !bg-white text-xs`} value={form.contrato_usado || ""} onChange={e => setForm({...form, contrato_usado: e.target.value})}><option value="">Selecione...</option>{opcoesFornecedor.contratos.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    </div>
                    
                    <div className="col-span-4 h-[1px] bg-slate-100 rounded-full"></div>

                    <div><label className={LABEL_STYLE}>Nº Nota *</label><input className={INPUT_STYLE} value={form.numero_nota || ""} onChange={e => setForm({...form, numero_nota: e.target.value})}/></div>
                    <div><label className={LABEL_STYLE}>Série</label><input className={INPUT_STYLE} placeholder="U" value={form.serie || ""} onChange={e => setForm({...form, serie: e.target.value})}/></div>
                    <div><label className={LABEL_STYLE}>Valor (R$) *</label><input type="number" className={INPUT_STYLE} value={form.valor || ""} onChange={e => setForm({...form, valor: e.target.value})}/></div>
                    <div>
                        <label className={LABEL_STYLE}>Status Inicial</label>
                        <select className={INPUT_STYLE} value={form.status_pagamento || ""} onChange={e => setForm({...form, status_pagamento: e.target.value})}>{OPCOES_STATUS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    </div>

                    {!form.id && (
                        <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
                            <label className={LABEL_STYLE}>Repetir (Meses)</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="60"
                                    className={`${INPUT_STYLE} !bg-white text-center`} 
                                    value={form.repetir_por || 1} 
                                    onChange={e => setForm({...form, repetir_por: e.target.value})}
                                />
                                <span className="text-xs font-bold text-blue-500 uppercase">Meses</span>
                            </div>
                        </div>
                    )}

                    <div><label className={LABEL_STYLE}>Data Envio TI</label><input type="date" className={INPUT_STYLE} value={form.data_envio || ''} onChange={e => setForm({...form, data_envio: e.target.value})}/></div>
                    <div><label className={LABEL_STYLE}>Vencimento *</label><input type="date" className={INPUT_STYLE} value={form.data_vencimento || ""} onChange={e => setForm({...form, data_vencimento: e.target.value})}/></div>
                    <div className="col-span-1"></div>
                    
                    <div className="col-span-4 bg-[#F9C531]/10 p-6 rounded-2xl border border-[#F9C531]/30 grid grid-cols-3 gap-6">
                        <div className="col-span-3 flex items-center gap-2 text-[#F77F00] mb-2"><Server size={18}/> <span className="text-xs font-black uppercase tracking-widest">Controle Interno</span></div>
                        
                        {/* CONDICIONAL: Só mostra Fluig se NÃO for GOPA */}
                        {!isGopa && (
                            <div><label className={LABEL_STYLE}>Fluig</label><input className={INPUT_STYLE} value={form.solicitacao_fluig || ""} onChange={e => setForm({...form, solicitacao_fluig: e.target.value})}/></div>
                        )}
                        
                        <div><label className={LABEL_STYLE}>Pedido</label><input className={INPUT_STYLE} value={form.numero_pedido || ""} onChange={e => setForm({...form, numero_pedido: e.target.value})}/></div>
                        
                        <div><label className={LABEL_STYLE}>Medição</label><input className={INPUT_STYLE} value={form.numero_medicao || ""} onChange={e => setForm({...form, numero_medicao: e.target.value})}/></div>
                        
                        <div className="col-span-3 grid grid-cols-2 gap-6"><div><label className={LABEL_STYLE}>Descrição Serviço</label><input className={INPUT_STYLE} value={form.descricao_servico || ""} onChange={e => setForm({...form, descricao_servico: e.target.value})}/></div><div><label className={LABEL_STYLE}>Serviço Protheus</label><input className={INPUT_STYLE} value={form.servico_protheus || ""} onChange={e => setForm({...form, servico_protheus: e.target.value})}/></div></div>
                    </div>
                    <div className="col-span-2"><FileDrop label="ANEXAR NOTA FISCAL" colorTheme="red" onFileSelect={path => setForm({...form, arquivo_nota: path})} existingFile={form.arquivo_nota} metaData={{fornecedor: nomeFornecedorAtual, nota: form.numero_nota, vencimento: form.data_vencimento}} addToast={addToast}/></div>
                    <div className="col-span-2"><FileDrop label="ANEXAR BOLETO" colorTheme="blue" onFileSelect={path => setForm({...form, arquivo_boleto: path})} existingFile={form.arquivo_boleto} metaData={{fornecedor: nomeFornecedorAtual, nota: form.numero_nota, vencimento: form.data_vencimento}} addToast={addToast}/></div>
                    <div className="col-span-4"><label className={LABEL_STYLE}>Observações</label><textarea className={`${INPUT_STYLE} h-24 resize-none`} value={form.observacao || ""} onChange={e => setForm({...form, observacao: e.target.value})}/></div>
                 </div>
             </div>
             
             {/* RODAPÉ DO MODAL (BOTÕES) */}
             <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-4">
                
                <button onClick={() => setShowModal(false)} className="px-8 py-3 rounded-xl font-bold text-slate-400 hover:text-[#E30613] hover:bg-white transition-colors uppercase tracking-wider text-sm">Cancelar</button>
                
                {/* Botão de Salvar Padrão */}
                <button onClick={salvarApenas} className={`bg-[#1E22A8] hover:bg-[#2196F3] hover:scale-105 text-white font-black px-10 py-3 rounded-xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-3 uppercase tracking-wider text-sm`}><CheckCircle size={20}/> SALVAR</button>

                {/* Botão Especial GOPA: Salvar E Enviar */}
                {isGopa && (
                    <button 
                        onClick={salvarEEnviar} 
                        disabled={sendingEmail}
                        className="bg-purple-600 hover:bg-purple-700 hover:scale-105 text-white font-black px-6 py-3 rounded-xl shadow-xl shadow-purple-500/20 transition-all active:scale-95 flex items-center gap-3 uppercase tracking-wider text-sm"
                    >
                        {sendingEmail ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>} 
                        SALVAR E ENVIAR
                    </button>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- EXPORT DEFAULT ---
export default function Home() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
        <DashboardContent />
    </QueryClientProvider>
  );
}
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Server, Filter, Calendar, Clock, AlertTriangle, CheckCircle, X, 
  UploadCloud, FileText, Copy, Edit2, Paperclip, ClipboardList, Loader2, ChevronDown, Heart
} from 'lucide-react';

const API_URL = "http://127.0.0.1:8000";

const LABEL_STYLE = "text-xs font-bold uppercase text-slate-500 mb-1.5 block tracking-wide";
const INPUT_STYLE = "w-full border-2 border-slate-200 p-2.5 rounded-xl text-base font-medium text-slate-700 focus:border-indigo-500 outline-none transition-all bg-white";

const STATUS_COLORS = {
  'Aguardando Fatura': 'bg-gray-100 text-gray-700 border-gray-300',
  'Pendente Lançamento': 'bg-yellow-50 text-yellow-800 border-yellow-300',
  'Aguardando Pagamento': 'bg-blue-50 text-blue-800 border-blue-300',
  'Concluída': 'bg-green-100 text-green-800 border-green-300',
};

const OPCOES_STATUS = ['Aguardando Fatura', 'Pendente Lançamento', 'Aguardando Pagamento', 'Concluída'];

const FileDrop = ({ label, onFileSelect, existingFile, metaData }) => {
  const [fileName, setFileName] = useState(null);
  
  useEffect(() => { 
      setFileName(existingFile ? existingFile.split('/').pop() : null); 
  }, [existingFile]);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validação
    if (!metaData.fornecedor || !metaData.nota) {
      alert("⚠️ Atenção: Selecione o Fornecedor e preencha o Nº da Nota antes de anexar o arquivo.");
      e.target.value = null; 
      return;
    }

    setFileName(file.name);
    const fd = new FormData();
    fd.append("file", file); 
    fd.append("fornecedor", metaData.fornecedor);
    fd.append("nota", metaData.nota); 
    fd.append("vencimento", metaData.vencimento || "S_D");
    
    try { 
        const res = await axios.post(`${API_URL}/upload/`, fd); 
        onFileSelect(res.data.path); 
    } catch { 
        alert("Erro no upload"); 
        setFileName(null);
    }
  };

  return (
    <div className="w-full">
      <label className={LABEL_STYLE}>{label}</label>
      <div className="relative border-2 border-dashed border-indigo-300 rounded-xl p-3 hover:bg-indigo-50 text-center cursor-pointer group bg-white h-[80px] flex flex-col items-center justify-center">
        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFile} accept=".pdf,.png,.jpg"/>
        <div className="flex flex-col items-center justify-center gap-1">
          {fileName ? <FileText className="text-indigo-600" size={20}/> : <UploadCloud className="text-indigo-400 group-hover:text-indigo-600" size={20}/>}
          <span className="text-xs font-medium text-slate-600 truncate max-w-[200px]">{fileName || "Clique ou Arraste"}</span>
        </div>
      </div>
    </div>
  );
};

export default function ITFinControl() {
  const [loading, setLoading] = useState(false);
  const [dadosBrutos, setDadosBrutos] = useState([]);
  const [filiais, setFiliais] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [filialFiltro, setFilialFiltro] = useState('');
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [expandedSupplier, setExpandedSupplier] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [opcoesFornecedor, setOpcoesFornecedor] = useState({ cnpjs: [], contratos: [], ccs: [] });

  const initialForm = {
    id: null, filial_id: '', fornecedor_id: '', 
    cnpj_usado: '', contrato_usado: '', centro_custo_usado: '',
    numero_nota: '', serie: 'U', valor: '',
    data_envio: '', data_vencimento: '',
    descricao_servico: '', servico_protheus: '', 
    numero_medicao: '', numero_pedido: '', solicitacao_fluig: '', observacao: '',
    status_pagamento: 'Pendente Lançamento', arquivo_nota: '', arquivo_boleto: ''
  };

  const [form, setForm] = useState(initialForm);
  // Garante nome atualizado para o upload, mesmo durante edição/cópia
  const fornecedorObj = fornecedores.find(f => f.id == form.fornecedor_id);
  const nomeFornecedorAtual = fornecedorObj?.nome_empresa || "";

  useEffect(() => { carregarDados(); }, [filialFiltro]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resFil, resForn, resDados] = await Promise.all([
        axios.get(`${API_URL}/filiais/`),
        axios.get(`${API_URL}/fornecedores/`),
        axios.get(`${API_URL}/dados-agrupados/`, filialFiltro ? { params: { filial_id: filialFiltro } } : {})
      ]);
      setFiliais(resFil.data);
      setFornecedores(resForn.data);
      let lista = [];
      resDados.data.forEach(forn => {
        if(forn.lancamentos) forn.lancamentos.forEach(nota => lista.push({ ...nota, nome_fornecedor: forn.nome_empresa }));
      });
      setDadosBrutos(lista);
      const hoje = new Date();
      if (!expandedMonth) setExpandedMonth(`${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleFornecedorChange = (id) => {
    const forn = fornecedores.find(f => f.id == id);
    if (forn) {
      setOpcoesFornecedor({
        cnpjs: forn.lista_cnpjs ? forn.lista_cnpjs.split(';') : [],
        contratos: forn.lista_contratos ? forn.lista_contratos.split(';') : [],
        ccs: forn.lista_centro_custos ? forn.lista_centro_custos.split(';') : []
      });
      setForm(prev => ({ 
          ...prev, 
          fornecedor_id: id, cnpj_usado: '', contrato_usado: '', centro_custo_usado: '',
          descricao_servico: forn.padrao_descricao_servico || '',
          servico_protheus: forn.padrao_servico_protheus || ''
      }));
    } else {
        setForm(prev => ({...prev, fornecedor_id: id}));
    }
  };

  const abrirEdicao = (nota) => {
    setIsEditMode(true);
    const forn = fornecedores.find(f => f.id === nota.fornecedor_id);
    if(forn) {
        setOpcoesFornecedor({
            cnpjs: forn.lista_cnpjs ? forn.lista_cnpjs.split(';') : [],
            contratos: forn.lista_contratos ? forn.lista_contratos.split(';') : [],
            ccs: forn.lista_centro_custos ? forn.lista_centro_custos.split(';') : []
        });
    }
    setForm(nota);
    setShowModal(true);
  };

  const duplicarNota = (nota) => {
    setIsEditMode(false);
    const forn = fornecedores.find(f => f.id === nota.fornecedor_id);
    if(forn) {
        setOpcoesFornecedor({
            cnpjs: forn.lista_cnpjs ? forn.lista_cnpjs.split(';') : [],
            contratos: forn.lista_contratos ? forn.lista_contratos.split(';') : [],
            ccs: forn.lista_centro_custos ? forn.lista_centro_custos.split(';') : []
        });
    }
    // Cria cópia limpa
    setForm({
        ...nota, 
        id: null, 
        numero_nota: '', 
        arquivo_nota: '', 
        arquivo_boleto: '',
        status_pagamento: 'Pendente Lançamento'
    });
    setShowModal(true);
  };

  const salvarForm = async () => {
    if (!form.filial_id || !form.fornecedor_id || !form.valor || !form.numero_nota) return alert("Preencha campos obrigatórios (*)");
    try {
      if (isEditMode && form.id) await axios.put(`${API_URL}/lancamentos/${form.id}`, form);
      else await axios.post(`${API_URL}/lancamentos/`, form);
      setShowModal(false);
      carregarDados();
    } catch { alert("Erro ao salvar"); }
  };

  const copiarParaProtheus = (nota) => {
    const venc = nota.data_vencimento.split('-').reverse().join('/');
    const valor = nota.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    const desc = nota.descricao_servico ? `: ${nota.descricao_servico}` : '';
    const texto = `${nota.nome_fornecedor}${desc} | CPF/CNPJ: ${nota.cnpj_usado || '?'} | NF: ${nota.numero_nota} | Valor R$: ${valor} | Vencimento: ${venc}`;
    navigator.clipboard.writeText(texto).then(() => alert("Copiado para Protheus!\n\n" + texto));
  };

  const calcularDias = (dataVencimento) => {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const [a, m, d] = dataVencimento.split('-');
    return Math.ceil((new Date(a, m - 1, d) - hoje) / (86400000));
  };

  const getAlertStyle = (dataVencimento, status) => {
    if (status === 'Concluída') return 'border-l-8 border-green-500 bg-white'; 
    const dias = calcularDias(dataVencimento);
    if (dias < 0) return 'border-l-8 border-gray-800 bg-red-50'; 
    if (dias <= 5) return 'border-l-8 border-red-600 bg-red-50'; 
    if (dias <= 10) return 'border-l-8 border-yellow-500 bg-yellow-50'; 
    return 'border-l-8 border-green-500 bg-white';
  };

  const getAlertBadge = (dataVencimento, status) => {
    if (status === 'Concluída') return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1"><CheckCircle size={12}/> CONCLUÍDO</span>;
    const dias = calcularDias(dataVencimento);
    if (dias < 0) return <span className="bg-gray-800 text-white px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1"><X size={12}/> VENCIDA ({Math.abs(dias)}d)</span>;
    if (dias === 0) return <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 animate-pulse"><AlertTriangle size={12}/> HOJE</span>;
    if (dias <= 5) return <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1"><AlertTriangle size={12}/> {dias} DIAS</span>;
    if (dias <= 10) return <span className="bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1"><Clock size={12}/> {dias} DIAS</span>;
    return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1"><CheckCircle size={12}/> NO PRAZO</span>;
  };

  const getGroupedData = () => {
    const grupos = {};
    dadosBrutos.forEach(nota => {
      const [ano, mes] = nota.data_vencimento.split('-');
      const chaveMes = `${mes}/${ano}`;
      if (!grupos[chaveMes]) grupos[chaveMes] = {};
      if (!grupos[chaveMes][nota.nome_fornecedor]) grupos[chaveMes][nota.nome_fornecedor] = [];
      grupos[chaveMes][nota.nome_fornecedor].push(nota);
    });
    return Object.entries(grupos).sort((a, b) => {
        const [ma, aa] = a[0].split('/'); const [mb, ab] = b[0].split('/');
        return new Date(ab, mb - 1) - new Date(aa, ma - 1);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <header className="bg-white px-8 py-4 sticky top-0 z-20 flex justify-between items-center shadow-sm border-b border-slate-200">
        <div className="flex items-center gap-4">
           <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200"><Server size={24} /></div>
           <div><h1 className="text-xl font-black text-slate-800 tracking-tight">IT FinControl</h1><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Gestão Financeira</p></div>
        </div>
        <div className="flex gap-4 items-center">
           {loading && <Loader2 className="animate-spin text-indigo-600" size={24}/>}
           <select className="bg-slate-50 border-2 border-slate-200 p-2 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer" 
             value={filialFiltro} onChange={e => setFilialFiltro(e.target.value)}>
             <option value="">Todas Filiais</option>
             {filiais.map(f => <option key={f.id} value={f.id}>{f.codigo} - {f.nome_fantasia}</option>)}
           </select>
           <button onClick={() => { setForm(initialForm); setIsEditMode(false); setShowModal(true); }} 
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-sm flex gap-2 items-center shadow-lg shadow-indigo-200 transition-all active:scale-95">
             <Plus size={18}/> Novo
           </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-8 space-y-8 pb-20">
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           <KpiCard title="Aguardando Fatura" count={dadosBrutos.filter(n => n.status_pagamento === 'Aguardando Fatura').length} color="gray" icon={<Clock/>}/>
           <KpiCard title="Pendente Lançamento" count={dadosBrutos.filter(n => n.status_pagamento === 'Pendente Lançamento').length} color="yellow" icon={<AlertTriangle/>}/>
           <KpiCard title="Aguardando Pagto" count={dadosBrutos.filter(n => n.status_pagamento === 'Aguardando Pagamento').length} color="blue" icon={<Calendar/>}/>
           <KpiCard title="Concluída" count={dadosBrutos.filter(n => n.status_pagamento === 'Concluída').length} color="green" icon={<CheckCircle/>}/>
        </div>

        {/* LISTAGEM */}
        <div className="space-y-6">
          {getGroupedData().map(([mes, fornecedoresDict]) => (
            <div key={mes} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div onClick={() => setExpandedMonth(expandedMonth === mes ? null : mes)} 
                 className="bg-gradient-to-r from-slate-50 to-white p-4 border-b border-slate-200 flex justify-between cursor-pointer hover:from-indigo-50 transition-all">
                 <div className="flex items-center gap-3 font-black text-lg text-slate-700">
                    <Calendar size={20} className="text-indigo-600"/> Vencimento: {mes}
                 </div>
                 <ChevronDown className={`text-slate-400 transition-transform ${expandedMonth === mes ? 'rotate-180' : ''}`}/>
               </div>

               {expandedMonth === mes && (
                 <div className="p-6 space-y-6 bg-slate-50/50">
                   {Object.entries(fornecedoresDict).map(([nomeForn, notas]) => {
                     const isExpanded = expandedSupplier[`${mes}-${nomeForn}`];
                     return (
                       <div key={nomeForn} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                         <div onClick={() => setExpandedSupplier(prev => ({ ...prev, [`${mes}-${nomeForn}`]: !prev[`${mes}-${nomeForn}`] }))}
                           className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors">
                            <span className="font-bold text-base text-slate-700 flex gap-3 items-center"><Server size={18} className="text-slate-400"/> {nomeForn}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full">{notas.length} notas</span>
                              <ChevronDown size={18} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}/>
                            </div>
                         </div>

                         {isExpanded && (
                           <div className="divide-y divide-slate-100">
                             {notas.map(nota => (
                               <div key={nota.id} className={`p-5 hover:bg-white transition-colors group ${getAlertStyle(nota.data_vencimento, nota.status_pagamento)}`}>
                                 <div className="flex flex-col xl:flex-row justify-between gap-4 mb-4">
                                    <div className="flex items-start gap-4">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl font-black text-slate-800">NF {nota.numero_nota}</span>
                                            {getAlertBadge(nota.data_vencimento, nota.status_pagamento)}
                                        </div>
                                        <div className="flex gap-3 text-xs text-slate-500 font-bold uppercase tracking-wide">
                                           <span>{nota.cnpj_usado || 'S/ CNPJ'}</span>
                                           <span className="text-slate-300">|</span>
                                           <span>{nota.contrato_usado || 'S/ Contrato'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                       <div className="text-right hidden md:block">
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Valor Total</p>
                                          <p className="text-xl font-black text-slate-800">R$ {nota.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                                       </div>
                                       
                                       <div className="flex gap-2">
                                         <button onClick={() => copiarParaProtheus(nota)} className="p-2 bg-green-50 text-green-700 rounded-lg border border-green-100 hover:bg-green-100 font-bold text-xs flex flex-col items-center justify-center w-16 transition-all" title="Copiar"><ClipboardList size={18}/>Copiar</button>
                                         {nota.arquivo_nota && <button onClick={() => window.open(`${API_URL}/${nota.arquivo_nota}`, '_blank')} className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 font-bold text-xs flex flex-col items-center justify-center w-16" title="Nota"><FileText size={16}/>Nota</button>}
                                         <button onClick={() => abrirEdicao(nota)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={18}/></button>
                                         <button onClick={() => duplicarNota(nota)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Copy size={18}/></button>
                                       </div>
                                    </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-y-3 gap-x-4 text-sm text-slate-600 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                   <div><strong className="block text-indigo-400 uppercase text-[10px] font-bold mb-0.5">Vencimento</strong>{nota.data_vencimento.split('-').reverse().join('/')}</div>
                                   <div><strong className="block text-indigo-400 uppercase text-[10px] font-bold mb-0.5">Envio TI</strong>{nota.data_envio ? nota.data_envio.split('-').reverse().join('/') : '-'}</div>
                                   <div><strong className="block text-indigo-400 uppercase text-[10px] font-bold mb-0.5">Centro Custo</strong>{nota.centro_custo_usado}</div>
                                   <div><strong className="block text-indigo-400 uppercase text-[10px] font-bold mb-0.5">Pedido</strong>{nota.numero_pedido || '-'}</div>
                                   <div><strong className="block text-indigo-400 uppercase text-[10px] font-bold mb-0.5">Fluig</strong>{nota.solicitacao_fluig || '-'}</div>
                                   <div className="xl:col-span-1">
                                     <select value={nota.status_pagamento} onChange={async (e) => {
                                        const st = e.target.value;
                                        setDadosBrutos(prev => prev.map(n => n.id === nota.id ? { ...n, status_pagamento: st } : n));
                                        await axios.patch(`${API_URL}/lancamentos/${nota.id}/status`, { status: st });
                                     }} className={`w-full text-xs font-bold py-1 px-2 rounded border outline-none ${STATUS_COLORS[nota.status_pagamento]}`}>
                                        {OPCOES_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                                     </select>
                                   </div>
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
         <div className="max-w-[1600px] mx-auto px-8 flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
            <p>Sistema de Gestão de Notas T.I.</p>
            <div className="flex gap-4">
               <span>Versão 2.0</span>
               <span>&copy; 2025</span>
            </div>
         </div>
      </footer>

      {/* MODAL COM SCROLL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
             {/* CABEÇALHO FIXO */}
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                <h2 className="text-2xl font-black flex gap-3 text-slate-800 items-center">
                    <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600"><Plus size={24}/></div>
                    {isEditMode ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={32}/></button>
             </div>
             
             {/* CORPO COM SCROLL */}
             <div className="flex-1 overflow-y-auto p-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* BLOCOS DO FORMULÁRIO (Igual anterior, mas agora rolando) */}
                    <div className="md:col-span-1">
                       <label className={LABEL_STYLE}>Filial *</label>
                       <select className={INPUT_STYLE} value={form.filial_id} onChange={e => setForm({...form, filial_id: e.target.value})}>
                          <option>Selecione...</option>
                          {filiais.map(f => <option key={f.id} value={f.id}>{f.codigo} - {f.nome_fantasia}</option>)}
                       </select>
                    </div>
                    <div className="md:col-span-1">
                       <label className={LABEL_STYLE}>Fornecedor *</label>
                       <select className={INPUT_STYLE} value={form.fornecedor_id} onChange={e => handleFornecedorChange(e.target.value)}>
                          <option>Selecione...</option>
                          {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome_empresa}</option>)}
                       </select>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <div>
                            <label className="text-[11px] font-bold uppercase text-indigo-400 mb-1.5 block">CNPJ</label>
                            <select className="input-modal text-xs w-full bg-white border border-indigo-200 p-2 rounded" value={form.cnpj_usado} onChange={e => setForm({...form, cnpj_usado: e.target.value})}>
                                <option value="">Selecione...</option>
                                {opcoesFornecedor.cnpjs.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold uppercase text-indigo-400 mb-1.5 block">Contrato</label>
                            <select className="input-modal text-xs w-full bg-white border border-indigo-200 p-2 rounded" value={form.contrato_usado} onChange={e => setForm({...form, contrato_usado: e.target.value})}>
                                <option value="">Selecione...</option>
                                {opcoesFornecedor.contratos.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[11px] font-bold uppercase text-indigo-400 mb-1.5 block">Centro de Custo</label>
                            <select className="input-modal text-xs w-full bg-white border border-indigo-200 p-2 rounded" value={form.centro_custo_usado} onChange={e => setForm({...form, centro_custo_usado: e.target.value})}>
                                <option value="">Selecione...</option>
                                {opcoesFornecedor.ccs.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="col-span-4 border-t border-slate-100"></div>

                    <div><label className={LABEL_STYLE}>Nº Nota *</label><input className={INPUT_STYLE} value={form.numero_nota} onChange={e => setForm({...form, numero_nota: e.target.value})}/></div>
                    <div><label className={LABEL_STYLE}>Série</label><input className={INPUT_STYLE} placeholder="U" value={form.serie} onChange={e => setForm({...form, serie: e.target.value})}/></div>
                    <div><label className={LABEL_STYLE}>Valor (R$) *</label><input type="number" className={INPUT_STYLE} value={form.valor} onChange={e => setForm({...form, valor: e.target.value})}/></div>
                    <div><label className={LABEL_STYLE}>Status</label><select className={INPUT_STYLE} value={form.status_pagamento} onChange={e => setForm({...form, status_pagamento: e.target.value})}>{OPCOES_STATUS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>

                    <div><label className={LABEL_STYLE}>Data Envio TI</label><input type="date" className={INPUT_STYLE} value={form.data_envio || ''} onChange={e => setForm({...form, data_envio: e.target.value})}/></div>
                    <div><label className={LABEL_STYLE}>Vencimento *</label><input type="date" className={INPUT_STYLE} value={form.data_vencimento} onChange={e => setForm({...form, data_vencimento: e.target.value})}/></div>
                    <div className="col-span-2"></div>

                    <div className="col-span-4 bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 grid grid-cols-3 gap-5">
                        <div className="col-span-3 text-xs font-black text-indigo-400 uppercase tracking-widest">Controle T.I.</div>
                        <div><label className={LABEL_STYLE}>Medição</label><input className={INPUT_STYLE} value={form.numero_medicao} onChange={e => setForm({...form, numero_medicao: e.target.value})}/></div>
                        <div><label className={LABEL_STYLE}>Pedido</label><input className={INPUT_STYLE} value={form.numero_pedido} onChange={e => setForm({...form, numero_pedido: e.target.value})}/></div>
                        <div><label className={LABEL_STYLE}>Fluig</label><input className={INPUT_STYLE} value={form.solicitacao_fluig} onChange={e => setForm({...form, solicitacao_fluig: e.target.value})}/></div>
                        <div className="col-span-3 grid grid-cols-2 gap-5">
                            <div><label className={LABEL_STYLE}>Descrição Serviço</label><input className={INPUT_STYLE} value={form.descricao_servico} onChange={e => setForm({...form, descricao_servico: e.target.value})}/></div>
                            <div><label className={LABEL_STYLE}>Serviço Protheus</label><input className={INPUT_STYLE} value={form.servico_protheus} onChange={e => setForm({...form, servico_protheus: e.target.value})}/></div>
                        </div>
                    </div>

                    <div className="col-span-2 mt-2"><FileDrop label="Anexar Nota Fiscal" onFileSelect={path => setForm({...form, arquivo_nota: path})} existingFile={form.arquivo_nota} metaData={{fornecedor: nomeFornecedorAtual, nota: form.numero_nota, vencimento: form.data_vencimento}}/></div>
                    <div className="col-span-2 mt-2"><FileDrop label="Anexar Boleto" onFileSelect={path => setForm({...form, arquivo_boleto: path})} existingFile={form.arquivo_boleto} metaData={{fornecedor: nomeFornecedorAtual, nota: form.numero_nota, vencimento: form.data_vencimento}}/></div>

                    <div className="col-span-4 mt-2"><label className={LABEL_STYLE}>Observações</label><textarea className={`${INPUT_STYLE} h-24 resize-none`} value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})}/></div>
                 </div>
             </div>

             {/* RODAPÉ FIXO DO MODAL */}
             <div className="p-6 border-t border-slate-100 bg-white z-10">
                <button onClick={salvarForm} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl text-xl shadow-xl shadow-indigo-200 transition-all active:scale-[0.98]">
                  {isEditMode ? 'Atualizar Lançamento' : 'Salvar Lançamento'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

const KpiCard = ({ title, count, color, icon }) => {
  const styles = {
    gray: 'border-slate-300 text-slate-600 bg-white',
    yellow: 'border-yellow-400 text-yellow-800 bg-yellow-50',
    blue: 'border-blue-400 text-blue-700 bg-blue-50',
    green: 'border-green-500 text-green-700 bg-green-50',
  };
  return (
    <div className={`p-6 rounded-2xl border-b-4 shadow-sm hover:-translate-y-1 transition-transform bg-white ${styles[color]}`}>
      <div className="flex justify-between items-center">
        <div><p className="text-[11px] font-black opacity-60 uppercase tracking-widest">{title}</p><p className="text-4xl font-black mt-1 tracking-tighter">{count}</p></div>
        <div className="opacity-80 p-3 bg-white/60 rounded-xl backdrop-blur-sm">{icon}</div>
      </div>
    </div>
  );
}
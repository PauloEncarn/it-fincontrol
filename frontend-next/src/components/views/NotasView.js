import React, { useState } from 'react';
import { Server, ChevronDown, Edit2, Copy, Mail, FileText, Paperclip, ClipboardList, Calendar } from 'lucide-react';
import { STATUS_STYLES, OPCOES_STATUS } from '@/utils/constants';

export default function NotasView({ 
    notas, 
    competencia, setCompetencia,
    filiais, filialFiltro, setFilialFiltro,
    statusFiltro, setStatusFiltro,
    onEditar, onDuplicar, onCopiarProtheus, onEnviarEmail, onDownload, onStatusChange, isGopaFunc 
}) {
  const [expandedSupplier, setExpandedSupplier] = useState({});

  // 1. FILTRAGEM LOCAL
  const notasFiltradas = notas.filter(n => {
      const matchStatus = statusFiltro.length === 0 || statusFiltro.includes(n.status_pagamento);
      const matchFilial = !filialFiltro || n.filial_id == filialFiltro;
      return matchStatus && matchFilial;
  });

  // 2. AGRUPAMENTO
  const getGroupedData = () => {
      const grupos = {};
      notasFiltradas.forEach(n => { if(!grupos[n.nome_fornecedor]) grupos[n.nome_fornecedor]=[]; grupos[n.nome_fornecedor].push(n); });
      return Object.entries(grupos).sort((a,b) => a[0].localeCompare(b[0]));
  };

  const dadosAgrupados = getGroupedData();
  const toggleExpand = (nome) => setExpandedSupplier(prev => ({...prev, [nome]: !prev[nome]}));

  const getSemaforoClass = (venc, status) => { 
      if (status === 'Concluída') return 'border-emerald-500 bg-emerald-50/10'; 
      const dias = Math.ceil((new Date(venc.split('T')[0]) - new Date().setHours(0,0,0,0))/86400000); 
      if (dias < 0) return 'border-[#E30613] bg-red-50'; 
      if (dias <= 5) return 'border-[#F77F00] bg-orange-50'; 
      if (dias <= 10) return 'border-[#F9C531] bg-yellow-50'; 
      return 'border-slate-200 bg-white'; 
  };

  const handleDateChange = (e) => {
    if (!e.target.value) return;
    const [ano, mes] = e.target.value.split('-');
    const novaData = new Date(ano, mes - 1, 1, 12, 0, 0);
    setCompetencia(novaData);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
        
        {/* BARRA DE FERRAMENTAS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-center justify-between">
            
            {/* SELETOR DE MÊS */}
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div className="text-[#1E22A8]"><Calendar size={20}/></div>
                <input 
                    type="month" 
                    value={competencia.toISOString().slice(0, 7)} 
                    onChange={handleDateChange}
                    className="bg-transparent font-black text-[#1E22A8] outline-none uppercase text-sm cursor-pointer"
                />
            </div>

            {/* FILTROS */}
            <div className="flex flex-1 gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <select 
                    value={filialFiltro}
                    onChange={(e) => setFilialFiltro(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-[#1E22A8]"
                >
                    <option value="">Todas as Filiais</option>
                    {filiais.map(f => <option key={f.id} value={f.id}>{f.nome_fantasia}</option>)}
                </select>

                <div className="flex gap-2">
                    {['Pendente Lançamento', 'Aguardando Fatura', 'Aguardando Pagamento'].map(st => (
                        <button 
                            key={st}
                            onClick={() => setStatusFiltro(prev => prev.includes(st) ? prev.filter(x => x !== st) : [...prev, st])}
                            className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase border transition-all whitespace-nowrap
                                ${statusFiltro.includes(st) 
                                    ? 'bg-[#1E22A8] text-white border-[#1E22A8]' 
                                    : 'bg-white text-slate-400 border-slate-200 hover:border-[#1E22A8] hover:text-[#1E22A8]'
                                }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* LISTA DE NOTAS */}
        <div className="space-y-4">
            {dadosAgrupados.length === 0 && (
                <div className="text-center py-20 text-slate-400 font-medium">Nenhuma nota encontrada neste período/filtro.</div>
            )}

            {dadosAgrupados.map(([nm, nts]) => { 
                const exp = expandedSupplier[nm]; 
                return (
                    <div key={nm} className={`bg-white/95 backdrop-blur-sm border border-white/50 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 border-l-4 border-l-[#1E22A8]`}>
                        <div onClick={()=>toggleExpand(nm)} className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#1E22A8]/5 p-2 rounded-lg text-[#1E22A8]"><Server size={20}/></div>
                                <span className="font-bold text-lg text-[#1E22A8] tracking-wide">{nm}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold bg-[#1E22A8] text-white px-3 py-1 rounded-full shadow-sm">{nts.length}</span>
                                <div className={`p-1 rounded-full bg-slate-100 transition-transform duration-300 ${exp?'rotate-180':''}`}><ChevronDown size={18}/></div>
                            </div>
                        </div>
                        
                        {exp && (
                            <div className="bg-slate-50 p-4 grid gap-3 border-t border-slate-100">
                                {nts.map(n => (
                                    <div key={n.id} className={`bg-white rounded-xl shadow-sm border-l-[6px] p-5 hover:shadow-md transition-all relative overflow-hidden group ${getSemaforoClass(n.data_vencimento, n.status_pagamento)}`}>
                                        <div className="flex flex-col xl:flex-row justify-between gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xl font-black text-slate-800">#{n.numero_nota}</span>
                                                    {n.serie && <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">SÉRIE {n.serie}</span>}
                                                    <span className="text-[10px] font-bold bg-[#1E22A8]/10 text-[#1E22A8] px-2 py-0.5 rounded border border-[#1E22A8]/20 uppercase">{n.filial?.nome_fantasia}</span>
                                                </div>
                                                <div className="flex gap-3 text-xs text-slate-500">
                                                    <span>CNPJ: <strong className="text-slate-700">{n.cnpj_usado}</strong></span>
                                                    <span>|</span>
                                                    <span>Contrato: <strong className="text-slate-700">{n.contrato_usado || '-'}</strong></span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Valor</p>
                                                <p className="text-2xl font-black text-[#1E22A8]">R$ {parseFloat(n.valor).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <div className="w-full sm:w-auto">
                                                <select 
                                                    value={n.status_pagamento || ""} 
                                                    onChange={(e) => onStatusChange(n.id, e.target.value)} 
                                                    className={`w-full appearance-none text-[10px] font-black uppercase py-1.5 px-3 rounded border cursor-pointer outline-none ${STATUS_STYLES[n.status_pagamento]?.bg || 'bg-gray-100'} ${STATUS_STYLES[n.status_pagamento]?.border || 'border-gray-200'} ${STATUS_STYLES[n.status_pagamento]?.text || 'text-gray-500'}`}
                                                >
                                                    {OPCOES_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                 <button onClick={()=>onCopiarProtheus(n)} className="p-2 hover:bg-white rounded-md text-[#1E22A8] transition-colors" title="Copiar"><ClipboardList size={18}/></button>
                                                 {isGopaFunc(n) && ( <button onClick={() => onEnviarEmail(n)} className="p-2 hover:bg-white rounded-md text-purple-600 transition-colors" title="Email"><Mail size={18}/></button> )}
                                                 {n.arquivo_nota && (<button onClick={()=>onDownload(n.arquivo_nota)} className="p-2 hover:bg-white rounded-md text-red-500 transition-colors" title="Nota"><FileText size={18}/></button>)}
                                                 {n.arquivo_boleto && (<button onClick={()=>onDownload(n.arquivo_boleto)} className="p-2 hover:bg-white rounded-md text-blue-500 transition-colors" title="Boleto"><Paperclip size={18}/></button>)}
                                                 <button onClick={()=>onEditar(n)} className="p-2 hover:bg-white rounded-md text-slate-500 hover:text-[#1E22A8] transition-colors" title="Editar"><Edit2 size={18}/></button>
                                                 <button onClick={()=>onDuplicar(n)} className="p-2 hover:bg-white rounded-md text-slate-500 hover:text-[#1E22A8] transition-colors" title="Duplicar"><Copy size={18}/></button>
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
    </div>
  );
}
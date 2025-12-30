import React, { useState } from 'react';
import { Server, ChevronDown, Edit2, Copy, Mail, FileText, Paperclip, ClipboardList, Filter, Calendar } from 'lucide-react';
import { STATUS_STYLES, OPCOES_STATUS } from '@/utils/constants';

export default function NotasView({ 
    notas, 
    competencia, setCompetencia,
    filiais, filialFiltro, setFilialFiltro,
    statusFiltro, setStatusFiltro,
    onEditar, onDuplicar, onCopiarProtheus, onEnviarEmail, onDownload, onStatusChange, isGopaFunc 
}) {
  const [expandedSupplier, setExpandedSupplier] = useState({});

  // Filtragem (NOTA: Este filtro é independente do Dashboard)
  const notasFiltradas = notas.filter(n => {
      const matchStatus = statusFiltro.length === 0 || statusFiltro.includes(n.status_pagamento);
      const matchFilial = !filialFiltro || n.filial_id == filialFiltro;
      // Adicionar filtro de competência aqui se os dados brutos vierem de todos os meses
      return matchStatus && matchFilial;
  });

  const getGroupedData = () => {
      const grupos = {};
      notasFiltradas.forEach(n => { if(!grupos[n.nome_fornecedor]) grupos[n.nome_fornecedor]=[]; grupos[n.nome_fornecedor].push(n); });
      return Object.entries(grupos).sort((a,b) => a[0].localeCompare(b[0]));
  };

  const dadosAgrupados = getGroupedData();
  const toggleExpand = (nome) => setExpandedSupplier(prev => ({...prev, [nome]: !prev[nome]}));

  const handleDateChange = (e) => {
    if (!e.target.value) return;
    const [ano, mes] = e.target.value.split('-');
    setCompetencia(new Date(ano, mes - 1, 1, 12, 0, 0));
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
        
        {/* --- BARRA DE FILTROS ESPECÍFICA DE NOTAS (Separada do Dash) --- */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-20 z-30">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="bg-blue-50 p-2 rounded-lg text-[#1E22A8]">
                    <Filter size={20}/>
                </div>
                
                {/* Seletor de Mês (Controla setCompetencia do Pai) */}
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <Calendar size={16} className="text-slate-400"/>
                    <input 
                        type="month" 
                        value={competencia.toISOString().slice(0, 7)} 
                        onChange={handleDateChange}
                        className="bg-transparent font-bold text-slate-700 outline-none uppercase text-xs cursor-pointer"
                    />
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                 <select 
                    value={filialFiltro}
                    onChange={(e) => setFilialFiltro(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-[#1E22A8]"
                >
                    <option value="">Todas as Filiais</option>
                    {filiais.map(f => <option key={f.id} value={f.id}>{f.nome_fantasia}</option>)}
                </select>
            </div>
        </div>

        {/* --- LISTAGEM --- */}
        <div className="space-y-4">
            {dadosAgrupados.map(([nm, nts]) => { 
                const exp = expandedSupplier[nm]; 
                const totalGrupo = nts.reduce((acc,n) => acc+parseFloat(n.valor),0);
                
                return (
                    <div key={nm} className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden transition-all">
                        {/* HEADER DO GRUPO */}
                        <div onClick={()=>toggleExpand(nm)} className="px-5 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 border-l-4 border-l-transparent hover:border-l-[#1E22A8] transition-all">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${exp ? 'bg-[#1E22A8] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <Server size={20}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-700 text-base">{nm}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{nts.length} Notas • Total: R$ {totalGrupo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                                </div>
                            </div>
                            <ChevronDown size={20} className={`text-slate-300 transition-transform ${exp?'rotate-180':''}`}/>
                        </div>
                        
                        {/* LISTA DE CARDS */}
                        {exp && (
                            <div className="bg-slate-50 p-4 grid gap-3 border-t border-slate-100">
                                {nts.map(n => (
                                    <div key={n.id} className="bg-white rounded-xl p-0 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                                        
                                        {/* Barra de Status Colorida no Topo */}
                                        <div className={`h-1.5 w-full ${STATUS_STYLES[n.status_pagamento]?.bg.replace('bg-', 'bg-').replace('50', '500') || 'bg-slate-300'}`}></div>

                                        <div className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                            
                                            {/* BLOCO 1: Identificação */}
                                            <div className="flex-1 min-w-[200px]">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-lg font-black text-slate-800">#{n.numero_nota}</span>
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase">{n.filial?.nome_fantasia}</span>
                                                </div>
                                                <div className="text-xs text-slate-500 space-y-0.5">
                                                    <p>CNPJ: <span className="font-semibold text-slate-700">{n.cnpj_usado}</span></p>
                                                    <p>Vencimento: <span className="font-semibold text-slate-700">{n.data_vencimento ? n.data_vencimento.split('-').reverse().join('/') : '-'}</span></p>
                                                </div>
                                            </div>

                                            {/* BLOCO 2: Valor (DESTAQUE) */}
                                            <div className="flex-1 text-left md:text-center">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valor Líquido</p>
                                                <p className="text-2xl font-black text-[#1E22A8] tracking-tight">
                                                    R$ {parseFloat(n.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                                </p>
                                            </div>

                                            {/* BLOCO 3: Status e Ações */}
                                            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                                                <select 
                                                    value={n.status_pagamento || ""} 
                                                    onChange={(e) => onStatusChange(n.id, e.target.value)} 
                                                    className={`w-full md:w-48 appearance-none text-[10px] font-black uppercase py-2 px-3 rounded-lg border cursor-pointer outline-none transition-all ${STATUS_STYLES[n.status_pagamento]?.bg} ${STATUS_STYLES[n.status_pagamento]?.text} ${STATUS_STYLES[n.status_pagamento]?.border}`}
                                                >
                                                    {OPCOES_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>

                                                <div className="flex gap-1">
                                                    <button onClick={()=>onCopiarProtheus(n)} className="p-2 text-slate-400 hover:text-[#1E22A8] hover:bg-blue-50 rounded-md transition-colors" title="Copiar"><ClipboardList size={18}/></button>
                                                    {isGopaFunc(n) && <button onClick={()=>onEnviarEmail(n)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors" title="Email"><Mail size={18}/></button>}
                                                    {n.arquivo_nota && <button onClick={()=>onDownload(n.arquivo_nota)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Nota"><FileText size={18}/></button>}
                                                    <button onClick={()=>onEditar(n)} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-md transition-colors" title="Editar"><Edit2 size={18}/></button>
                                                    <button onClick={()=>onDuplicar(n)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors" title="Duplicar"><Copy size={18}/></button>
                                                </div>
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
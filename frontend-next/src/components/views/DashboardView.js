import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Server, ChevronDown, Edit2, Copy, Mail, FileText, Paperclip, ClipboardList, CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';
import BotaoExportar from '@/components/ui/BotaoExportar'; 
import { Download } from 'lucide-react'; // Opcional, se quiser customizar ícone
import { CORES, STATUS_STYLES, OPCOES_STATUS } from '@/utils/constants';


export default function DashboardView({ 
    kpis, 
    filtros, 
    onFilter, 
    dadosAgrupados, 
    competencia, 
    mudarMes,
    onEditar,
    onDuplicar,
    onCopiarProtheus,
    onEnviarEmail,
    onDownload,
    onStatusChange,
    isGopaFunc // Função para checar se é GOPA
}) {
  const [expandedSupplier, setExpandedSupplier] = useState({});

  const toggleExpand = (nome) => {
    setExpandedSupplier(prev => ({...prev, [nome]: !prev[nome]}));
  };

  const getSemaforoClass = (venc, status) => { 
      if (status === 'Concluída') return 'border-emerald-500 bg-emerald-50/10'; 
      const dias = Math.ceil((new Date(venc.split('T')[0]) - new Date().setHours(0,0,0,0))/86400000); 
      if (dias < 0) return 'border-[#E30613] bg-red-50'; 
      if (dias <= 5) return 'border-[#F77F00] bg-orange-50'; 
      if (dias <= 10) return 'border-[#F9C531] bg-yellow-50'; 
      return 'border-slate-200 bg-white'; 
  };

  const mesExibicao = new Date(competencia).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-in fade-in">
        {/* KPIS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Aguardando Fatura" count={kpis.filter(n=>n.status_pagamento==='Aguardando Fatura').length} colorHex={CORES.amareloAlerta} icon={<Clock size={100}/>} isActive={filtros.includes('Aguardando Fatura')} onClick={()=>onFilter('Aguardando Fatura')}/>
            <KpiCard title="Pendente Lançamento" count={kpis.filter(n=>n.status_pagamento==='Pendente Lançamento').length} colorHex={CORES.vermelhoCicopal} icon={<AlertTriangle size={100}/>} isActive={filtros.includes('Pendente Lançamento')} onClick={()=>onFilter('Pendente Lançamento')}/>
            <KpiCard title="Aguardando Pagto" count={kpis.filter(n=>n.status_pagamento==='Aguardando Pagamento').length} colorHex={CORES.azulCicopal} icon={<Calendar size={100}/>} isActive={filtros.includes('Aguardando Pagamento')} onClick={()=>onFilter('Aguardando Pagamento')}/>
            <KpiCard title="Concluída" count={kpis.filter(n=>n.status_pagamento==='Concluída').length} colorHex="#10B981" icon={<CheckCircle size={100}/>} isActive={filtros.includes('Concluída')} onClick={()=>onFilter('Concluída')}/>
        </div>

        {/* NAVEGAÇÃO MÊS */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <button onClick={() => mudarMes(-1)} className="p-2 hover:bg-slate-100 rounded-full text-[#1E22A8]"><ChevronLeft/></button>
            <div className="text-center">
                <h2 className="text-2xl font-black text-[#1E22A8] uppercase tracking-tight">{mesExibicao}</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Competência Atual</p>
            </div>
            <button onClick={() => mudarMes(1)} className="p-2 hover:bg-slate-100 rounded-full text-[#1E22A8]"><ChevronRight/></button>
        </div>


        {/* LISTA AGRUPADA */}
        <div className="space-y-4">
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
                                        <div className="flex flex-col xl:flex-row justify-between gap-6 mb-4">
                                            {/* DADOS PRINCIPAIS */}
                                            <div className="flex gap-4">
                                                <div className="flex flex-col justify-center">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-2xl font-black text-slate-800">#{n.numero_nota}</span>
                                                        <span className="text-[10px] font-bold bg-[#1E22A8]/10 text-[#1E22A8] px-2 py-1 rounded border border-[#1E22A8]/20 uppercase tracking-wide">{n.filial?.nome_fantasia || 'MATRIZ'}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-4">
                                                        <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200"><span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">CNPJ</span><span className="text-lg font-black text-[#1E22A8]">{n.cnpj_usado || '-'}</span></div>
                                                        <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200"><span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">CONTRATO</span><span className="text-lg font-black text-[#1E22A8]">{n.contrato_usado || '-'}</span></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* VALOR E AÇÕES */}
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Valor Total</p>
                                                    <p className="text-3xl font-black text-[#1E22A8]">R$ {parseFloat(n.valor).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                                                </div>
                                                <div className="flex gap-2 pl-6 border-l-2 border-slate-100 flex-col sm:flex-row">
                                                    <button onClick={()=>onCopiarProtheus(n)} className="h-10 px-4 bg-[#1E22A8] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#E30613] transition-colors shadow-sm" title="Copiar p/ Protheus"><ClipboardList size={16}/> Copiar</button>
                                                    
                                                    {isGopaFunc(n) && n.status_pagamento !== 'Email Enviado p/ Balança' && (
                                                        <button onClick={() => onEnviarEmail(n)} className="h-10 px-4 bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm">
                                                            <Mail size={16}/> Enviar
                                                        </button>
                                                    )}

                                                    <div className="flex gap-1">
                                                        {n.arquivo_nota && (<button onClick={()=>onDownload(n.arquivo_nota)} className="h-10 w-10 bg-red-50 text-[#E30613] border border-red-100 rounded-lg hover:bg-[#E30613] hover:text-white transition-colors flex items-center justify-center" title="Ver Nota"><FileText size={18}/></button>)}
                                                        {n.arquivo_boleto && (<button onClick={()=>onDownload(n.arquivo_boleto)} className="h-10 w-10 bg-blue-50 text-[#1E22A8] border border-blue-100 rounded-lg hover:bg-[#1E22A8] hover:text-white transition-colors flex items-center justify-center" title="Ver Boleto"><Paperclip size={18}/></button>)}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={()=>onEditar(n)} className="h-10 w-10 text-slate-400 hover:text-[#1E22A8] bg-slate-100 rounded-lg transition-colors flex items-center justify-center" title="Editar"><Edit2 size={18}/></button>
                                                        <button onClick={()=>onDuplicar(n)} className="h-10 w-10 text-slate-400 hover:text-[#1E22A8] bg-slate-100 rounded-lg transition-colors flex items-center justify-center" title="Duplicar"><Copy size={18}/></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* RODAPÉ DO CARD (DETALHES) */}
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-y-3 gap-x-6 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div><strong className="block text-[#1E22A8] uppercase text-[10px] font-black mb-1">Vencimento</strong><span className="text-base font-bold text-slate-600">{n.data_vencimento.split('T')[0].split('-').reverse().join('/')}</span></div>
                                            <div><strong className="block text-[#1E22A8] uppercase text-[10px] font-black mb-1">Envio TI</strong><span className="text-base font-bold text-slate-600">{n.data_envio ? n.data_envio.split('T')[0].split('-').reverse().join('/') : '-'}</span></div>
                                            <div><strong className="block text-[#1E22A8] uppercase text-[10px] font-black mb-1">Centro Custo</strong><span className="text-base font-bold text-slate-600">{n.centro_custo_usado || '-'}</span></div>
                                            <div><strong className="block text-[#1E22A8] uppercase text-[10px] font-black mb-1">Fluig</strong><span className="text-base font-bold text-slate-600">{n.solicitacao_fluig || '-'}</span></div>
                                            <div className="relative">
                                                <strong className="block text-[#1E22A8] uppercase text-[10px] font-black mb-1">Status Atual</strong>
                                                <select 
                                                    value={n.status_pagamento || ""} 
                                                    onChange={(e) => onStatusChange(n.id, e.target.value)} 
                                                    className={`w-full appearance-none text-[11px] font-black uppercase py-1.5 px-3 rounded-lg border-2 cursor-pointer outline-none transition-all ${STATUS_STYLES[n.status_pagamento]?.bg} ${STATUS_STYLES[n.status_pagamento]?.border} ${STATUS_STYLES[n.status_pagamento]?.text}`}
                                                >
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
{/* --- NOVO LOCAL DO BOTÃO (AQUI!) --- */}
        <div className="flex justify-end mt-6 pb-4 border-t border-slate-200 pt-6">
            <div className="flex flex-col items-end gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Deseja baixar esses dados?</span>
                <BotaoExportar dados={kpis} />
            </div>
        </div>

    </div>
  );
}
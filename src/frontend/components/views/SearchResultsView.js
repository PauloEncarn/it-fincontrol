import React from 'react';
import { Search, Loader2, Edit2 } from 'lucide-react';
import { STATUS_STYLES } from '@/frontend/utils/constants';

export default function SearchResultsView({ termoBusca, carregando, resultados, onEditar }) {
    
  const getSemaforoClass = (venc, status) => { 
      if (status === 'Concluída') return 'border-emerald-500 bg-emerald-50/10'; 
      const dias = Math.ceil((new Date(venc.split('T')[0]) - new Date().setHours(0,0,0,0))/86400000); 
      if (dias < 0) return 'border-[#E30613] bg-red-50'; 
      return 'border-slate-200 bg-white'; 
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[500px] animate-in slide-in-from-bottom-5">
        <h2 className="text-2xl font-black text-[#1E22A8] mb-6 flex items-center gap-2">
            <Search className="text-[#F9C531]"/> RESULTADOS: &quot;{termoBusca}&quot;
        </h2>
        
        {carregando ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#1E22A8]" size={40}/></div>
        ) : resultados.length === 0 ? (
            <div className="text-center text-slate-400 p-10 font-bold">Nada encontrado.</div>
        ) : (
            <div className="space-y-3">
                {resultados.map(n => (
                    <div key={n.id} className={`bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-all flex flex-col md:flex-row justify-between items-center gap-4 ${getSemaforoClass(n.data_vencimento, n.status_pagamento)}`}>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-black text-[#1E22A8] text-lg">{n.fornecedor?.nome_empresa}</span>
                                <span className="text-[10px] bg-white border px-2 py-0.5 rounded font-bold uppercase">{n.filial?.nome_fantasia}</span>
                            </div>
                            <div className="flex gap-4 text-xs text-slate-500 font-bold uppercase">
                                <span>NF: {n.numero_nota}</span>
                                <span>PEDIDO: {n.numero_pedido || '-'}</span>
                                <span>VENC: {n.data_vencimento.split('T')[0].split('-').reverse().join('/')}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-black text-xl text-[#1E22A8]">R$ {n.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                            <div className={`text-[10px] font-bold uppercase px-2 rounded ${STATUS_STYLES[n.status_pagamento]?.text || 'text-slate-400'}`}>
                                {n.status_pagamento}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => onEditar(n)} className="p-2 bg-white border rounded-lg hover:text-[#1E22A8]"><Edit2 size={18}/></button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
    
  );
}
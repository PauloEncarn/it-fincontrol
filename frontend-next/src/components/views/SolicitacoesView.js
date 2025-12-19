import React, { useEffect } from 'react';
import { ShoppingCart, Plus, Edit2, Building, FileText } from 'lucide-react';
import { STYLES } from '@/utils/constants';

// Função auxiliar para ler nomes (evita erro se vier Array ou Objeto)
const getNomeSeguro = (item, campo) => {
    if (!item) return 'Não inf.';
    // Se for Array (ex: Supabase retornou lista)
    if (Array.isArray(item)) {
        return item.length > 0 ? item[0][campo] : 'Não inf.';
    }
    // Se for Objeto normal
    return item[campo] || 'Não inf.';
};

export default function SolicitacoesView({ 
    solicitacoes, 
    onNovaSolicitacao, 
    onEditarSolicitacao 
}) {
  
  // DEBUG: Mostra no console o que chegou para a gente ver se está vazio ou com erro
  useEffect(() => {
    console.log("👀 VIEW SOLICITAÇÕES RECEBEU:", solicitacoes);
  }, [solicitacoes]);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl animate-in zoom-in-95">
      <div className="flex justify-between mb-6">
        <h2 className="text-3xl font-black text-[#1E22A8] flex gap-3 items-center">
          <div className="bg-[#1E22A8] p-2 rounded-lg text-white"><ShoppingCart/></div> 
          SOLICITAÇÕES DE COMPRA
        </h2>
        <button 
          onClick={onNovaSolicitacao} 
          className="bg-[#1E22A8] text-white px-4 py-2 rounded-xl font-bold flex gap-2 items-center hover:bg-[#E30613] transition-colors shadow-lg"
        >
          <Plus size={18}/> Nova Solicitação
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#1E22A8] text-white">
            <tr>
              <th className="p-4 text-xs font-black uppercase tracking-widest w-[140px]">Status</th>
              <th className="p-4 text-xs font-black uppercase tracking-widest">Nº SC / Pedido</th>
              <th className="p-4 text-xs font-black uppercase tracking-widest">Item / Fornecedor</th>
              <th className="p-4 text-xs font-black uppercase tracking-widest">Solicitante</th>
              <th className="p-4 text-xs font-black uppercase tracking-widest text-right">Valor Est.</th>
              <th className="p-4 text-xs font-black uppercase tracking-widest text-center w-[100px]">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(!solicitacoes || solicitacoes.length === 0) ? (
              <tr>
                <td colSpan="6" className="p-10 text-center text-slate-400 font-bold">
                   Nenhuma solicitação encontrada na lista.
                   <br/>
                   <span className="text-xs font-normal opacity-70">(Se existir no banco, verifique o Console F12)</span>
                </td>
              </tr>
            ) : (
              solicitacoes.map((s, index) => (
                <tr key={s.id || index} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  
                  {/* COLUNA 1: STATUS */}
                  <td className="p-4">
                     <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase border shadow-sm block w-fit text-center
                        ${s.status === 'Pendente' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                          s.status === 'Aprovado' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                          s.status === 'Pedido Realizado' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                          s.status === 'Cancelado' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {s.status || 'Pendente'}
                     </span>
                  </td>

                  {/* COLUNA 2: NUMEROS */}
                  <td className="p-4">
                     <div className="flex flex-col">
                       <span className="font-bold text-[#1E22A8] text-sm">SC: {s.numero_sc || '-'}</span>
                       <span className="text-xs text-slate-400 font-bold">PED: {s.numero_pedido || '-'}</span>
                     </div>
                  </td>

                  {/* COLUNA 3: ITEM E FORNECEDOR */}
                  <td className="p-4">
                     <div className="font-bold text-slate-700">{s.servico || 'Sem descrição'}</div>
                     <div className="text-xs text-slate-500 uppercase flex items-center gap-1">
                        <Building size={10}/> {getNomeSeguro(s.fornecedor, 'nome_empresa')}
                     </div>
                  </td>

                  {/* COLUNA 4: SOLICITANTE */}
                  <td className="p-4 text-sm font-medium text-slate-600">
                     {s.solicitante}
                     <span className="block text-[10px] text-slate-400 font-bold uppercase">
                        {getNomeSeguro(s.filial, 'nome_fantasia')}
                     </span>
                  </td>

                  {/* COLUNA 5: VALOR */}
                  <td className="p-4 text-right font-black text-[#1E22A8]">
                     R$ {parseFloat(s.valor || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </td>

                  {/* COLUNA 6: AÇÕES */}
                  <td className="p-4 text-center">
                     <button 
                       onClick={() => onEditarSolicitacao(s)} 
                       className="p-2 text-slate-400 hover:text-[#1E22A8] hover:bg-white rounded-lg transition-all"
                       title="Editar Solicitação"
                     >
                       <Edit2 size={18}/>
                     </button>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
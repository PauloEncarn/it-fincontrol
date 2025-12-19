import React from 'react';
import { ShoppingCart, Plus, Edit2, Building, FileText } from 'lucide-react';

export default function SolicitacoesView({ 
    solicitacoes, 
    onNovaSolicitacao, 
    onEditarSolicitacao 
}) {
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

      {/* COPIE A TABELA INTEIRA DO SEU CÓDIGO ORIGINAL AQUI */}
      <div className="overflow-hidden rounded-xl border border-slate-200">
         <table className="w-full text-left border-collapse">
            {/* ...thead, tbody, map das solicitacoes... */}
            {/* Onde tinha setFormSolicitacao(s), use onEditarSolicitacao(s) */}
         </table>
      </div>
    </div>
  );
}
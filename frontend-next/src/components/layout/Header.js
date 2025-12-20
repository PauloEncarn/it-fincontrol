import React from 'react';
import { Search, Plus, Download, Menu, Filter } from 'lucide-react'; // Adicionei Menu e Filter
import BotaoExportar from '@/components/ui/BotaoExportar';

export default function Header({ 
    currentView, 
    onOpenMenu, // <--- Recebe a função de abrir o menu
    termoBusca, 
    setTermoBusca, 
    filiais, 
    filialFiltro, 
    setFilialFiltro, 
    onNovoLancamento, 
    dadosExportacao 
}) {

  // Título dinâmico baseado na View
  const getTitulo = () => {
      switch(currentView) {
          case 'dashboard': return 'Dashboard Financeiro';
          case 'solicitacoes': return 'Minhas Solicitações';
          case 'lancamentos': return 'Lançamentos';
          case 'fornecedores': return 'Gestão de Fornecedores';
          case 'filiais': return 'Gestão de Filiais';
          case 'usuarios': return 'Controle de Usuários';
          default: return 'Gestão TI';
      }
  };

  return (
    <div className="bg-white px-8 py-5 flex flex-col gap-6 shadow-sm border-b border-slate-100 sticky top-0 z-30">
        
        {/* LINHA SUPERIOR: Menu + Título + Busca */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            <div className="flex items-center gap-4 w-full md:w-auto">
                {/* BOTÃO DO MENU (Gaveta) */}
                <button 
                    onClick={onOpenMenu}
                    className="p-2 text-[#1E22A8] hover:bg-slate-50 rounded-lg transition-colors"
                >
                    <Menu size={28} />
                </button>

                <div>
                    <h1 className="text-2xl font-black text-[#1E22A8] tracking-tight">{getTitulo()}</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest hidden md:block">
                        Visão Geral do Sistema
                    </p>
                </div>
            </div>

            {/* BARRA DE BUSCA CENTRAL */}
            <div className="relative w-full md:w-96 group">
                <input 
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#1E22A8] focus:ring-4 focus:ring-[#1E22A8]/10 transition-all"
                    placeholder="Pesquisar por nota, fornecedor, valor..."
                />
                <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-[#1E22A8] transition-colors" size={20}/>
            </div>

            {/* BOTÕES DE AÇÃO (Direita) */}
            <div className="flex gap-3 w-full md:w-auto justify-end">
                {currentView === 'dashboard' && (
                    <>
                        <div className="relative">
                            <select 
                                value={filialFiltro}
                                onChange={(e) => setFilialFiltro(e.target.value)}
                                className="appearance-none bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl py-3 pl-10 pr-8 hover:border-[#1E22A8] cursor-pointer outline-none focus:ring-2 focus:ring-[#1E22A8]/20 transition-all h-full"
                            >
                                <option value="">Todas as Filiais</option>
                                {filiais.map(f => <option key={f.id} value={f.id}>{f.nome_fantasia}</option>)}
                            </select>
                            <Filter className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" size={16}/>
                        </div>

                        <BotaoExportar dados={dadosExportacao} />
                        
                        <button 
                            onClick={onNovoLancamento} 
                            className="bg-[#1E22A8] hover:bg-[#E30613] text-white px-6 py-3 rounded-xl font-black text-xs flex gap-2 items-center shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                        >
                            <Plus size={18}/> <span className="hidden md:inline">NOVO LANÇAMENTO</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    </div>
  );
}
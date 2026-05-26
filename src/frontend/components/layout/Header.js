import React from 'react';
import { Search, Plus, Menu, Bell } from 'lucide-react'; 

export default function Header({ 
    currentView, 
    onOpenMenu,
    termoBusca, 
    setTermoBusca, 
    onNovoLancamento,
    onNovaSolicitacao // <--- Nova prop para diferenciar a ação
}) {

  const getInfos = () => {
      switch(currentView) {
          case 'dashboard': return { titulo: 'Dashboard Gerencial', sub: 'Visão Consolidada' };
          case 'notas': return { titulo: 'Notas Fiscais', sub: 'Gestão Operacional' };
          case 'solicitacoes': return { titulo: 'Solicitações de Compra', sub: 'Acompanhamento de Pedidos' };
          case 'lancamentos': return { titulo: 'Lançamentos', sub: 'Histórico' };
          case 'fornecedores': return { titulo: 'Fornecedores', sub: 'Base de Cadastro' };
          case 'filiais': return { titulo: 'Filiais', sub: 'Unidades' };
          case 'usuarios': return { titulo: 'Usuários', sub: 'Controle de Acesso' };
          default: return { titulo: 'Gestão TI', sub: 'Sistema Interno' };
      }
  };

  const info = getInfos();

  // Define quais controles mostrar
  const showSearch = currentView === 'notas' || currentView === 'solicitacoes';
  
  // Define a ação do botão "Novo"
  const getAction = () => {
      if (currentView === 'notas') return { label: 'LANÇAMENTO', action: onNovoLancamento };
      if (currentView === 'solicitacoes') return { label: 'SOLICITAÇÃO', action: onNovaSolicitacao };
      return null;
  };

  const actionButton = getAction();

  return (
    <div className="bg-[#1E22A8] px-8 py-5 flex flex-col gap-6 shadow-md border-b border-[#151875] sticky top-0 z-40 text-white">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* LADO ESQUERDO: Menu e Título */}
            <div className="flex items-center gap-4 w-full md:w-auto">
                <button 
                    onClick={onOpenMenu}
                    className="p-2 text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                >
                    <Menu size={28} />
                </button>

                <div>
                    <h1 className="text-2xl font-black tracking-tight">{info.titulo}</h1>
                    <p className="text-xs text-blue-200 font-bold uppercase tracking-widest hidden md:block">
                        {info.sub}
                    </p>
                </div>
            </div>

            {/* LADO DIREITO: Controles */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                
                {showSearch && (
                    <div className="relative w-full md:w-80 group">
                        <input 
                            value={termoBusca}
                            onChange={(e) => setTermoBusca(e.target.value)}
                            className="w-full bg-[#151875]/50 border border-blue-400/30 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-white placeholder-blue-300/50 outline-none focus:border-white/50 focus:bg-[#151875] transition-all"
                            placeholder="Pesquisar..."
                        />
                        <Search className="absolute left-3 top-3 text-blue-300 group-focus-within:text-white transition-colors" size={18}/>
                    </div>
                )}

                {actionButton && (
                    <button 
                        onClick={actionButton.action} 
                        className="bg-white hover:bg-slate-100 text-[#1E22A8] px-5 py-2.5 rounded-xl font-black text-xs flex gap-2 items-center shadow-lg shadow-black/10 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={18}/> 
                        <span className="hidden md:inline">NOVA {actionButton.label}</span>
                    </button>
                )}
                
                {/* Avatar / Notificação (Decorativo) */}
                <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                    <Bell size={20} className="text-white"/>
                </div>
            </div>
        </div>
    </div>
  );
}
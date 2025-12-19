import React from 'react';
import Image from 'next/image';
import { Menu, Search, X, ChevronDown, Plus } from 'lucide-react';


export default function Header({ 
    currentView, 
    onOpenMenu, 
    termoBusca, 
    setTermoBusca, 
    filiais, 
    filialFiltro, 
    setFilialFiltro, 
    onNovoLancamento,
    dadosExportacao // Dados para o botão exportar
}) {
  return (
    <header className="bg-[#1E22A8] px-6 py-4 sticky top-0 z-40 flex justify-between items-center shadow-xl shadow-[#1E22A8]/20 gap-4">
        <div className="flex items-center gap-4">
            <button onClick={onOpenMenu} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"><Menu size={24}/></button>
            <div className="text-white flex items-center gap-3 hidden md:flex">
                <Image src="/logo-cicopal.png" alt="Cicopal" width={40} height={40} className="h-10 w-auto object-contain bg-white/10 rounded p-1" />
                <div><h1 className="text-xl font-black tracking-tight leading-none">CICOPAL <span className="font-light opacity-80">GESTÃO DE NOTAS</span></h1></div>
            </div>
        </div>

        {currentView === 'dashboard' && (
            <div className="flex-1 max-w-2xl mx-4 relative">
                <input className="w-full bg-black/20 border border-white/10 text-white placeholder:text-white/60 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:bg-black/40 font-bold" placeholder="Buscar..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} />
                <Search className="absolute left-3 top-3 text-white/60" size={18} />
                {termoBusca && (<button onClick={() => setTermoBusca('')} className="absolute right-3 top-3 text-white/60 hover:text-white"><X size={18}/></button>)}
            </div>
        )}
        
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

                    <button onClick={onNovoLancamento} className="bg-[#E30613] text-white hover:bg-white hover:text-[#E30613] px-5 py-2 rounded-lg font-black text-sm flex gap-2 items-center shadow-lg active:scale-95 whitespace-nowrap transition-colors">
                        <Plus size={18}/> <span className="hidden md:inline">LANÇAR NOTA</span>
                    </button>
                </>
            )}
        </div>
    </header>
  );
}
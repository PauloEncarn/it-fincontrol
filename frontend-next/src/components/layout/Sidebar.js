import React from 'react';
import Image from 'next/image';
import { LayoutDashboard, ShoppingCart, Users, Building, FileText, User, LogOut, X } from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, onLogout, isOpen, onClose }) {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'solicitacoes', label: 'Solicitações', icon: <ShoppingCart size={20} /> },
    { id: 'lancamentos', label: 'Lançamentos', icon: <FileText size={20} /> },
    { id: 'fornecedores', label: 'Fornecedores', icon: <Users size={20} /> },
    { id: 'filiais', label: 'Filiais', icon: <Building size={20} /> },
    { id: 'usuarios', label: 'Usuários', icon: <User size={20} /> },
  ];

  return (
    <>
      {/* 1. OVERLAY (Fundo Escuro/Desfocado) */}
      {/* Só aparece se isOpen for true */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose} // Fecha se clicar no fundo
      />

      {/* 2. A GAVETA (Sidebar) */}
      <aside className={`
          fixed top-0 left-0 z-50 h-screen w-72 bg-white shadow-2xl flex flex-col justify-between
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* TOPO */}
        <div className="p-6 flex justify-between items-center">
            <div className="w-32">
                <Image src="/logo-cicopal.png" alt="Cicopal" width={120} height={40} className="w-full h-auto object-contain" />
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* MENU */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Navegação</p>
          
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { 
                  setActiveView(item.id); 
                  onClose(); // <--- O PULO DO GATO: Fecha ao clicar!
              }}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 group font-bold text-sm
                ${activeView === item.id 
                  ? 'bg-[#1E22A8] text-white shadow-lg shadow-blue-900/20 translate-x-1' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#1E22A8]'
                }`}
            >
              <div className={`${activeView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-[#1E22A8]'}`}>
                {item.icon}
              </div>
              {item.label}
            </button>
          ))}
        </nav>

        {/* RODAPÉ */}
        <div className="p-4 border-t border-slate-100">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-colors text-sm">
            <LogOut size={18} /> SAIR
          </button>
        </div>
      </aside>
    </>
  );
}
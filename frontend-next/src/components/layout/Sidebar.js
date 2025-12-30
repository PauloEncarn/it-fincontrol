import React from 'react';
import { LayoutDashboard, ShoppingCart, Receipt, Users, Building, FileText, User, LogOut, X } from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, onLogout, isOpen, onClose }) {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={24} /> }, // Aumentei ícones para 24 também
    { id: 'notas', label: 'Notas Fiscais', icon: <Receipt size={24} /> },
    { id: 'solicitacoes', label: 'Solicitações', icon: <ShoppingCart size={24} /> },
    { id: 'fornecedores', label: 'Fornecedores', icon: <Users size={24} /> },
    { id: 'filiais', label: 'Filiais', icon: <Building size={24} /> },
    { id: 'usuarios', label: 'Usuários', icon: <User size={24} /> },
  ];

  return (
    <>
      {/* OVERLAY (Fundo Escuro) */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* GAVETA LATERAL */}
      <aside className={`
          fixed top-0 left-0 z-50 h-screen w-72 bg-white shadow-2xl flex flex-col justify-between
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* TOPO: Texto MENU e Botão Fechar */}
        <div className="p-6 flex justify-between items-center border-b border-slate-100">
            {/* Título MENU substituindo a Logo */}
            <h2 className="text-2xl font-black text-[#1E22A8] tracking-tighter">
                MENU
            </h2>

            <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
            >
                <X size={28} />
            </button>
        </div>

        {/* LISTA DE NAVEGAÇÃO */}
        <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto custom-scrollbar">
          
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { 
                  setActiveView(item.id); 
                  onClose(); 
              }}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 group font-bold text-base
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
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-4 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-colors text-base">
            <LogOut size={20} /> SAIR
          </button>
        </div>
      </aside>
    </>
  );
}
import React from 'react';
import Image from 'next/image';
import { LayoutDashboard, ShoppingCart, Users, Building, FileText, User, LogOut } from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, onLogout }) {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'solicitacoes', label: 'Solicitações', icon: <ShoppingCart size={20} /> },
    { id: 'lancamentos', label: 'Lançamentos', icon: <FileText size={20} /> },
    { id: 'fornecedores', label: 'Fornecedores', icon: <Users size={20} /> },
    { id: 'filiais', label: 'Filiais', icon: <Building size={20} /> },
    { id: 'usuarios', label: 'Usuários', icon: <User size={20} /> },
  ];

  return (
    <aside className="w-72 bg-white h-screen shadow-2xl flex flex-col justify-between sticky top-0 z-50">
        
        {/* TOPO: Logo */}
        <div className="p-8 pb-4 flex justify-center">
            <Image 
                src="/logo-cicopal.png" 
                alt="Cicopal" 
                width={160} 
                height={60} 
                className="h-12 w-auto object-contain"
                priority
            />
        </div>

        {/* MENU */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Menu Principal</p>
          
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
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

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-colors text-sm"
          >
            <LogOut size={18} />
            SAIR DO SISTEMA
          </button>
          <p className="text-center text-[10px] text-slate-300 mt-4 font-medium">v1.0.0 • TI Cicopal</p>
        </div>
    </aside>
  );
}
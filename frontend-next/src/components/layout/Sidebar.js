import React from 'react';
import { X, Server, ShoppingCart, Building, Users, UserPlus, LogOut } from 'lucide-react';

export default function Sidebar({ isOpen, onClose, currentView, onChangeView, onLogout }) {
  const menuClass = (view) => `w-full flex items-center gap-4 font-bold p-4 rounded-xl hover:bg-slate-50 ${currentView === view ? 'text-[#1E22A8] bg-blue-50' : 'text-slate-600'}`;

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-[#1E22A8]/80 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}></div>
        <div className={`absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-6 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex justify-between items-center mb-10 text-[#1E22A8]">
                <h2 className="text-2xl font-black tracking-tighter">MENU</h2>
                <button onClick={onClose} className="hover:bg-slate-100 p-2 rounded-full"><X size={24}/></button>
            </div>
            <nav className="space-y-2 flex-1">
                <button onClick={() => { onChangeView('dashboard'); onClose(); }} className={menuClass('dashboard')}><Server size={20}/> DASHBOARD</button>
                <button onClick={() => { onChangeView('solicitacoes'); onClose(); }} className={menuClass('solicitacoes')}><ShoppingCart size={20}/> SOLICITAÇÕES</button>
                <button onClick={() => { onChangeView('filiais'); onClose(); }} className={menuClass('filiais')}><Building size={20}/> FILIAIS</button>
                <button onClick={() => { onChangeView('fornecedores'); onClose(); }} className={menuClass('fornecedores')}><Users size={20}/> FORNECEDORES</button>
                <button onClick={() => { onChangeView('usuarios'); onClose(); }} className={menuClass('usuarios')}><UserPlus size={20}/> USUÁRIOS</button>
            </nav>
            <button onClick={onLogout} className="w-full flex items-center gap-4 text-[#E30613] font-bold p-4 rounded-xl hover:bg-red-50 mt-auto"><LogOut size={20}/> SAIR</button>
        </div>
    </div>
  );
}
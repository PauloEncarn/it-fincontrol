import React, { useState } from 'react';
import { UserPlus, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import { STYLES } from '@/utils/constants';
import axios from 'axios';

// Adicionei 'onToggleStatus' nas props
export default function UsuariosView({ usuarios, onCriarUsuario, onToggleStatus }) {
  const [formUser, setFormUser] = useState({ username: '', password: '', nome_completo: '', setor: '', cargo: '' });
  
  const handleCriar = () => {
      onCriarUsuario(formUser);
      setFormUser({ username: '', password: '', nome_completo: '', setor: '', cargo: '' });
  };
  
  const BTN_STYLE = "bg-[#1E22A8] hover:bg-[#E30613] text-white font-black px-6 py-3 rounded-xl shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider text-sm";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in zoom-in-95">
        
        {/* FORMULÁRIO DE NOVO USUÁRIO */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-8 shadow-xl h-fit">
            <h3 className="text-xl font-black text-[#1E22A8] mb-4 flex gap-2 items-center"><UserPlus/> NOVO USUÁRIO</h3>
            <div className="space-y-4">
                <div><label className={STYLES.label}>Nome</label><input className={STYLES.input} value={formUser.nome_completo || ""} onChange={e=>setFormUser({...formUser, nome_completo:e.target.value})}/></div>
                <div><label className={STYLES.label}>Login</label><input className={STYLES.input} value={formUser.username || ""} onChange={e=>setFormUser({...formUser, username:e.target.value})}/></div>
                <div><label className={STYLES.label}>Senha</label><input type="password" className={STYLES.input} value={formUser.password || ""} onChange={e=>setFormUser({...formUser, password:e.target.value})}/></div>
                <button onClick={handleCriar} className={`w-full ${BTN_STYLE} mt-4`}>CADASTRAR E ATIVAR</button>
            </div>
        </div>

        {/* LISTA DE USUÁRIOS */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-black text-[#1E22A8] mb-6">GERENCIAR ACESSOS</h3>
            
            <div className="space-y-4">
                {usuarios.map(u => (
                    <div key={u.id} className={`flex flex-col md:flex-row items-center justify-between p-4 border rounded-xl transition-all ${u.ativo ? 'bg-slate-50 border-slate-100' : 'bg-amber-50 border-amber-200'}`}>
                        
                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg text-white ${u.ativo ? 'bg-[#1E22A8]' : 'bg-amber-400'}`}>
                                {u.nome_completo.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-[#1E22A8] flex items-center gap-2">
                                    {u.nome_completo}
                                    {!u.ativo && <span className="text-[10px] bg-amber-200 text-amber-800 px-2 rounded-full flex gap-1 items-center"><ShieldAlert size={10}/> PENDENTE</span>}
                                </p>
                                <p className="text-xs text-slate-400 font-bold uppercase">{u.cargo || 'S/ Cargo'} • {u.setor || 'S/ Setor'} • {u.username}</p>
                            </div>
                        </div>

                        {/* BOTÃO DE AÇÃO */}
                        {u.ativo ? (
                            <button 
                                onClick={() => onToggleStatus(u.id, false)}
                                className="px-4 py-2 rounded-lg text-xs font-black bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-600 transition-colors flex items-center gap-2 group"
                                title="Clique para bloquear"
                            >
                                <CheckCircle size={16} className="group-hover:hidden"/> 
                                <XCircle size={16} className="hidden group-hover:block"/>
                                <span className="group-hover:hidden">ATIVO</span>
                                <span className="hidden group-hover:inline">BLOQUEAR</span>
                            </button>
                        ) : (
                            <button 
                                onClick={() => onToggleStatus(u.id, true)}
                                className="px-6 py-2 rounded-lg text-xs font-black bg-amber-400 text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-amber-200 flex items-center gap-2 animate-pulse hover:animate-none"
                            >
                                <CheckCircle size={16}/> APROVAR ACESSO
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
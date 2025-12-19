import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { STYLES } from '@/utils/constants';

export default function UsuariosView({ usuarios, onCriarUsuario }) {
  const [formUser, setFormUser] = useState({ username: '', password: '', nome_completo: '', setor: '', cargo: '' });
  
  const handleCriar = () => {
      onCriarUsuario(formUser);
      setFormUser({ username: '', password: '', nome_completo: '', setor: '', cargo: '' }); // Limpa form
  };
  
  const BTN_STYLE = "bg-[#1E22A8] hover:bg-[#E30613] text-white font-black px-6 py-3 rounded-xl shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider text-sm";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in zoom-in-95">
        <div className="lg:col-span-1 bg-white rounded-3xl p-8 shadow-xl h-fit">
            <h3 className="text-xl font-black text-[#1E22A8] mb-4 flex gap-2 items-center"><UserPlus/> NOVO USUÁRIO</h3>
            <div className="space-y-4">
                <div><label className={STYLES.label}>Nome</label><input className={STYLES.input} value={formUser.nome_completo || ""} onChange={e=>setFormUser({...formUser, nome_completo:e.target.value})}/></div>
                <div><label className={STYLES.label}>Login</label><input className={STYLES.input} value={formUser.username || ""} onChange={e=>setFormUser({...formUser, username:e.target.value})}/></div>
                <div><label className={STYLES.label}>Senha</label><input type="password" className={STYLES.input} value={formUser.password || ""} onChange={e=>setFormUser({...formUser, password:e.target.value})}/></div>
                <button onClick={handleCriar} className={`w-full ${BTN_STYLE} mt-4`}>CADASTRAR</button>
            </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-black text-[#1E22A8] mb-6">USUÁRIOS ATIVOS</h3>
            <div className="space-y-4">
                {usuarios.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="bg-[#1E22A8] text-white h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg">{u.nome_completo.charAt(0)}</div>
                            <div>
                                <p className="font-bold text-[#1E22A8]">{u.nome_completo}</p>
                                <p className="text-xs text-slate-400 font-bold uppercase">{u.cargo} • {u.setor}</p>
                            </div>
                        </div>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">ATIVO</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
import React, { useState } from 'react';
import { UserPlus, Trash2, ShieldCheck, ShieldAlert, X, Check, Search, User } from 'lucide-react';
import { STYLES } from '@/frontend/utils/constants';

export default function UsuariosView({ usuarios, onCriarUsuario, onToggleStatus, onExcluirUsuario }) {
  const [showModal, setShowModal] = useState(false);
  const [termo, setTermo] = useState('');
  const [formUser, setFormUser] = useState({ username: '', password: '', nome_completo: '', setor: '', cargo: '' });

  // Filtro local da tabela
  const usuariosFiltrados = usuarios.filter(u => 
      u.nome_completo.toLowerCase().includes(termo.toLowerCase()) ||
      u.username.toLowerCase().includes(termo.toLowerCase())
  );

  const handleCriar = () => {
      if(!formUser.username || !formUser.password || !formUser.nome_completo) return alert('Preencha os campos obrigatórios');
      onCriarUsuario(formUser);
      setFormUser({ username: '', password: '', nome_completo: '', setor: '', cargo: '' });
      setShowModal(false);
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl animate-in zoom-in-95 min-h-[600px]">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h2 className="text-3xl font-black text-[#1E22A8] flex gap-3 items-center">
                    <div className="bg-[#1E22A8] p-2 rounded-lg text-white"><User/></div> 
                    GESTÃO DE USUÁRIOS
                </h2>
                <p className="text-slate-400 text-sm font-medium mt-1 ml-1">Gerencie acessos e permissões do sistema</p>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <input 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm font-bold outline-none focus:border-[#1E22A8]"
                        placeholder="Buscar usuário..."
                        value={termo}
                        onChange={e => setTermo(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                </div>
                <button 
                    onClick={() => setShowModal(true)} 
                    className="bg-[#1E22A8] hover:bg-[#E30613] text-white px-4 py-2 rounded-xl font-black text-sm flex gap-2 items-center shadow-lg transition-all"
                >
                    <UserPlus size={18}/> <span className="hidden md:inline">NOVO USUÁRIO</span>
                </button>
            </div>
        </div>

        {/* TABELA PROFISSIONAL */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                        <th className="p-4 text-xs font-black uppercase tracking-widest w-[100px]">Status</th>
                        <th className="p-4 text-xs font-black uppercase tracking-widest">Usuário</th>
                        <th className="p-4 text-xs font-black uppercase tracking-widest">Login</th>
                        <th className="p-4 text-xs font-black uppercase tracking-widest">Setor / Cargo</th>
                        <th className="p-4 text-xs font-black uppercase tracking-widest text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {usuariosFiltrados.map(u => (
                        <tr key={u.id} className="hover:bg-blue-50/50 transition-colors group">
                            <td className="p-4">
                                {u.ativo ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                                        <ShieldCheck size={12}/> Ativo
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 border border-amber-200">
                                        <ShieldAlert size={12}/> Pendente
                                    </span>
                                )}
                            </td>
                            <td className="p-4 font-bold text-[#1E22A8]">
                                {u.nome_completo}
                            </td>
                            <td className="p-4 text-sm text-slate-600 font-medium">
                                {u.username}
                            </td>
                            <td className="p-4 text-sm text-slate-500">
                                {u.setor || '-'} <span className="text-slate-300">|</span> {u.cargo || '-'}
                            </td>
                            <td className="p-4 flex justify-end gap-2">
                                <button 
                                    onClick={() => onToggleStatus(u.id, !u.ativo)}
                                    className={`p-2 rounded-lg transition-colors border ${u.ativo ? 'text-amber-500 border-amber-200 hover:bg-amber-50' : 'text-emerald-500 border-emerald-200 hover:bg-emerald-50'}`}
                                    title={u.ativo ? "Bloquear Acesso" : "Aprovar Acesso"}
                                >
                                    {u.ativo ? <X size={16}/> : <Check size={16}/>}
                                </button>
                                <button 
                                    onClick={() => onExcluirUsuario(u)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors"
                                    title="Excluir Usuário"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </td>
                        </tr>
                    ))}
                    {usuariosFiltrados.length === 0 && (
                        <tr>
                            <td colSpan="5" className="p-10 text-center text-slate-400 font-bold">Nenhum usuário encontrado.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* MODAL INTERNO DE CADASTRO */}
        {showModal && (
            <div className="fixed inset-0 bg-[#1E22A8]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-[#1E22A8]">NOVO USUÁRIO</h3>
                        <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500"><X/></button>
                    </div>
                    <div className="space-y-4">
                        <div><label className={STYLES.label}>Nome Completo *</label><input className={STYLES.input} value={formUser.nome_completo} onChange={e=>setFormUser({...formUser, nome_completo:e.target.value})}/></div>
                        <div><label className={STYLES.label}>Usuário (Login) *</label><input className={STYLES.input} value={formUser.username} onChange={e=>setFormUser({...formUser, username:e.target.value})}/></div>
                        <div><label className={STYLES.label}>Senha *</label><input type="password" className={STYLES.input} value={formUser.password} onChange={e=>setFormUser({...formUser, password:e.target.value})}/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={STYLES.label}>Setor</label><input className={STYLES.input} value={formUser.setor} onChange={e=>setFormUser({...formUser, setor:e.target.value})}/></div>
                            <div><label className={STYLES.label}>Cargo</label><input className={STYLES.input} value={formUser.cargo} onChange={e=>setFormUser({...formUser, cargo:e.target.value})}/></div>
                        </div>
                        <button onClick={handleCriar} className="w-full bg-[#1E22A8] text-white font-black py-3 rounded-xl hover:bg-[#E30613] transition-colors mt-4">SALVAR</button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
}
import React, { useState } from 'react';
import { Building, Plus, Edit2, Trash2, Search, X, CheckCircle } from 'lucide-react';
import { STYLES } from '@/utils/constants';

export default function FiliaisView({ filiais, onSalvar, onExcluir }) {
  const [showModal, setShowModal] = useState(false);
  const [termo, setTermo] = useState('');
  const [form, setForm] = useState({ id: null, codigo: '', nome_fantasia: '' });

  // Filtro local
  const dadosFiltrados = filiais.filter(f => 
      f.nome_fantasia.toLowerCase().includes(termo.toLowerCase()) ||
      f.codigo.toLowerCase().includes(termo.toLowerCase())
  );

  const abrirNovo = () => {
      setForm({ id: null, codigo: '', nome_fantasia: '' });
      setShowModal(true);
  };

  const abrirEdicao = (item) => {
      setForm({ ...item });
      setShowModal(true);
  };

  const handleSalvar = () => {
      if (!form.codigo || !form.nome_fantasia) return alert("Preencha todos os campos");
      onSalvar(form);
      setShowModal(false);
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl animate-in zoom-in-95 min-h-[600px]">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-black text-[#1E22A8] flex gap-3 items-center">
                <div className="bg-[#1E22A8] p-2 rounded-lg text-white"><Building/></div> FILIAIS
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1 ml-1">Gerencie as unidades da empresa</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm font-bold outline-none focus:border-[#1E22A8]"
                    placeholder="Buscar filial..."
                    value={termo}
                    onChange={e => setTermo(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
            </div>
            <button onClick={abrirNovo} className="bg-[#1E22A8] hover:bg-[#E30613] text-white px-4 py-2 rounded-xl font-black text-sm flex gap-2 items-center shadow-lg transition-all">
                <Plus size={18}/> <span className="hidden md:inline">NOVA FILIAL</span>
            </button>
        </div>
      </div>

      {/* TABELA */}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                    <th className="p-4 text-xs font-black uppercase tracking-widest w-[100px]">Código</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest">Nome Fantasia</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {dadosFiltrados.map(f => (
                    <tr key={f.id} className="hover:bg-blue-50/50 transition-colors group">
                        <td className="p-4 font-bold text-slate-400">{f.codigo}</td>
                        <td className="p-4 font-bold text-[#1E22A8] text-lg">{f.nome_fantasia}</td>
                        <td className="p-4 flex justify-end gap-2">
                            <button onClick={() => abrirEdicao(f)} className="p-2 text-slate-400 hover:text-[#1E22A8] hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"><Edit2 size={18}/></button>
                            <button onClick={() => onExcluir(f)} className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all"><Trash2 size={18}/></button>
                        </td>
                    </tr>
                ))}
                {dadosFiltrados.length === 0 && (
                    <tr><td colSpan="3" className="p-10 text-center text-slate-400 font-bold">Nenhuma filial encontrada.</td></tr>
                )}
            </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1E22A8]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-[#1E22A8]">{form.id ? 'EDITAR FILIAL' : 'NOVA FILIAL'}</h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500"><X/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className={STYLES.label}>Código (Prefixo)</label>
                        <input className={STYLES.input} value={form.codigo} onChange={e=>setForm({...form, codigo:e.target.value})} placeholder="Ex: 01, MTR..." autoFocus/>
                    </div>
                    <div>
                        <label className={STYLES.label}>Nome Fantasia</label>
                        <input className={STYLES.input} value={form.nome_fantasia} onChange={e=>setForm({...form, nome_fantasia:e.target.value})} placeholder="Ex: Matriz, Goiânia..."/>
                    </div>
                    
                    <div className="pt-4 flex gap-3">
                        <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-colors">CANCELAR</button>
                        <button onClick={handleSalvar} className="flex-1 bg-[#1E22A8] text-white font-black py-3 rounded-xl hover:bg-[#E30613] transition-colors shadow-lg flex items-center justify-center gap-2">
                            <CheckCircle size={18}/> SALVAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
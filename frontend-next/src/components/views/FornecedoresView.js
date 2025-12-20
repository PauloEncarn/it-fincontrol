import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Search, X, CheckCircle, FileText } from 'lucide-react';
import { STYLES } from '@/utils/constants';

export default function FornecedoresView({ fornecedores, onSalvar, onExcluir }) {
  const [showModal, setShowModal] = useState(false);
  const [termo, setTermo] = useState('');
  const [form, setForm] = useState({ 
      id: null, nome_empresa: '', lista_cnpjs: '', lista_contratos: '', lista_centro_custos: '', padrao_descricao_servico: '', padrao_servico_protheus: '' 
  });

  const dadosFiltrados = fornecedores.filter(f => 
      f.nome_empresa.toLowerCase().includes(termo.toLowerCase())
  );

  const abrirNovo = () => {
      setForm({ id: null, nome_empresa: '', lista_cnpjs: '', lista_contratos: '', lista_centro_custos: '', padrao_descricao_servico: '', padrao_servico_protheus: '' });
      setShowModal(true);
  };

  const abrirEdicao = (item) => {
      setForm({ ...item });
      setShowModal(true);
  };

  const handleSalvar = () => {
      if (!form.nome_empresa) return alert("O nome da empresa é obrigatório");
      onSalvar(form);
      setShowModal(false);
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl animate-in zoom-in-95 min-h-[600px]">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-black text-[#1E22A8] flex gap-3 items-center">
                <div className="bg-[#1E22A8] p-2 rounded-lg text-white"><Users/></div> FORNECEDORES
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1 ml-1">Gerencie os parceiros e contratos</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm font-bold outline-none focus:border-[#1E22A8]"
                    placeholder="Buscar fornecedor..."
                    value={termo}
                    onChange={e => setTermo(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
            </div>
            <button onClick={abrirNovo} className="bg-[#1E22A8] hover:bg-[#E30613] text-white px-4 py-2 rounded-xl font-black text-sm flex gap-2 items-center shadow-lg transition-all">
                <Plus size={18}/> <span className="hidden md:inline">NOVO</span>
            </button>
        </div>
      </div>

      {/* TABELA */}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                    <th className="p-4 text-xs font-black uppercase tracking-widest w-[30%]">Nome Empresa</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest w-[25%]">Contratos</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest w-[25%]">Centros de Custo</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-right w-[20%]">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {dadosFiltrados.map(f => (
                    <tr key={f.id} className="hover:bg-blue-50/50 transition-colors group">
                        <td className="p-4">
                            <div className="font-bold text-[#1E22A8] truncate" title={f.nome_empresa}>{f.nome_empresa}</div>
                            <div className="text-xs text-slate-400 truncate" title={f.lista_cnpjs}>{f.lista_cnpjs || 'Sem CNPJ'}</div>
                        </td>
                        <td className="p-4 text-sm text-slate-600 truncate" title={f.lista_contratos}>
                            {f.lista_contratos ? (
                                <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold border border-slate-200">{f.lista_contratos}</span>
                            ) : '-'}
                        </td>
                        <td className="p-4 text-sm text-slate-600 truncate" title={f.lista_centro_custos}>
                             {f.lista_centro_custos || '-'}
                        </td>
                        <td className="p-4 flex justify-end gap-2">
                            <button onClick={() => abrirEdicao(f)} className="p-2 text-slate-400 hover:text-[#1E22A8] hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"><Edit2 size={18}/></button>
                            <button onClick={() => onExcluir(f)} className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all"><Trash2 size={18}/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1E22A8]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-[#1E22A8]">{form.id ? 'EDITAR FORNECEDOR' : 'NOVO FORNECEDOR'}</h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500"><X/></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className={STYLES.label}>Nome da Empresa *</label>
                        <input className={STYLES.input} value={form.nome_empresa} onChange={e=>setForm({...form, nome_empresa:e.target.value})} autoFocus/>
                    </div>
                    
                    <div className="col-span-2 h-[1px] bg-slate-100 my-2"></div>
                    
                    <div>
                        <label className={STYLES.label}>Lista de CNPJs</label>
                        <textarea className={`${STYLES.input} h-20 text-xs`} value={form.lista_cnpjs || ''} onChange={e=>setForm({...form, lista_cnpjs:e.target.value})} placeholder="Separe por ponto e vírgula (;)" />
                        <p className="text-[10px] text-slate-400 mt-1">Ex: 00.000.000/0001-00; 11.111...</p>
                    </div>

                    <div>
                        <label className={STYLES.label}>Lista de Contratos</label>
                        <textarea className={`${STYLES.input} h-20 text-xs`} value={form.lista_contratos || ''} onChange={e=>setForm({...form, lista_contratos:e.target.value})} placeholder="Separe por ponto e vírgula (;)" />
                    </div>

                    <div className="col-span-2">
                        <label className={STYLES.label}>Lista de Centros de Custo</label>
                        <input className={STYLES.input} value={form.lista_centro_custos || ''} onChange={e=>setForm({...form, lista_centro_custos:e.target.value})} placeholder="Ex: 102030; 405060..." />
                    </div>

                    <div className="col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100 mt-2">
                        <div className="flex items-center gap-2 mb-2 text-[#1E22A8] font-bold text-xs uppercase"><FileText size={14}/> Preenchimento Automático</div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className={STYLES.label}>Descrição Padrão</label>
                                <input className={`${STYLES.input} !bg-white`} value={form.padrao_descricao_servico || ''} onChange={e=>setForm({...form, padrao_descricao_servico:e.target.value})} />
                             </div>
                             <div>
                                <label className={STYLES.label}>Serviço Protheus</label>
                                <input className={`${STYLES.input} !bg-white`} value={form.padrao_servico_protheus || ''} onChange={e=>setForm({...form, padrao_servico_protheus:e.target.value})} />
                             </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex gap-3">
                    <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-colors">CANCELAR</button>
                    <button onClick={handleSalvar} className="flex-1 bg-[#1E22A8] text-white font-black py-3 rounded-xl hover:bg-[#E30613] transition-colors shadow-lg flex items-center justify-center gap-2">
                        <CheckCircle size={18}/> SALVAR
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
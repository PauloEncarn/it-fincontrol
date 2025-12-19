import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { STYLES } from '@/utils/constants';

export default function FornecedoresView({ fornecedores, onSalvar, onExcluir }) {
  const [editingFornecedor, setEditingFornecedor] = useState(null);

  const handleSave = () => {
    onSalvar(editingFornecedor);
    setEditingFornecedor(null);
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl animate-in zoom-in-95">
      <div className="flex justify-between mb-6">
        <h2 className="text-3xl font-black text-[#1E22A8] flex gap-3 items-center">
            <div className="bg-[#1E22A8] p-2 rounded-lg text-white"><Users/></div> FORNECEDORES
        </h2>
        <button onClick={()=>setEditingFornecedor({nome_empresa:'', lista_cnpjs:'', lista_contratos:'', lista_centro_custos:'', padrao_descricao_servico:'', padrao_servico_protheus:''})} className="bg-[#1E22A8] text-white px-4 py-2 rounded-xl font-bold flex gap-2"><Plus size={18}/> Nova</button>
      </div>

      {editingFornecedor && (
        <div className="bg-slate-50 p-6 rounded-xl mb-6 border border-blue-200 grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className={STYLES.label}>Nome</label><input className={STYLES.input} value={editingFornecedor.nome_empresa || ""} onChange={e=>setEditingFornecedor({...editingFornecedor, nome_empresa:e.target.value})}/></div>
            <div><label className={STYLES.label}>CNPJs</label><input className={STYLES.input} value={editingFornecedor.lista_cnpjs || ""} onChange={e=>setEditingFornecedor({...editingFornecedor, lista_cnpjs:e.target.value})}/></div>
            <div><label className={STYLES.label}>Contratos</label><input className={STYLES.input} value={editingFornecedor.lista_contratos || ""} onChange={e=>setEditingFornecedor({...editingFornecedor, lista_contratos:e.target.value})}/></div>
            <div className="col-span-2 flex gap-2">
                <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold">Salvar</button>
                <button onClick={()=>setEditingFornecedor(null)} className="bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold">Cancelar</button>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {fornecedores.map(f => (
            <div key={f.id} className="p-5 border-2 border-slate-100 rounded-xl hover:border-[#1E22A8] transition-colors group flex justify-between items-start">
                <div className="flex-1">
                    <h3 className="font-black text-lg text-[#1E22A8] mb-2">{f.nome_empresa}</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                        <div><strong className="block uppercase text-slate-400">Contratos</strong>{f.lista_contratos}</div>
                        <div><strong className="block uppercase text-slate-400">Centro de Custo</strong>{f.lista_centro_custos}</div>
                    </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                    <button onClick={()=>setEditingFornecedor(f)} className="p-2 text-[#1E22A8] hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button>
                    <button onClick={() => onExcluir(f)} className="p-2 text-[#E30613] hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                </div>
            </div>
        ))}
      </div>
    </div>
    
  );
}
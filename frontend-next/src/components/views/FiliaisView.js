import React, { useState } from 'react';
import { Building, Plus, Edit2, Trash2 } from 'lucide-react';
import { STYLES } from '@/utils/constants';

export default function FiliaisView({ filiais, onSalvar, onExcluir }) {
  const [editingFilial, setEditingFilial] = useState(null);

  const handleSave = () => {
    onSalvar(editingFilial);
    setEditingFilial(null);
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl animate-in zoom-in-95">
      <div className="flex justify-between mb-6">
        <h2 className="text-3xl font-black text-[#1E22A8] flex gap-3 items-center">
            <div className="bg-[#1E22A8] p-2 rounded-lg text-white"><Building/></div> FILIAIS
        </h2>
        <button onClick={()=>setEditingFilial({codigo:'', nome_fantasia:''})} className="bg-[#1E22A8] text-white px-4 py-2 rounded-xl font-bold flex gap-2"><Plus size={18}/> Nova</button>
      </div>

      {editingFilial && (
        <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-blue-200 grid grid-cols-2 gap-4">
            <div><label className={STYLES.label}>Código</label><input className={STYLES.input} value={editingFilial.codigo || ""} onChange={e=>setEditingFilial({...editingFilial, codigo:e.target.value})}/></div>
            <div><label className={STYLES.label}>Nome</label><input className={STYLES.input} value={editingFilial.nome_fantasia || ""} onChange={e=>setEditingFilial({...editingFilial, nome_fantasia:e.target.value})}/></div>
            <div className="col-span-2 flex gap-2">
                <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold">Salvar</button>
                <button onClick={()=>setEditingFilial(null)} className="bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold">Cancelar</button>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filiais.map(f => (
            <div key={f.id} className="p-4 border-2 border-slate-100 rounded-xl flex justify-between items-center group hover:border-blue-200">
                <div>
                    <span className="font-bold text-slate-700 block">{f.nome_fantasia}</span>
                    <span className="text-xs font-black bg-slate-200 text-slate-500 px-2 py-0.5 rounded-lg">{f.codigo}</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={()=>setEditingFilial(f)} className="p-2 text-[#1E22A8] hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button>
                    <button onClick={() => onExcluir(f)} className="p-2 text-[#E30613] hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                </div>
            </div>
        ))}
      </div>
    </div>
    
  );
}
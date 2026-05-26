import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-24 right-4 z-[110] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-xl border-l-4 min-w-[300px] animate-in slide-in-from-right duration-300 bg-white ${t.type === 'error' ? 'border-[#E30613]' : 'border-[#1E22A8]'}`}>
          <div className={`${t.type === 'error' ? 'text-[#E30613]' : 'text-[#1E22A8]'}`}>
            {t.type === 'error' ? <AlertCircle size={24}/> : <CheckCircle size={24}/>}
          </div>
          <div className="flex-1">
            <h4 className={`font-black text-xs uppercase tracking-wider ${t.type === 'error' ? 'text-[#E30613]' : 'text-[#1E22A8]'}`}>{t.type === 'error' ? 'Atenção' : 'Sucesso'}</h4>
            <p className="text-sm font-bold text-slate-700">{t.message}</p>
          </div>
          <button onClick={() => removeToast(t.id)} className="text-slate-300 hover:text-slate-500"><X size={16}/></button>
        </div>
      ))}
    </div>
  );
}
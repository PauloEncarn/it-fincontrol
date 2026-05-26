import React from 'react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1E22A8]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border-t-4 border-[#E30613] animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-black text-[#1E22A8] mb-2">{title}</h3>
        <p className="text-slate-600 mb-6 font-medium">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-slate-500 font-bold hover:bg-slate-100 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="px-6 py-2 rounded-lg bg-[#E30613] text-white font-bold hover:bg-[#C2000B] shadow-lg shadow-red-500/30 transition-all active:scale-95">Confirmar</button>
        </div>
      </div>
    </div>
  );
}
import { CheckCircle } from 'lucide-react';

export default function KpiCard({ title, count, colorHex, icon, isActive, onClick }) {
  return (
    <div onClick={onClick} className={`bg-white p-6 border-l-[6px] rounded-2xl shadow-sm transition-all duration-200 group relative overflow-hidden cursor-pointer select-none ${isActive ? 'ring-2 ring-[#1E22A8] -translate-y-1' : 'hover:-translate-y-1 hover:shadow-md'}`} style={{ borderColor: colorHex }}>
      {isActive && <div className="absolute top-3 right-3 text-[#1E22A8]"><CheckCircle size={20} fill="#F9C531"/></div>}
      <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity transform rotate-12 scale-[2.5]" style={{ color: colorHex }}>{icon}</div>
      <div className="relative z-10">
        <p className={`text-[11px] font-black uppercase tracking-widest mb-2 ${isActive ? 'text-[#1E22A8]' : 'text-slate-400'}`}>{title}</p>
        <p className="text-4xl font-black text-[#1E22A8] tracking-tighter">{count}</p>
      </div>
    </div>
  );
}
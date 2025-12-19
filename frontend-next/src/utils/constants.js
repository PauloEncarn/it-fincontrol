// src/utils/constants.js
import { Clock, AlertTriangle, Calendar, Mail, CheckCircle } from 'lucide-react';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");

export const CORES = { 
  azulCicopal: '#1E22A8',      
  vermelhoCicopal: '#E30613',  
  amareloAlerta: '#F9C531', 
  azulClaro: '#2196F3',
  roxoEmail: '#8B5CF6'
};

export const STATUS_STYLES = {
  'Aguardando Fatura': { bg: 'bg-[#F9C531]/10', border: 'border-[#F9C531]', text: 'text-amber-600', icon: <Clock/> },
  'Pendente Lançamento': { bg: 'bg-[#E30613]/10', border: 'border-[#E30613]', text: 'text-[#E30613]', icon: <AlertTriangle/> },
  'Aguardando Pagamento': { bg: 'bg-[#1E22A8]/10', border: 'border-[#1E22A8]', text: 'text-[#1E22A8]', icon: <Calendar/> },
  'Email Enviado p/ Balança': { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600', icon: <Mail/> },
  'Concluída': { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-600', icon: <CheckCircle/> },
};

export const OPCOES_STATUS = ['Aguardando Fatura', 'Pendente Lançamento', 'Aguardando Pagamento', 'Email Enviado p/ Balança', 'Concluída'];
export const OPCOES_STATUS_COMPRA = ['Pendente', 'Em Cotação', 'Aprovado', 'Pedido Realizado', 'Entregue', 'Cancelado'];

// Estilos comuns (Tailwind classes)
export const STYLES = {
    input: "w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1E22A8] focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400",
    label: "text-[11px] font-black uppercase text-[#1E22A8] tracking-widest mb-1.5 block ml-1",
    buttonPrimary: "bg-[#1E22A8] hover:bg-[#E30613] text-white font-black px-6 py-3 rounded-xl shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
};
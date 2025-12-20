// src/utils/constants.js
import { Clock, AlertTriangle, Calendar, Mail, CheckCircle } from 'lucide-react';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");

// Paleta de Cores do Sistema
export const CORES = {
    azulCicopal: '#1E22A8',
    vermelhoCicopal: '#E30613',
    amareloAlerta: '#F9C531',
    verdeSucesso: '#10B981',
};

// Opções para Dropdowns
export const OPCOES_STATUS = [
    'Pendente Lançamento', 
    'Aguardando Fatura', 
    'Aguardando Pagamento', 
    'Concluída',
    'Cancelada'
];

// Estilos dinâmicos para etiquetas de status (NotasView)
export const STATUS_STYLES = {
    'Pendente Lançamento': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    'Aguardando Fatura': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    'Aguardando Pagamento': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    'Concluída': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    'Cancelada': { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
    'Email Enviado p/ Balança': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' }
};

// --- O QUE ESTAVA FALTANDO PARA O USUARIOSVIEW ---
export const STYLES = {
    input: "w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#1E22A8] focus:ring-4 focus:ring-[#1E22A8]/10 transition-all",
    label: "block text-xs font-black text-slate-400 uppercase tracking-wider mb-2",
    primaryButton: "w-full bg-[#1E22A8] hover:bg-[#E30613] text-white py-4 rounded-xl font-black tracking-wide shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
    secondaryButton: "w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-xl font-black tracking-wide transition-all active:scale-95"
};
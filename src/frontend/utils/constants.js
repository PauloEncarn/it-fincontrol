// src/frontend/utils/constants.js
import { Clock, AlertTriangle, Calendar, Mail, CheckCircle } from 'lucide-react';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");

export const CORES = {
    azulCicopal: '#1E22A8',
    azulEscuro: '#151875', // Um tom mais fechado para contrastes
    vermelhoCicopal: '#E30613',
    amareloAlerta: '#F9C531',
    verdeSucesso: '#10B981',
    cinzaClaro: '#F8FAFC'
};

export const OPCOES_STATUS = [
    'Pendente Lançamento', 
    'Aguardando Fatura', 
    'Aguardando Pagamento', 
    'Concluída',
    'Cancelada'
];

// NOVOS STATUS DE SOLICITAÇÃO
export const OPCOES_STATUS_COMPRA = [
    'Em Andamento',
    'Aprovado',
    'Rejeitado',
    'Concluído'
];

export const STATUS_STYLES = {
    'Pendente Lançamento': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'Aguardando Fatura': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'Aguardando Pagamento': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Concluída': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    'Cancelada': { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
    'Email Enviado p/ Balança': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    
    // Estilos para Solicitações
    'Em Andamento': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Aprovado': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    'Rejeitado': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'Concluído': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' }
};

export const STYLES = {
    input: "w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#1E22A8] focus:ring-4 focus:ring-[#1E22A8]/10 transition-all",
    label: "block text-xs font-black text-slate-400 uppercase tracking-wider mb-2",
    primaryButton: "w-full bg-[#1E22A8] hover:bg-[#E30613] text-white py-4 rounded-xl font-black tracking-wide shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
    secondaryButton: "w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-xl font-black tracking-wide transition-all active:scale-95"
};
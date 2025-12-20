export const API_URL = "http://192.168.0.122:8000"; // Ou sua URL

export const CORES = {
    azulCicopal: '#1E22A8',
    vermelhoCicopal: '#E30613',
    amareloAlerta: '#F9C531',
    verdeSucesso: '#10B981',
};

export const OPCOES_STATUS = [
    'Pendente Lançamento', 
    'Aguardando Fatura', 
    'Aguardando Pagamento', 
    'Concluída',
    'Cancelada'
];

export const STATUS_STYLES = {
    'Pendente Lançamento': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    'Aguardando Fatura': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    'Aguardando Pagamento': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    'Concluída': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    'Cancelada': { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
    'Email Enviado p/ Balança': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' }
};
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

export const CORES = {
  azulCicopal: '#1E22A8',
  azulEscuro: '#151875',
  vermelhoCicopal: '#E30613',
  amareloAlerta: '#F9C531',
  verdeSucesso: '#10B981',
  cinzaClaro: '#F8FAFC',
};

export const OPCOES_STATUS = [
  'Pendente Lançamento',
  'Aguardando Fatura',
  'Aguardando Pagamento',
  'Concluída',
  'Cancelada',
];

export const OPCOES_STATUS_COMPRA = [
  'Em Andamento',
  'Aprovado',
  'Rejeitado',
  'Concluído',
];

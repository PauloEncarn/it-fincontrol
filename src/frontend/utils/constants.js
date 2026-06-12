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
  'Pendente Nota',
  'Pendente Boleto',
  'Pendente Fatura',
  'Em Andamento',
  'Aguardando Aprovação Fluig',
  'Aguardando Confirmação GOPA',
  'Aguardando Contingência Gerente',
  'Aguardando Contingência Head',
  'Concluída',
  'Cancelada',
];

export const OPCOES_STATUS_COMPRA = [
  'Em Andamento',
  'Aprovado',
  'Rejeitado',
  'Concluído',
];

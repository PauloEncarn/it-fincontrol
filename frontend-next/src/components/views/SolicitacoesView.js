import React from 'react';
import { FileText, Plus, Edit2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const STATUS_COLORS = {
    'Pendente': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Em Andamento': 'bg-blue-100 text-blue-700 border-blue-200',
    'Aprovado': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Rejeitado': 'bg-red-100 text-red-700 border-red-200',
    'Concluido': 'bg-gray-100 text-gray-700 border-gray-200'
};

const STATUS_ICONS = {
    'Pendente': Clock,
    'Em Andamento': AlertCircle,
    'Aprovado': CheckCircle,
    'Rejeitado': XCircle,
    'Concluido': CheckCircle
};

export default function SolicitacoesView({ 
    solicitacoes, 
    onNovaSolicitacao, 
    onEditarSolicitacao,
    busca // <--- Recebendo a busca do Pai
}) {

    // --- LÓGICA DE FILTRO SEGURA ---
    const dadosFiltrados = solicitacoes.filter(item => {
        if (!busca) return true; // Se não tiver busca, mostra tudo

        const termo = busca.toLowerCase();

        // Tratamento seguro para strings (evita erro em nulos)
        const id = item.id ? item.id.toString() : '';
        const numeroFluig = item.fluig_id ? item.fluig_id.toString() : '';
        const numeroSC = item.numero_sc ? item.numero_sc.toString() : '';
        const solicitante = item.solicitante ? item.solicitante.toLowerCase() : '';
        const fornecedor = item.fornecedor?.nome_empresa ? item.fornecedor.nome_empresa.toLowerCase() : '';
        const servico = item.servico ? item.servico.toLowerCase() : '';
        const status = item.status ? item.status.toLowerCase() : '';

        // Tratamento para Valor (busca por "1500" ou "1.500,00")
        const valorFormatado = item.valor 
            ? parseFloat(item.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2}) 
            : '';
        const valorLimpo = valorFormatado.replace(/\./g, '');

        return (
            id.includes(termo) ||
            numeroFluig.includes(termo) ||
            numeroSC.includes(termo) ||
            solicitante.includes(termo) ||
            fornecedor.includes(termo) ||
            servico.includes(termo) ||
            status.includes(termo) ||
            valorFormatado.includes(termo) ||
            valorLimpo.includes(termo)
        );
    });

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header da Seção */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-[#1E22A8]" />
                        Solicitações de Compra
                    </h2>
                    <p className="text-slate-400 text-xs font-medium mt-1">
                        Gerencie pedidos, SCs e aprovações do Fluig
                    </p>
                </div>
                
                <button 
                    onClick={onNovaSolicitacao}
                    className="bg-[#1E22A8] hover:bg-[#2529d8] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-900/10 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={18} />
                    NOVA SOLICITAÇÃO
                </button>
            </div>

            {/* Lista de Cards */}
            <div className="grid grid-cols-1 gap-4">
                {dadosFiltrados.length === 0 ? (
                     <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
                        <p>Nenhuma solicitação encontrada.</p>
                    </div>
                ) : (
                    dadosFiltrados.map((item) => {
                        const Icon = STATUS_ICONS[item.status] || Clock;
                        const statusClass = STATUS_COLORS[item.status] || STATUS_COLORS['Pendente'];

                        return (
                            <div key={item.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200 group-hover:bg-[#1E22A8] transition-colors"></div>
                                
                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    
                                    {/* BLOCO 1: Status e ID */}
                                    <div className="flex flex-col gap-2 min-w-[140px]">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border w-fit ${statusClass}`}>
                                            <Icon size={12} />
                                            {item.status}
                                        </div>
                                        <span className="text-xs text-slate-400 font-bold">ID: #{item.id}</span>
                                        {item.fluig_id && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded w-fit">Fluig: {item.fluig_id}</span>}
                                    </div>

                                    {/* BLOCO 2: Detalhes Principais */}
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-700 text-base">
                                                {item.fornecedor?.nome_empresa || "Fornecedor não informado"}
                                            </h3>
                                            <span className="text-[10px] px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-400 font-bold uppercase">
                                                {item.filial?.codigo || '?'}
                                            </span>
                                        </div>
                                        
                                        <p className="text-sm text-slate-500 line-clamp-1">{item.servico}</p>
                                        
                                        <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2">
                                            <span className="flex items-center gap-1">
                                                <strong className="text-slate-600">SC:</strong> {item.numero_sc || '-'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <strong className="text-slate-600">Solicitante:</strong> {item.solicitante}
                                            </span>
                                        </div>
                                    </div>

                                    {/* BLOCO 3: Valor e Ação */}
                                    <div className="flex flex-col items-end gap-3 min-w-[150px]">
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Valor Estimado</p>
                                            <p className="text-xl font-black text-slate-700">
                                                R$ {parseFloat(item.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                            </p>
                                        </div>
                                        
                                        <button 
                                            onClick={() => onEditarSolicitacao(item)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 text-slate-500 hover:text-[#1E22A8] hover:bg-blue-50 border border-slate-200 transition-all text-xs font-bold"
                                        >
                                            <Edit2 size={14} />
                                            EDITAR
                                        </button>
                                    </div>

                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
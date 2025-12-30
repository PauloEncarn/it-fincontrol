import React, { useState } from 'react';
import { FileText, Plus, Edit2, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const ITENS_POR_PAGINA = 9;

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

const ABAS_FILTRO = ['Todos', 'Pendente', 'Em Andamento', 'Aprovado', 'Concluido'];

export default function SolicitacoesView({ 
    solicitacoes, 
    onNovaSolicitacao, 
    onEditarSolicitacao,
    busca 
}) {
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [statusAtivo, setStatusAtivo] = useState('Todos');
    
    // --- CORREÇÃO DO ERRO DO USEEFFECT ---
    // Em vez de useEffect, usamos estado local para rastrear a mudança da prop 'busca'.
    // Se a busca que veio do pai for diferente da última que vimos, resetamos a página IMEDIATAMENTE.
    const [ultimaBusca, setUltimaBusca] = useState(busca);

    if (busca !== ultimaBusca) {
        setPaginaAtual(1);
        setUltimaBusca(busca);
    }

    // Função para trocar de aba e resetar página (Substitui o useEffect do Status)
    const handleStatusChange = (novoStatus) => {
        setStatusAtivo(novoStatus);
        setPaginaAtual(1);
    };
    // -------------------------------------

    // --- 1. FILTRAGEM ---
    const dadosFiltrados = solicitacoes.filter(item => {
        // Filtro de Status
        if (statusAtivo !== 'Todos' && item.status !== statusAtivo) {
            return false;
        }

        // Filtro de Texto
        if (!busca) return true;
        
        const termo = busca.toLowerCase();
        
        const valorFormatado = item.valor 
            ? parseFloat(item.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2}) 
            : '';
        const valorLimpo = valorFormatado.replace(/\./g, '');

        const textoCompleto = [
            item.id,
            item.fluig_id,
            item.numero_sc,
            item.numero_pedido,
            item.solicitante,
            item.servico,
            item.status,
            item.fornecedor?.nome_empresa,
            item.filial?.nome_fantasia,
            item.filial?.codigo,
            valorFormatado,
            valorLimpo
        ].join(' ').toLowerCase();

        return textoCompleto.includes(termo);
    });

    // --- 2. PAGINAÇÃO ---
    const totalItens = dadosFiltrados.length;
    const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA);
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    
    const dadosPaginados = dadosFiltrados.slice(inicio, fim);

    return (
        <div className="space-y-6 animate-in fade-in pb-10">
            {/* Header + Botão Novo */}
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

            {/* --- ABAS DE FILTRO DE STATUS --- */}
            <div className="flex flex-wrap gap-2">
                {ABAS_FILTRO.map(status => (
                    <button
                        key={status}
                        onClick={() => handleStatusChange(status)} // Usa a nova função
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                            statusAtivo === status
                                ? 'bg-[#1E22A8] text-white border-[#1E22A8] shadow-md'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Lista de Cards */}
            <div className="grid grid-cols-1 gap-4">
                {dadosPaginados.length === 0 ? (
                     <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
                        <Filter className="mx-auto mb-2 opacity-20" size={40} />
                        {/* Correção das aspas para evitar erro de escape */}
                        <p>Nenhuma solicitação encontrada.</p> 
                        {statusAtivo !== 'Todos' && (
                            <button onClick={() => handleStatusChange('Todos')} className="text-[#1E22A8] text-xs font-bold mt-2 hover:underline">
                                Limpar filtros
                            </button>
                        )}
                    </div>
                ) : (
                    dadosPaginados.map((item) => {
                        const Icon = STATUS_ICONS[item.status] || Clock;
                        const statusClass = STATUS_COLORS[item.status] || STATUS_COLORS['Pendente'];

                        return (
                            <div key={item.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200 group-hover:bg-[#1E22A8] transition-colors"></div>
                                
                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    <div className="flex flex-col gap-2 min-w-[140px]">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border w-fit ${statusClass}`}>
                                            <Icon size={12} />
                                            {item.status}
                                        </div>
                                        <span className="text-xs text-slate-400 font-bold">ID: #{item.id}</span>
                                        {item.fluig_id && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded w-fit">Fluig: {item.fluig_id}</span>}
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-700 text-base">
                                                {item.fornecedor?.nome_empresa || "Fornecedor não informado"}
                                            </h3>
                                            <span className="text-[10px] px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-400 font-bold uppercase">
                                                {item.filial?.codigo || '?'}
                                            </span>
                                        </div>
                                        
                                        <p className="text-sm text-slate-500 font-medium line-clamp-1">{item.servico || 'Sem descrição'}</p>
                                        
                                        <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2">
                                            <span className="flex items-center gap-1">
                                                <strong className="text-slate-600">SC:</strong> {item.numero_sc || '-'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <strong className="text-slate-600">Solicitante:</strong> {item.solicitante || '-'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-3 min-w-[150px]">
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Valor Estimado</p>
                                            <p className="text-xl font-black text-slate-700">
                                                R$ {parseFloat(item.valor || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
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

            {/* --- PAGINAÇÃO --- */}
            {totalItens > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-400 font-medium">
                        Mostrando <span className="text-slate-700 font-bold">{inicio + 1}</span> a <span className="text-slate-700 font-bold">{Math.min(fim, totalItens)}</span> de <span className="text-slate-700 font-bold">{totalItens}</span> resultados
                    </p>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                            disabled={paginaAtual === 1}
                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
                            Página {paginaAtual} de {totalPaginas}
                        </span>

                        <button 
                            onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                            disabled={paginaAtual === totalPaginas}
                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
import React from 'react';
import { Download, FileText, Calendar, DollarSign, User, MapPin, Hash, CheckCircle, Clock, AlertCircle, XCircle, Send, MoreVertical, Copy, FileIcon, Truck } from 'lucide-react';
// Mantenha seus outros imports de componentes (se houver) aqui

// Mapeamento de Cores e Ícones (Mantenha o que você já tem)
const STATUS_STYLES = {
    'Pendente Lançamento': { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
    'Pendente Aprovação': { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: AlertCircle },
    'Aprovado': { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle },
    'Email Enviado p/ Balança': { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Send },
    'Pago': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: DollarSign },
    'Cancelado': { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

export default function NotasView({ 
    notas, 
    competencia,
    setCompetencia,
    filiais,
    filialFiltro,
    setFilialFiltro,
    statusFiltro,
    setStatusFiltro,
    onEditar,
    onDuplicar,
    onCopiarProtheus,
    onEnviarEmail,
    onDownload,
    onStatusChange,
    isGopaFunc,
    busca,
    onRefresh
}) {

    // --- 1. LÓGICA DE CÁLCULO (Disponível mas oculta na tela) ---
    const totalValor = notas.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

    // --- 2. LÓGICA DE EXPORTAÇÃO ---
    const handleExportarExcel = () => {
        if (!notas || notas.length === 0) return alert("Sem dados para exportar.");

        const headers = ["ID", "Filial", "Fornecedor", "CNPJ", "Nota Fiscal", "Vencimento", "Valor", "Status", "Descrição"];

        const rows = notas.map(n => [
            n.id,
            n.filial_id, // Idealmente trocar pelo nome da filial se tiver o objeto
            `"${n.nome_fornecedor || 'Desconhecido'}"`,
            n.cnpj_usado || '',
            n.numero_nota,
            n.data_vencimento ? new Date(n.data_vencimento).toLocaleDateString('pt-BR') : '',
            `"${parseFloat(n.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}"`,
            n.status_pagamento,
            `"${n.descricao_servico || ''}"`
        ]);

        // Adiciona uma linha final com o TOTAL no Excel
        rows.push([
            "", "", "", "", "TOTAL:", "", 
            `"${totalValor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}"`, 
            "", ""
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map(e => e.join(";"))
        ].join("\n");

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `notas_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- FILTROS VISUAIS ---
    // (Apenas um exemplo de layout para o botão ficar alinhado com os filtros)
    return (
        <div className="space-y-4 animate-in fade-in">
            
            {/* Barra de Ferramentas / Filtros */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-end xl:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                
                {/* Lado Esquerdo: Filtros de Mês e Filial */}
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    {/* Filtro de Mês */}
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <button onClick={() => setCompetencia(new Date(competencia.setMonth(competencia.getMonth() - 1)))} className="p-1.5 hover:bg-white rounded-md transition-all text-slate-500 hover:text-[#1E22A8]">{"<"}</button>
                        <div className="px-3 py-1 text-sm font-bold text-slate-700 min-w-[120px] text-center capitalize">
                            {competencia.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                        </div>
                        <button onClick={() => setCompetencia(new Date(competencia.setMonth(competencia.getMonth() + 1)))} className="p-1.5 hover:bg-white rounded-md transition-all text-slate-500 hover:text-[#1E22A8]">{">"}</button>
                    </div>

                    {/* Filtro de Filial */}
                    <select 
                        value={filialFiltro} 
                        onChange={(e) => setFilialFiltro(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:border-[#1E22A8]"
                    >
                        <option value="">Todas as Filiais</option>
                        {filiais.map(f => <option key={f.id} value={f.id}>{f.codigo} - {f.nome_fantasia}</option>)}
                    </select>

                    {/* Botão Refresh Manual (Opcional aqui se já tem no Header) */}
                    <button onClick={onRefresh} className="p-2 text-slate-400 hover:text-[#1E22A8] transition-colors" title="Atualizar">
                        <Clock size={18} />
                    </button>
                </div>

                {/* Lado Direito: Botão Exportar */}
                <button 
                    onClick={handleExportarExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg font-bold text-sm transition-all active:scale-95 whitespace-nowrap"
                >
                    <Download size={18} />
                    Exportar Excel
                </button>
            </div>

            {/* --- LISTA DE NOTAS --- */}
            {/* Aqui entra a sua tabela ou grid existente. Vou colocar um placeholder para representar o resto do código que você já tem */}
            {notas.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400">Nenhuma nota encontrada para este período.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {/* ... Mantenha o seu .map das notas aqui ... */}
                    {/* Vou renderizar só um aviso para você colar seu map original se necessário, 
                        mas se você já tinha a lista, mantenha ela aqui dentro. 
                        Se quiser eu mando o código completo da lista também. */}
                    
                    {notas.map((nota) => {
                         // ... (Seu código de renderização do Card/Tabela vai aqui)
                         // Para garantir que nada quebre, vou assumir que você vai colar o conteúdo 
                         // do return da sua NotasView antiga aqui dentro.
                         
                         // Se quiser o código COMPLETO da visualização (Cards) me avise que eu colo aqui.
                         // Por enquanto, foquei na parte do Botão Exportar acima.
                         
                         // Exemplo simplificado só para não quebrar se copiar direto:
                         return (
                            <div key={nota.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-slate-700">{nota.nome_fornecedor}</h3>
                                    <p className="text-xs text-slate-500">NF: {nota.numero_nota} | R$ {parseFloat(nota.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                                </div>
                                <div className="flex gap-2">
                                     <button onClick={() => onEditar(nota)} className="text-xs bg-slate-100 px-3 py-1 rounded">Editar</button>
                                     {/* ... outros botões */}
                                </div>
                            </div>
                         );
                    })}
                </div>
            )}
        </div>
    );
}
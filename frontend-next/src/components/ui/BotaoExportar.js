'use client';

// Importação da biblioteca de Excel
import * as XLSX from 'xlsx';
// Importação do ícone (TEM que ter chaves { })
import { Download } from 'lucide-react';

export default function BotaoExportar({ dados }) {

  const handleExport = () => {
    // Se não tiver dados, avisa e para
    if (!dados || dados.length === 0) {
        alert("Sem dados para exportar neste filtro.");
        return;
    }

    // 1. Preparar os dados (Mapeamento)
    const dadosParaExcel = dados.map(item => ({
      ID: item.id,
      Status: item.status_pagamento,
      Fornecedor: item.nome_fornecedor || item.fornecedor?.nome_empresa || 'N/A',
      Nota_Fiscal: item.numero_nota,
      Valor: typeof item.valor === 'number' ? item.valor : parseFloat(item.valor || 0), 
      Vencimento: item.data_vencimento ? new Date(item.data_vencimento).toLocaleDateString('pt-BR') : '-',
      
      // Links completos
      Link_Boleto: item.arquivo_boleto ? `${window.location.origin}/${item.arquivo_boleto}` : 'N/A',
      Link_Nota: item.arquivo_nota ? `${window.location.origin}/${item.arquivo_nota}` : 'N/A',
      
      Observacao: item.observacao || ''
    }));

    // 2. Criar a Planilha
    const ws = XLSX.utils.json_to_sheet(dadosParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");

    // 3. Gerar e Baixar
    const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    XLSX.writeFile(wb, `Financeiro_TI_${dataHoje}.xlsx`);
  };

  return (
    <button
      onClick={handleExport}
className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#1E22A8] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"      title="Baixar planilha Excel"
    >
      <Download size={18} />
      <span>EXPORTAR EXCEL</span>
    </button>
  );
}
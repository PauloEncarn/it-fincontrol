'use client';

import * as XLSX from 'xlsx';
import { Button } from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

export default function BotaoExportar({ dados }) {
  const handleExport = () => {
    if (!dados || dados.length === 0) {
      alert('Sem dados para exportar neste filtro.');
      return;
    }

    const dadosParaExcel = dados.map((item) => ({
      ID: item.id,
      Status: item.status_pagamento,
      Fornecedor: item.nome_fornecedor || item.fornecedor?.nome_empresa || 'N/A',
      Nota_Fiscal: item.numero_nota,
      Valor: typeof item.valor === 'number' ? item.valor : parseFloat(item.valor || 0),
      Vencimento: item.data_vencimento ? new Date(item.data_vencimento).toLocaleDateString('pt-BR') : '-',
      Link_Boleto: item.arquivo_boleto ? `${window.location.origin}/${item.arquivo_boleto}` : 'N/A',
      Link_Nota: item.arquivo_nota ? `${window.location.origin}/${item.arquivo_nota}` : 'N/A',
      Observacao: item.observacao || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dadosParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos');

    const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    XLSX.writeFile(wb, `Financeiro_TI_${dataHoje}.xlsx`);
  };

  return (
    <Button variant="contained" color="success" startIcon={<DownloadOutlinedIcon />} onClick={handleExport}>
      Exportar Excel
    </Button>
  );
}

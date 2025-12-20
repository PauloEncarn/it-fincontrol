import React from 'react';
import { Clock, AlertTriangle, Calendar, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';
import { CORES } from '@/utils/constants';

export default function DashboardView({ kpis }) {
  
  // Cálculos Simples para o Dashboard
  const totalNotas = kpis.length;
  const totalValor = kpis.reduce((acc, n) => acc + parseFloat(n.valor || 0), 0);
  const pendentes = kpis.filter(n => n.status_pagamento === 'Pendente Lançamento').length;
  const aguardandoFatura = kpis.filter(n => n.status_pagamento === 'Aguardando Fatura').length;
  const concluidas = kpis.filter(n => n.status_pagamento === 'Concluída').length;
  
  // Porcentagens para as barrinhas
  const percPendentes = totalNotas ? (pendentes / totalNotas) * 100 : 0;
  const percConcluidas = totalNotas ? (concluidas / totalNotas) * 100 : 0;

  return (
    <div className="space-y-8 animate-in fade-in">
        
        {/* BANNER DE BOAS VINDAS */}
        <div className="bg-gradient-to-r from-[#1E22A8] to-[#2a2fb8] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-3xl font-black mb-2">Visão Geral</h2>
                <p className="text-blue-100">Acompanhe os indicadores de performance do mês.</p>
                <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-4xl font-black">R$ {totalValor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    <span className="text-sm font-medium opacity-80">em notas processadas</span>
                </div>
            </div>
            {/* Elemento decorativo */}
            <TrendingUp className="absolute -right-10 -bottom-10 text-white/10 w-64 h-64" />
        </div>

        {/* CARDS DE KPI (Mantidos, mas agora focados) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Aguardando Fatura" count={aguardandoFatura} colorHex={CORES.amareloAlerta} icon={<Clock size={40}/>} isActive={false} onClick={()=>{}}/>
            <KpiCard title="Pendente Lançamento" count={pendentes} colorHex={CORES.vermelhoCicopal} icon={<AlertTriangle size={40}/>} isActive={false} onClick={()=>{}}/>
            <KpiCard title="Aguardando Pagto" count={kpis.filter(n=>n.status_pagamento==='Aguardando Pagamento').length} colorHex={CORES.azulCicopal} icon={<Calendar size={40}/>} isActive={false} onClick={()=>{}}/>
            <KpiCard title="Concluída" count={concluidas} colorHex="#10B981" icon={<CheckCircle size={40}/>} isActive={false} onClick={()=>{}}/>
        </div>

        {/* ÁREA DE GRÁFICOS (SIMULADOS COM CSS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PAINEL DE STATUS */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-[#1E22A8] mb-6 flex items-center gap-2">
                    <TrendingUp size={20}/> Eficiência Operacional
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
                            <span>Pendentes de Lançamento</span>
                            <span>{pendentes} notas ({percPendentes.toFixed(0)}%)</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#E30613] rounded-full transition-all duration-1000" style={{width: `${percPendentes}%`}}></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
                            <span>Processo Concluído</span>
                            <span>{concluidas} notas ({percConcluidas.toFixed(0)}%)</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{width: `${percConcluidas}%`}}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PAINEL DE SOLICITAÇÕES (EXEMPLO FUTURO) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                <div className="bg-blue-50 p-4 rounded-full mb-4">
                    <DollarSign size={32} className="text-[#1E22A8]"/>
                </div>
                <h3 className="text-lg font-black text-slate-700 mb-2">Solicitações de Compra</h3>
                <p className="text-slate-400 text-sm mb-4">Resumo das SCs e Pedidos</p>
                <div className="text-3xl font-black text-slate-800">Em Breve</div>
            </div>
        </div>
    </div>
  );
}
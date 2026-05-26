import React, { useState, useMemo, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, AlertCircle, ShoppingCart, CheckCircle, Wallet, FileText, Filter, Calendar, BarChart3, ChevronDown } from 'lucide-react';
import { CORES } from '@/frontend/utils/constants';

const CardKpi = ({ title, value, sub, icon: Icon, colorClass, bgClass }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-full relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${bgClass} opacity-20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
        <div className="flex justify-between items-start z-10">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className={`text-2xl font-black ${colorClass}`}>{value}</h3>
            </div>
            <div className={`p-2.5 rounded-xl ${bgClass} ${colorClass}`}>
                <Icon size={20} />
            </div>
        </div>
        {sub && <p className="text-[10px] font-bold text-slate-400 mt-3 border-t border-slate-50 pt-2">{sub}</p>}
    </div>
);

export default function DashboardView({ 
    notas, 
    solicitacoes, 
    filiais,
    fornecedores
}) {
  
  const MESES = ['Todos os Meses', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  // DICA: Mudei o padrão para 2025 pois seus dados importados são de 2025/2026
  const [mesNotas, setMesNotas] = useState(new Date().getMonth() + 1); 
  const [anoNotas, setAnoNotas] = useState(2025); // <--- Forçado 2025 para ver os dados novos
  const [filialNotas, setFilialNotas] = useState('');
  
  const [mesSolic, setMesSolic] = useState(0); // 0 = Todos os meses (para ver tudo de cara)
  const [anoSolic, setAnoSolic] = useState(2025); // <--- Forçado 2025

  // --- DEBUG: Verifique o console do navegador (F12) ---
  useEffect(() => {
      console.log("--- DEBUG DASHBOARD ---");
      console.log("Qtd Solicitações recebidas:", solicitacoes.length);
      console.log("Exemplo de Solicitação:", solicitacoes[0]);
  }, [solicitacoes]);

  // --- PROCESSAMENTO: NOTAS ---
  const dadosNotas = useMemo(() => {
      const lista = notas.filter(n => {
          const dataStr = n.data_vencimento || n.data_envio; 
          if (!dataStr) return false;
          const d = new Date(dataStr);
          if (isNaN(d.getTime())) return false; 

          const matchAno = d.getFullYear() == anoNotas;
          const matchMes = mesNotas === 0 ? true : (d.getMonth() + 1) == mesNotas;
          const matchFilial = filialNotas ? n.filial_id == filialNotas : true;

          return matchAno && matchMes && matchFilial;
      });

      const evolucao = Array(12).fill(0).map((_, i) => ({ name: MESES[i+1].substr(0,3), valor: 0 }));
      lista.forEach(n => {
          const d = new Date(n.data_vencimento || n.data_envio);
          if (!isNaN(d.getTime())) {
              evolucao[d.getMonth()].valor += parseFloat(n.valor || 0);
          }
      });

      return { lista, evolucao };
  }, [notas, mesNotas, anoNotas, filialNotas]);

  // --- PROCESSAMENTO: SOLICITAÇÕES ---
  const dadosSolic = useMemo(() => {
      return solicitacoes.filter(s => {
          // Tenta Vencimento -> Criação -> Ou Data Atual (para não sumir se estiver vazio)
          const dataStr = s.data_vencimento || s.created_at || new Date().toISOString();
          const d = new Date(dataStr);
          
          // Se a data for inválida, considera como "Hoje"
          const anoItem = isNaN(d.getTime()) ? 2025 : d.getFullYear();
          const mesItem = isNaN(d.getTime()) ? (new Date().getMonth() + 1) : (d.getMonth() + 1);

          const matchAno = anoItem == anoSolic;
          const matchMes = mesSolic === 0 ? true : mesItem == mesSolic;
          
          return matchAno && matchMes;
      });
  }, [solicitacoes, mesSolic, anoSolic]);


  // --- TOTAIS ---
  const totalNotas = dadosNotas.lista.reduce((acc, n) => acc + parseFloat(n.valor || 0), 0);
  const totalSolic = dadosSolic.reduce((acc, s) => acc + parseFloat(s.valor || 0), 0);

  // Gráficos Auxiliares
  const statusData = [
    { name: 'Pendente', value: dadosNotas.lista.filter(n => n.status_pagamento === 'Pendente Lançamento').length, color: CORES.vermelhoCicopal },
    { name: 'Ag. Pagto', value: dadosNotas.lista.filter(n => n.status_pagamento.includes('Aguardando')).length, color: CORES.amareloAlerta },
    { name: 'Concluída', value: dadosNotas.lista.filter(n => n.status_pagamento === 'Concluída').length, color: CORES.verdeSucesso },
  ].filter(d => d.value > 0);

  const filiaisMap = {};
  dadosNotas.lista.forEach(n => { const nome = n.filial?.nome_fantasia || 'Outros'; filiaisMap[nome] = (filiaisMap[nome] || 0) + parseFloat(n.valor); });
  const filiaisData = Object.entries(filiaisMap).map(([name, valor]) => ({ name, valor })).sort((a, b) => b.valor - a.valor).slice(0, 5);

  return (
    <div className="space-y-10 animate-in fade-in pb-20">
        
        {/* ================= SEÇÃO NOTAS FISCAIS (AZUL) ================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 p-5 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 text-[#1E22A8]">
                    <div className="bg-[#1E22A8]/10 p-2 rounded-xl"><Wallet size={24} /></div>
                    <div><h2 className="font-black text-lg uppercase">Gestão de Notas</h2><p className="text-xs text-slate-400 font-bold">Financeiro</p></div>
                </div>
                <div className="flex flex-wrap gap-3 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <select value={anoNotas} onChange={(e) => setAnoNotas(e.target.value)} className="font-bold text-sm text-slate-700 outline-none cursor-pointer bg-transparent py-2 px-2 hover:bg-slate-50 rounded-lg">
                        {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <div className="w-px h-6 bg-slate-200"></div>
                    <select value={mesNotas} onChange={(e) => setMesNotas(parseInt(e.target.value))} className="font-bold text-sm text-[#1E22A8] outline-none cursor-pointer bg-transparent py-2 px-2 hover:bg-blue-50 rounded-lg">
                        {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <div className="w-px h-6 bg-slate-200"></div>
                    <select value={filialNotas} onChange={(e) => setFilialNotas(e.target.value)} className="font-bold text-xs text-slate-500 outline-none cursor-pointer bg-transparent py-2 px-2 hover:bg-slate-50 rounded-lg max-w-[150px]">
                        <option value="">Todas Filiais</option>
                        {filiais.map(f => <option key={f.id} value={f.id}>{f.nome_fantasia}</option>)}
                    </select>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <CardKpi title={mesNotas === 0 ? `Total ${anoNotas}` : `Total ${MESES[mesNotas]}`} value={`R$ ${totalNotas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} sub={`${dadosNotas.lista.length} notas`} icon={TrendingUp} colorClass="text-[#1E22A8]" bgClass="from-blue-100 to-blue-50"/>
                    {mesNotas === 0 ? ( <CardKpi title="Média Mensal" value={`R$ ${(totalNotas/12).toLocaleString('pt-BR', {minimumFractionDigits: 0})}`} sub="Estimativa" icon={BarChart3} colorClass="text-slate-600" bgClass="from-slate-100 to-slate-50"/> ) : ( <CardKpi title="Pendentes" value={statusData.find(d=>d.name==='Pendente')?.value || 0} sub="Atenção" icon={AlertCircle} colorClass="text-red-600" bgClass="from-red-100 to-red-50"/> )}
                    <CardKpi title="Concluídas" value={statusData.find(d=>d.name==='Concluída')?.value || 0} sub="Ok" icon={CheckCircle} colorClass="text-emerald-600" bgClass="from-emerald-100 to-emerald-50"/>
                    <CardKpi title="Em Processo" value={statusData.find(d=>d.name==='Ag. Pagto')?.value || 0} sub="Fluxo" icon={FileText} colorClass="text-amber-600" bgClass="from-amber-100 to-amber-50"/>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm h-64"><ResponsiveContainer width="100%" height="100%">{mesNotas===0?<AreaChart data={dadosNotas.evolucao}><defs><linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1E22A8" stopOpacity={0.3}/><stop offset="95%" stopColor="#1E22A8" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:10}} axisLine={false}/><Tooltip formatter={(v)=>`R$ ${v.toLocaleString()}`}/><Area type="monotone" dataKey="valor" stroke="#1E22A8" fill="url(#colorBlue)"/></AreaChart>:<PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0}/>)}</Pie><Tooltip /><Legend verticalAlign="middle" align="right" layout="vertical"/></PieChart>}</ResponsiveContainer></div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={filiaisData} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false}/><XAxis type="number" hide/><YAxis dataKey="name" type="category" width={100} tick={{fontSize: 9, fontWeight: 'bold'}}/><Tooltip formatter={(v) => `R$ ${v.toLocaleString()}`}/><Bar dataKey="valor" fill="#1E22A8" radius={[0, 4, 4, 0]} barSize={20}/></BarChart></ResponsiveContainer></div>
                </div>
            </div>
        </div>

        {/* ================= SEÇÃO SOLICITAÇÕES (ROXO) ================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-8">
            <div className="bg-purple-50/50 p-5 border-b border-purple-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 text-purple-800">
                    <div className="bg-purple-100 p-2 rounded-xl"><ShoppingCart size={24} /></div>
                    <div><h2 className="font-black text-lg uppercase">Solicitações de Compra</h2><p className="text-xs text-purple-400 font-bold">Pedidos</p></div>
                </div>
                <div className="flex flex-wrap gap-3 items-center bg-white p-2 rounded-xl border border-purple-100 shadow-sm">
                    <select value={anoSolic} onChange={(e) => setAnoSolic(e.target.value)} className="font-bold text-sm text-purple-900 outline-none cursor-pointer bg-transparent py-2 px-2 hover:bg-purple-50 rounded-lg">
                        {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <div className="w-px h-6 bg-purple-100"></div>
                    <select value={mesSolic} onChange={(e) => setMesSolic(parseInt(e.target.value))} className="font-bold text-sm text-purple-700 outline-none cursor-pointer bg-transparent py-2 px-2 hover:bg-purple-50 rounded-lg">
                        {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-purple-700 to-purple-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-center">
                    <div className="relative z-10">
                        <p className="text-purple-200 font-bold text-[10px] uppercase mb-1">Total Filtrado</p>
                        <h3 className="text-3xl font-black">R$ {totalSolic.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
                        <p className="text-xs mt-2 opacity-80 pt-2 border-t border-white/20 inline-block">{dadosSolic.length} pedidos encontrados</p>
                    </div>
                    <ShoppingCart className="absolute -right-6 -bottom-6 text-white/10 w-32 h-32" />
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm md:col-span-2">
                    <h4 className="text-[10px] font-black text-slate-400 mb-4 uppercase">Status dos Pedidos</h4>
                    <div className="h-32"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{name: 'Concluído', val: dadosSolic.filter(s=>s.status==='Concluído').length, color: '#10B981'}, {name: 'Em Andamento', val: dadosSolic.filter(s=>s.status==='Em Andamento').length, color: '#3B82F6'}, {name: 'Rejeitado', val: dadosSolic.filter(s=>s.status==='Rejeitado').length, color: '#EF4444'}]} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" hide/><YAxis dataKey="name" type="category" width={90} tick={{fontSize:10, fontWeight:'bold'}}/><Tooltip cursor={{fill:'transparent'}}/><Bar dataKey="val" radius={[0,4,4,0]} barSize={20}>{[0,1,2].map((e,i)=><Cell key={i} fill={['#10B981','#3B82F6','#EF4444'][i]}/>)}</Bar></BarChart></ResponsiveContainer></div>
                </div>
            </div>
        </div>
    </div>
  );
}
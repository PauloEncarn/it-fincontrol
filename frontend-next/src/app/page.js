import React from 'react';
import { X, ShoppingCart, FileText } from 'lucide-react';
import { STYLES, OPCOES_STATUS_COMPRA } from '@/utils/constants';

export default function ModalSolicitacao({
    isOpen,
    onClose,
    form,
    setForm,
    filiais,
    fornecedores,
    onSalvar,
    onFornecedorChange
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#1E22A8]/60 backdrop-blur-md z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-2xl font-black flex gap-3 text-[#1E22A8] items-center"><ShoppingCart/> {form.id ? 'EDITAR SOLICITAÇÃO' : 'NOVA SOLICITAÇÃO'}</h2>
                    <button onClick={onClose} className="bg-white p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-[#E30613]"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        
                        {/* DADOS BÁSICOS */}
                        <div className="md:col-span-1"><label className={STYLES.label}>Filial *</label><select className={STYLES.input} value={form.filial_id || ""} onChange={e => setForm({...form, filial_id: e.target.value})}><option value="">Selecione...</option>{filiais.map(f => <option key={f.id} value={f.id}>{f.codigo} - {f.nome_fantasia}</option>)}</select></div>
                        <div className="md:col-span-1"><label className={STYLES.label}>Solicitante *</label><input className={STYLES.input} placeholder="Quem pediu?" value={form.solicitante || ""} onChange={e => setForm({...form, solicitante: e.target.value})}/></div>
                        <div className="md:col-span-2"><label className={STYLES.label}>Fornecedor</label><select className={STYLES.input} value={form.fornecedor_id || ""} onChange={e => onFornecedorChange(e.target.value)}><option value="">Selecione...</option>{fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome_empresa}</option>)}</select></div>

                        <div className="md:col-span-4 h-[1px] bg-slate-100 my-2"></div>

                        {/* DADOS FINANCEIROS */}
                        <div className="md:col-span-1"><label className={STYLES.label}>CNPJ</label><input className={STYLES.input} value={form.cnpj || ""} onChange={e => setForm({...form, cnpj: e.target.value})}/></div>
                        <div className="md:col-span-1"><label className={STYLES.label}>Cond. Pagamento</label><input className={STYLES.input} placeholder="Ex: 30 dias" value={form.condicao_pagamento || ""} onChange={e => setForm({...form, condicao_pagamento: e.target.value})}/></div>
                        <div className="md:col-span-1"><label className={STYLES.label}>Valor R$</label><input type="number" className={STYLES.input} value={form.valor || ""} onChange={e => setForm({...form, valor: e.target.value})}/></div>
                        <div className="md:col-span-1"><label className={STYLES.label}>Vencimento (Previsto)</label><input type="date" className={STYLES.input} value={form.data_vencimento || ""} onChange={e => setForm({...form, data_vencimento: e.target.value})}/></div>

                        {/* DETALHES DO PEDIDO */}
                        <div className="md:col-span-4 bg-blue-50 p-4 rounded-xl border border-blue-100 grid grid-cols-4 gap-4">
                            <div className="col-span-4 text-[#1E22A8] font-black text-xs uppercase tracking-widest flex gap-2 items-center"><FileText size={14}/> Detalhes do Pedido</div>
                            <div className="col-span-1"><label className={STYLES.label}>Nº SC</label><input className={STYLES.input} value={form.numero_sc || ""} onChange={e => setForm({...form, numero_sc: e.target.value})}/></div>
                            <div className="col-span-1"><label className={STYLES.label}>Nº Pedido</label><input className={STYLES.input} value={form.numero_pedido || ""} onChange={e => setForm({...form, numero_pedido: e.target.value})}/></div>
                            <div className="col-span-1"><label className={STYLES.label}>Centro de Custo</label><input className={STYLES.input} value={form.centro_custo || ""} onChange={e => setForm({...form, centro_custo: e.target.value})}/></div>
                            <div className="col-span-1"><label className={STYLES.label}>Fluig</label><input className={STYLES.input} value={form.fluig_id || ""} onChange={e => setForm({...form, fluig_id: e.target.value})}/></div>
                            <div className="col-span-2"><label className={STYLES.label}>Serviço / Produto</label><input className={STYLES.input} value={form.servico || ""} onChange={e => setForm({...form, servico: e.target.value})}/></div>
                            <div className="col-span-2"><label className={STYLES.label}>Serviço (Protheus)</label><input className={STYLES.input} value={form.servico_protheus || ""} onChange={e => setForm({...form, servico_protheus: e.target.value})}/></div>
                        </div>

                        {/* CONTROLE */}
                        <div className="md:col-span-2"><label className={STYLES.label}>Nota Fiscal (Se houver)</label><input className={STYLES.input} value={form.numero_nota || ""} onChange={e => setForm({...form, numero_nota: e.target.value})}/></div>
                        <div className="md:col-span-2">
                            <label className={STYLES.label}>Status Atual</label>
                            <select className={STYLES.input} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                            {OPCOES_STATUS_COMPRA.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        
                        <div className="col-span-4"><label className={STYLES.label}>Observações</label><textarea className={`${STYLES.input} h-24 resize-none`} value={form.observacao || ""} onChange={e => setForm({...form, observacao: e.target.value})}/></div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-[#E30613]">Cancelar</button>
                    <button onClick={onSalvar} className="bg-[#1E22A8] text-white px-8 py-3 rounded-xl font-black shadow-lg hover:bg-blue-700 active:scale-95 transition-all">SALVAR SOLICITAÇÃO</button>
                </div>
            </div>
        </div>
    );
}
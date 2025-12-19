import React from 'react';
import { X, Plus, CheckCircle, Send, Server, Loader2 } from 'lucide-react';
import FileDrop from '@/components/ui/FileDrop';
import { STYLES, OPCOES_STATUS } from '@/utils/constants';

export default function ModalLancamento({
    isOpen,
    onClose,
    form,
    setForm,
    filiais,
    fornecedores,
    opcoesFornecedor,
    onFornecedorChange,
    onSalvar,
    onSalvarEEnviar,
    sendingEmail,
    addToast,
    isGopa
}) {
    if (!isOpen) return null;

    const nomeFornecedorAtual = fornecedores.find(f => f.id == form.fornecedor_id)?.nome_empresa || "";

    return (
        <div className="fixed inset-0 bg-[#1E22A8]/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/50">
                {/* HEADER */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-2xl font-black flex gap-3 text-[#1E22A8] items-center tracking-tight">
                        <div className="bg-[#1E22A8] p-2 rounded-xl text-white shadow-lg"><Plus size={24}/></div>
                        {form.id ? 'EDITAR LANÇAMENTO' : 'NOVO LANÇAMENTO'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-[#E30613] bg-white hover:bg-red-50 p-2 rounded-full transition-all shadow-sm"><X size={24}/></button>
                </div>

                {/* FORMULÁRIO SCROLLÁVEL */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        
                        {/* SELETORES PRINCIPAIS */}
                        <div className="md:col-span-1">
                            <label className={STYLES.label}>Filial</label>
                            <select className={STYLES.input} value={form.filial_id || ""} onChange={e => setForm({...form, filial_id: e.target.value})}>
                                <option>Selecione...</option>
                                {filiais.map(f => <option key={f.id} value={f.id}>{f.codigo} - {f.nome_fantasia}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className={STYLES.label}>Fornecedor</label>
                            <select className={STYLES.input} value={form.fornecedor_id || ""} onChange={e => onFornecedorChange(e.target.value)}>
                                <option>Selecione...</option>
                                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome_empresa}</option>)}
                            </select>
                        </div>

                        {/* AUTO-COMPLETES DO FORNECEDOR */}
                        <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="col-span-2">
                                <label className={STYLES.label}>Centro de Custo</label>
                                <select className={`${STYLES.input} !bg-white`} value={form.centro_custo_usado || ""} onChange={e => setForm({...form, centro_custo_usado: e.target.value})}>
                                    <option value="">Selecione...</option>
                                    {opcoesFornecedor.ccs.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={STYLES.label}>CNPJ</label>
                                <select className={`${STYLES.input} !bg-white text-xs`} value={form.cnpj_usado || ""} onChange={e => setForm({...form, cnpj_usado: e.target.value})}>
                                    <option value="">Selecione...</option>
                                    {opcoesFornecedor.cnpjs.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={STYLES.label}>Contrato</label>
                                <select className={`${STYLES.input} !bg-white text-xs`} value={form.contrato_usado || ""} onChange={e => setForm({...form, contrato_usado: e.target.value})}>
                                    <option value="">Selecione...</option>
                                    {opcoesFornecedor.contratos.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div className="col-span-4 h-[1px] bg-slate-100 rounded-full"></div>

                        {/* DADOS DA NOTA */}
                        <div><label className={STYLES.label}>Nº Nota *</label><input className={STYLES.input} value={form.numero_nota || ""} onChange={e => setForm({...form, numero_nota: e.target.value})}/></div>
                        <div><label className={STYLES.label}>Série</label><input className={STYLES.input} placeholder="U" value={form.serie || ""} onChange={e => setForm({...form, serie: e.target.value})}/></div>
                        <div><label className={STYLES.label}>Valor (R$) *</label><input type="number" className={STYLES.input} value={form.valor || ""} onChange={e => setForm({...form, valor: e.target.value})}/></div>
                        <div>
                            <label className={STYLES.label}>Status Inicial</label>
                            <select className={STYLES.input} value={form.status_pagamento || ""} onChange={e => setForm({...form, status_pagamento: e.target.value})}>
                                {OPCOES_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* LÓGICA DE REPETIÇÃO */}
                        {!form.id && (
                            <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
                                <label className={STYLES.label}>Repetir (Meses)</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" min="1" max="60" className={`${STYLES.input} !bg-white text-center`} value={form.repetir_por || 1} onChange={e => setForm({...form, repetir_por: e.target.value})} />
                                    <span className="text-xs font-bold text-blue-500 uppercase">Meses</span>
                                </div>
                            </div>
                        )}

                        <div><label className={STYLES.label}>Data Envio TI</label><input type="date" className={STYLES.input} value={form.data_envio || ''} onChange={e => setForm({...form, data_envio: e.target.value})}/></div>
                        <div><label className={STYLES.label}>Vencimento *</label><input type="date" className={STYLES.input} value={form.data_vencimento || ""} onChange={e => setForm({...form, data_vencimento: e.target.value})}/></div>
                        <div className="col-span-1"></div>
                        
                        {/* PAINEL DE CONTROLE INTERNO */}
                        <div className="col-span-4 bg-[#F9C531]/10 p-6 rounded-2xl border border-[#F9C531]/30 grid grid-cols-3 gap-6">
                            <div className="col-span-3 flex items-center gap-2 text-[#F77F00] mb-2"><Server size={18}/> <span className="text-xs font-black uppercase tracking-widest">Controle Interno</span></div>
                            
                            {!isGopa && (
                                <div><label className={STYLES.label}>Fluig</label><input className={STYLES.input} value={form.solicitacao_fluig || ""} onChange={e => setForm({...form, solicitacao_fluig: e.target.value})}/></div>
                            )}
                            
                            <div><label className={STYLES.label}>Pedido</label><input className={STYLES.input} value={form.numero_pedido || ""} onChange={e => setForm({...form, numero_pedido: e.target.value})}/></div>
                            <div><label className={STYLES.label}>Medição</label><input className={STYLES.input} value={form.numero_medicao || ""} onChange={e => setForm({...form, numero_medicao: e.target.value})}/></div>
                            
                            <div className="col-span-3 grid grid-cols-2 gap-6">
                                <div><label className={STYLES.label}>Descrição Serviço</label><input className={STYLES.input} value={form.descricao_servico || ""} onChange={e => setForm({...form, descricao_servico: e.target.value})}/></div>
                                <div><label className={STYLES.label}>Serviço Protheus</label><input className={STYLES.input} value={form.servico_protheus || ""} onChange={e => setForm({...form, servico_protheus: e.target.value})}/></div>
                            </div>
                        </div>

                        {/* UPLOADS */}
                        <div className="col-span-2"><FileDrop label="ANEXAR NOTA FISCAL" colorTheme="red" onFileSelect={path => setForm({...form, arquivo_nota: path})} existingFile={form.arquivo_nota} metaData={{fornecedor: nomeFornecedorAtual, nota: form.numero_nota, vencimento: form.data_vencimento}} addToast={addToast}/></div>
                        <div className="col-span-2"><FileDrop label="ANEXAR BOLETO" colorTheme="blue" onFileSelect={path => setForm({...form, arquivo_boleto: path})} existingFile={form.arquivo_boleto} metaData={{fornecedor: nomeFornecedorAtual, nota: form.numero_nota, vencimento: form.data_vencimento}} addToast={addToast}/></div>
                        
                        <div className="col-span-4"><label className={STYLES.label}>Observações</label><textarea className={`${STYLES.input} h-24 resize-none`} value={form.observacao || ""} onChange={e => setForm({...form, observacao: e.target.value})}/></div>
                    </div>
                </div>
                
                {/* FOOTER */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-4">
                    <button onClick={onClose} className="px-8 py-3 rounded-xl font-bold text-slate-400 hover:text-[#E30613] hover:bg-white transition-colors uppercase tracking-wider text-sm">Cancelar</button>
                    
                    <button onClick={onSalvar} className={`bg-[#1E22A8] hover:bg-[#2196F3] hover:scale-105 text-white font-black px-10 py-3 rounded-xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-3 uppercase tracking-wider text-sm`}><CheckCircle size={20}/> SALVAR</button>

                    {isGopa && (
                        <button onClick={onSalvarEEnviar} disabled={sendingEmail} className="bg-purple-600 hover:bg-purple-700 hover:scale-105 text-white font-black px-6 py-3 rounded-xl shadow-xl shadow-purple-500/20 transition-all active:scale-95 flex items-center gap-3 uppercase tracking-wider text-sm">
                            {sendingEmail ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>} SALVAR E ENVIAR
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
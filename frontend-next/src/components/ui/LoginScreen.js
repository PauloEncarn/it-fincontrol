import React, { useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Loader2, Lock, UserPlus, ArrowLeft, User } from 'lucide-react';
import { API_URL, STYLES } from '@/utils/constants';

// Estilo do Botão (Copiado das constantes para garantir funcionamento isolado)
const BTN_STYLE = "bg-[#1E22A8] hover:bg-[#E30613] text-white font-black px-6 py-3 rounded-xl shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider text-sm";

export default function LoginScreen({ onLogin, addToast }) {
  // Estado para alternar entre Login e Cadastro
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados do Formulário
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nome_completo: '', // Novo
    setor: '',         // Novo
    cargo: ''          // Novo
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => { 
      e.preventDefault(); 
      setLoading(true); 

      try { 
          if (isRegistering) {
            // --- MODO CADASTRO ---
            // Verifica campos obrigatórios
            if(!formData.username || !formData.password || !formData.nome_completo) {
                addToast('error', 'Preencha todos os campos obrigatórios.');
                setLoading(false);
                return;
            }

            // Envia para a API de criação de usuários
            // ATENÇÃO: Seu backend precisa permitir criar usuário sem estar logado (Public)
            await axios.post(`${API_URL}/usuarios`, formData);
            
            addToast('success', 'Conta criada! Faça login agora.');
            setIsRegistering(false); // Volta para tela de login
            setFormData({ ...formData, password: '' }); // Limpa senha
          } else {
            // --- MODO LOGIN ---
            const fd = new FormData(); 
            fd.append('username', formData.username); 
            fd.append('password', formData.password); 
            
            const res = await axios.post(`${API_URL}/token`, fd); 
            onLogin(res.data.access_token); 
          }
      } catch (error) { 
          console.error(error);
          const msg = error.response?.data?.detail || error.response?.data?.error || 'Erro na operação.';
          addToast('error', isRegistering ? 'Erro ao criar conta: ' + msg : 'Credenciais inválidas.'); 
      } finally { 
          setLoading(false); 
      } 
  };

  return (
    <div className="min-h-screen bg-[#1E22A8] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Detalhe visual de fundo */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[#E30613]"></div>
      <div className="absolute -bottom-20 -right-20 text-white/5 pointer-events-none">
         <UserPlus size={400} />
      </div>

      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-sm border-t-4 border-t-[#E30613] relative z-10 animate-in zoom-in-95 duration-300">
        
        {/* LOGO */}
        <div className="flex justify-center mb-6">
            <Image src="/logo-cicopal.png" alt="Cicopal" width={200} height={80} className="h-14 w-auto object-contain" priority onError={(e) => e.target.style.display = 'none'} />
        </div>
        
        <h1 className="text-xl font-bold text-center text-slate-700 mb-6 tracking-tight uppercase">
            {isRegistering ? 'CRIAR NOVA CONTA' : <span>GESTÃO DE NOTAS <span className="text-[#1E22A8]">TI</span></span>}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* CAMPOS EXTRAS (SÓ NO CADASTRO) */}
          {isRegistering && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
                <div>
                    <label className={STYLES.label}>Nome Completo *</label>
                    <input className={STYLES.input} name="nome_completo" value={formData.nome_completo} onChange={handleChange} placeholder="Seu nome..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={STYLES.label}>Setor</label>
                        <input className={STYLES.input} name="setor" value={formData.setor} onChange={handleChange} placeholder="Ex: TI" />
                    </div>
                    <div>
                        <label className={STYLES.label}>Cargo</label>
                        <input className={STYLES.input} name="cargo" value={formData.cargo} onChange={handleChange} placeholder="Ex: Analista" />
                    </div>
                </div>
            </div>
          )}

          {/* CAMPOS PADRÃO (LOGIN E CADASTRO) */}
          <div>
              <label className={STYLES.label}>Usuário (Login) *</label>
              <input className={STYLES.input} name="username" value={formData.username} onChange={handleChange} autoFocus={!isRegistering} placeholder="Seu usuário de rede" />
          </div>
          <div>
              <label className={STYLES.label}>Senha *</label>
              <input type="password" className={STYLES.input} name="password" value={formData.password} onChange={handleChange} placeholder="********" />
          </div>

          {/* BOTÃO DE AÇÃO */}
          <button type="submit" className={`w-full ${BTN_STYLE} mt-2`} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18}/> : (isRegistering ? <UserPlus size={18}/> : <Lock size={18}/>)} 
              {isRegistering ? 'CADASTRAR' : 'ACESSAR'}
          </button>
        </form>

        {/* LINK PARA ALTERNAR MODO */}
        <div className="mt-6 text-center pt-6 border-t border-slate-100">
            {isRegistering ? (
                <button onClick={() => setIsRegistering(false)} className="text-sm text-slate-500 hover:text-[#1E22A8] font-bold flex items-center justify-center gap-2 w-full transition-colors">
                    <ArrowLeft size={16}/> Voltar para Login
                </button>
            ) : (
                <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-medium">Ainda não tem acesso?</p>
                    <button onClick={() => setIsRegistering(true)} className="text-sm text-[#1E22A8] hover:text-[#E30613] font-black uppercase tracking-wide transition-colors">
                        CRIAR MINHA CONTA
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}
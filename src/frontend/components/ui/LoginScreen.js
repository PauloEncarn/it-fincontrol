import React, { useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Loader2, Lock, UserPlus, ArrowLeft } from 'lucide-react';
import { API_URL, STYLES } from '@/frontend/utils/constants';

const BTN_STYLE = "bg-[#1E22A8] hover:bg-[#E30613] text-white font-black px-6 py-3 rounded-xl shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider text-sm";

export default function LoginScreen({ onLogin, addToast }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nome_completo: '', 
    setor: '',         
    cargo: ''          
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
            if(!formData.username || !formData.password || !formData.nome_completo) {
                addToast('error', 'Preencha todos os campos obrigatórios.');
                setLoading(false);
                return;
            }

            await axios.post(`${API_URL}/usuarios`, formData);
            
            // Mensagem amigável de sucesso
            addToast('success', 'Cadastro realizado! Aguarde aprovação do administrador.');
            setIsRegistering(false); 
            setFormData({ ...formData, password: '' });
            
          } else {
            // --- MODO LOGIN ---
            const fd = new FormData(); 
            fd.append('username', formData.username); 
            fd.append('password', formData.password); 
            
            const res = await axios.post(`${API_URL}/token`, fd); 
            onLogin(res.data.access_token); 
          }

      } catch (error) { 
          console.error("🔥 ERRO COMPLETO:", error);
          
          // Tenta extrair a mensagem de várias formas possíveis
          let mensagemErro = 'Erro desconhecido ao tentar acessar.';

          if (error.response) {
              // O servidor respondeu, mas com erro (401, 403, 500)
              console.log("📦 Dados do servidor:", error.response.data);
              
              if (error.response.data?.error) {
                  mensagemErro = error.response.data.error;
              } else if (error.response.data?.message) {
                  mensagemErro = error.response.data.message;
              } else if (typeof error.response.data === 'string') {
                  mensagemErro = error.response.data; // Às vezes vem como texto puro
              }
          } else if (error.request) {
              // O servidor nem respondeu (Servidor desligado ou sem internet)
              mensagemErro = 'Sem conexão com o servidor.';
          } else {
              // Erro na montagem da requisição
              mensagemErro = error.message;
          }

          // Exibe o Toast com a mensagem final processada
          addToast('error', mensagemErro);

      } finally { 
          setLoading(false); 
      }



  };

  return (
    <div className="min-h-screen bg-[#1E22A8] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-[#E30613]"></div>
      <div className="absolute -bottom-20 -right-20 text-white/5 pointer-events-none">
         <UserPlus size={400} />
      </div>

      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-sm border-t-4 border-t-[#E30613] relative z-10 animate-in zoom-in-95 duration-300">
        
        <div className="flex justify-center mb-6">
            <Image src="/logo-cicopal.png" alt="Cicopal" width={200} height={80} className="h-14 w-auto object-contain" priority onError={(e) => e.target.style.display = 'none'} />
        </div>
        
        <h1 className="text-xl font-bold text-center text-slate-700 mb-6 tracking-tight uppercase">
            {isRegistering ? 'CRIAR NOVA CONTA' : <span>GESTÃO DE NOTAS <span className="text-[#1E22A8]">TI</span></span>}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          
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

          <div>
              <label className={STYLES.label}>Usuário (Login) *</label>
              <input className={STYLES.input} name="username" value={formData.username} onChange={handleChange} autoFocus={!isRegistering} placeholder="Seu usuário de rede" />
          </div>
          <div>
              <label className={STYLES.label}>Senha *</label>
              <input type="password" className={STYLES.input} name="password" value={formData.password} onChange={handleChange} placeholder="********" />
          </div>

          <button type="submit" className={`w-full ${BTN_STYLE} mt-2`} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18}/> : (isRegistering ? <UserPlus size={18}/> : <Lock size={18}/>)} 
              {isRegistering ? 'CADASTRAR' : 'ACESSAR'}
          </button>
        </form>

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
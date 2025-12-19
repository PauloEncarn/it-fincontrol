import React, { useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Loader2, Lock } from 'lucide-react';
import { API_URL, STYLES, BUTTON_PRIMARY } from '@/utils/constants';

// Nota: Adapte BUTTON_PRIMARY se você não exportou ele no constants.js, ou use a string direta.
const BTN_STYLE = "bg-[#1E22A8] hover:bg-[#E30613] text-white font-black px-6 py-3 rounded-xl shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider text-sm";

export default function LoginScreen({ onLogin, addToast }) {
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => { 
      e.preventDefault(); 
      setLoading(true); 
      const fd = new FormData(); 
      fd.append('username', username); 
      fd.append('password', password); 
      try { 
          const res = await axios.post(`${API_URL}/token`, fd); 
          onLogin(res.data.access_token); 
      } catch { 
          addToast('error', 'Credenciais inválidas'); 
      } finally { 
          setLoading(false); 
      } 
  };

  return (
    <div className="min-h-screen bg-[#1E22A8] flex items-center justify-center p-4 relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-[#E30613]"></div>
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-sm border-t-4 border-t-[#E30613]">
        <div className="flex justify-center mb-8">
            <Image src="/logo-cicopal.png" alt="Cicopal" width={200} height={80} className="h-16 w-auto object-contain" priority onError={(e) => e.target.style.display = 'none'} />
        </div>
        <h1 className="text-xl font-bold text-center text-slate-700 mb-8 tracking-tight uppercase">GESTÃO DE NOTAS <span className="text-[#1E22A8]">TI</span></h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Usuário</label>
              <input className={STYLES.input} value={username} onChange={e => setUsername(e.target.value)} autoFocus/>
          </div>
          <div className="text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Senha</label>
              <input type="password" className={STYLES.input} value={password} onChange={e => setPassword(e.target.value)}/>
          </div>
          <button type="submit" className={`w-full ${BTN_STYLE}`} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18}/> : <Lock size={18}/>} ACESSAR
          </button>
        </form>
      </div>
    </div>
  );
}
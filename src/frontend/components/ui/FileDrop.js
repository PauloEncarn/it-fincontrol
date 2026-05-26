import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle } from 'lucide-react';
import { API_URL, STYLES } from '@/frontend/utils/constants';

export default function FileDrop({ label, onFileSelect, existingFile, metaData, addToast }) {
  const [localFile, setLocalFile] = useState(null);
  const displayFileName = localFile ? localFile.name : (existingFile ? existingFile.split('/').pop() : null);

  const handleFile = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!metaData.fornecedor || !metaData.nota) return addToast('error', "Selecione Fornecedor e Nota antes.");
    setLocalFile(file); 
    const fd = new FormData(); 
    fd.append("file", file); 
    fd.append("fornecedor", metaData.fornecedor); 
    fd.append("nota", metaData.nota); 
    fd.append("vencimento", metaData.vencimento || "S_D");
    
    try { 
        const res = await axios.post(`${API_URL}/upload/`, fd); 
        onFileSelect(res.data.path); 
        addToast('success', 'Arquivo anexado!'); 
    } catch { 
        addToast('error', "Erro no upload"); 
        setLocalFile(null); 
    }
  };

  const theme = displayFileName ? 'border-[#1E22A8] text-[#1E22A8] bg-blue-50' : 'border-slate-300 text-slate-400 bg-slate-50';
  
  return (
    <div className="w-full">
        <label className={STYLES.label}>{label}</label>
        <div className={`relative border-2 border-dashed rounded-xl p-2 hover:bg-white transition-all text-center cursor-pointer group h-[80px] flex flex-col items-center justify-center ${theme}`}>
            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFile} accept=".pdf,.png,.jpg"/>
            <div className="flex flex-col items-center justify-center gap-1">
                {displayFileName ? <CheckCircle size={24}/> : <UploadCloud size={24}/>}
                <span className="text-[10px] font-bold uppercase truncate max-w-[180px]">{displayFileName || "Arrastar Arquivo"}</span>
            </div>
        </div>
    </div>
  );
}
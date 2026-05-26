import React, { useState } from 'react';
import axios from 'axios';
import { Box, Stack, Typography } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { API_URL } from '@/frontend/utils/constants';

export default function FileDrop({ label, onFileSelect, existingFile, metaData, addToast }) {
  const [localFile, setLocalFile] = useState(null);
  const displayFileName = localFile ? localFile.name : (existingFile ? existingFile.split('/').pop() : null);

  const handleFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!metaData.fornecedor || !metaData.nota) return addToast('error', 'Selecione fornecedor e nota antes.');

    setLocalFile(file);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('fornecedor', metaData.fornecedor);
    fd.append('nota', metaData.nota);
    fd.append('vencimento', metaData.vencimento || 'S_D');

    try {
      const res = await axios.post(`${API_URL}/upload/`, fd);
      onFileSelect(res.data.path);
      addToast('success', 'Arquivo anexado!');
    } catch {
      addToast('error', 'Erro no upload');
      setLocalFile(null);
    }
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ display: 'block', mb: 0.75, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Box
        component="label"
        sx={{
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          minHeight: 92,
          px: 2,
          border: '1px dashed',
          borderColor: displayFileName ? 'primary.main' : 'divider',
          bgcolor: displayFileName ? 'rgba(0, 120, 212, 0.06)' : 'background.default',
          color: displayFileName ? 'primary.main' : 'text.secondary',
          cursor: 'pointer',
          transition: 'border-color 160ms ease, background-color 160ms ease',
          '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(0, 120, 212, 0.08)' },
        }}
      >
        <input type="file" hidden onChange={handleFile} accept=".pdf,.png,.jpg" />
        <Stack alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
          {displayFileName ? <CheckCircleOutlinedIcon /> : <CloudUploadOutlinedIcon />}
          <Typography variant="caption" fontWeight={800} noWrap sx={{ maxWidth: 240 }}>
            {displayFileName || 'Selecionar arquivo'}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

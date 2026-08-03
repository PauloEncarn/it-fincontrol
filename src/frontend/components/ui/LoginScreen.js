import React, { useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import { API_URL } from '@/frontend/utils/constants';

const initialFormData = {
  username: '',
  password: '',
  nome_completo: '',
  setor: '',
  cargo: '',
};

export default function LoginScreen({ onLogin, addToast }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        if (!formData.username || !formData.password || !formData.nome_completo) {
          addToast('error', 'Preencha todos os campos obrigatórios.');
          setLoading(false);
          return;
        }

        await axios.post(`${API_URL}/usuarios`, formData);
        addToast('success', 'Cadastro realizado! Aguarde aprovação do administrador.');
        setIsRegistering(false);
        setFormData({ ...formData, password: '' });
      } else {
        const fd = new FormData();
        fd.append('username', formData.username);
        fd.append('password', formData.password);

        const res = await axios.post(`${API_URL}/token`, fd);
        onLogin(res.data.access_token, remember);
      }
    } catch (error) {
      let mensagemErro = 'Erro desconhecido ao tentar acessar.';

      if (error.response) {
        if (error.response.data?.error) {
          mensagemErro = error.response.data.error;
        } else if (error.response.data?.message) {
          mensagemErro = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          mensagemErro = error.response.data;
        }
      } else if (error.request) {
        mensagemErro = 'Sem conexão com o servidor.';
      } else {
        mensagemErro = error.message;
      }

      addToast('error', mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: '#f3f2f1',
        px: 2,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          maxWidth: 420,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ height: 4, bgcolor: 'primary.main' }} />

        <Box sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Stack spacing={1.5} alignItems="center">
              <Image src="/logo-cicopal.png" alt="Cicopal" width={188} height={64} priority style={{ height: 52, width: 'auto', objectFit: 'contain' }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">
                  {isRegistering ? 'Criar nova conta' : 'Gestão de Notas TI'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ambiente interno Cicopal
                </Typography>
              </Box>
            </Stack>

            {isRegistering && (
              <Alert severity="info" variant="outlined">
                O acesso fica pendente até aprovação de um administrador.
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                {isRegistering && (
                  <>
                    <TextField
                      label="Nome completo"
                      name="nome_completo"
                      value={formData.nome_completo}
                      onChange={handleChange}
                      required
                      fullWidth
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField label="Setor" name="setor" value={formData.setor} onChange={handleChange} fullWidth />
                      <TextField label="Cargo" name="cargo" value={formData.cargo} onChange={handleChange} fullWidth />
                    </Stack>
                  </>
                )}

                <TextField
                  label="Usuário"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  autoFocus={!isRegistering}
                  autoComplete="username"
                  required
                  fullWidth
                />
                <TextField
                  label="Senha"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type="password"
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  required
                  fullWidth
                />

                {!isRegistering && (
                  <FormControlLabel
                    control={<Checkbox checked={remember} onChange={(event) => setRemember(event.target.checked)} />}
                    label="Manter conectado neste navegador"
                  />
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress color="inherit" size={18} /> : (isRegistering ? <PersonAddAltOutlinedIcon /> : <LockOutlinedIcon />)}
                >
                  {isRegistering ? 'Cadastrar' : 'Acessar'}
                </Button>
              </Stack>
            </Box>

            <Divider />

            <Box sx={{ textAlign: 'center' }}>
              {isRegistering ? (
                <Button startIcon={<ArrowBackIcon />} onClick={() => setIsRegistering(false)} color="inherit">
                  Voltar para login
                </Button>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Ainda não tem acesso?{' '}
                  <Link component="button" type="button" onClick={() => setIsRegistering(true)} underline="hover">
                    Criar minha conta
                  </Link>
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

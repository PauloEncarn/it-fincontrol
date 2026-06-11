import React from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AppsIcon from '@mui/icons-material/Apps';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';

export default function Header({
  currentView,
  onOpenMenu,
  termoBusca,
  setTermoBusca,
  onNovoLancamento,
  onNovaSolicitacao,
  onRefresh,
}) {
  const getInfos = () => {
    switch (currentView) {
      case 'dashboard': return { titulo: 'Página inicial', sub: 'Visão consolidada' };
      case 'notas': return { titulo: 'Notas fiscais', sub: 'Gestão operacional' };
      case 'contratos': return { titulo: 'Contratos recorrentes', sub: 'Geradores de notas mensais' };
      case 'solicitacoes': return { titulo: 'Solicitações de compra', sub: 'Acompanhamento de pedidos' };
      case 'fornecedores': return { titulo: 'Fornecedores', sub: 'Base de cadastro' };
      case 'filiais': return { titulo: 'Filiais', sub: 'Unidades' };
      case 'usuarios': return { titulo: 'Usuários', sub: 'Controle de acesso' };
      default: return { titulo: 'Gestão TI', sub: 'Sistema interno' };
    }
  };

  const getAction = () => {
    if (currentView === 'notas') return { label: 'Novo lançamento', action: onNovoLancamento };
    if (currentView === 'solicitacoes') return { label: 'Nova solicitação', action: onNovaSolicitacao };
    return null;
  };

  const info = getInfos();
  const actionButton = getAction();
  const showSearch = currentView === 'notas' || currentView === 'solicitacoes';

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ minHeight: 56, gap: 1.5, px: { xs: 1.5, md: 2 } }}>
        <Tooltip title="Abrir navegação">
          <IconButton onClick={onOpenMenu} edge="start" sx={{ display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
        </Tooltip>

        <Box
          sx={{
            width: 32,
            height: 32,
            display: { xs: 'none', md: 'grid' },
            placeItems: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <AppsIcon fontSize="small" />
        </Box>

        <Box sx={{ minWidth: 0, flex: { xs: 1, md: '0 0 auto' } }}>
          <Typography variant="h6" noWrap sx={{ fontSize: 18, color: 'text.primary' }}>
            {info.titulo}
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
            {info.sub}
          </Typography>
        </Box>

        <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />

        {showSearch && (
          <TextField
            value={termoBusca}
            onChange={(event) => setTermoBusca(event.target.value)}
            placeholder="Pesquisar nesta lista"
            sx={{ width: { xs: 1, md: 340 }, display: { xs: 'none', sm: 'block' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        )}

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Atualizar dados">
            <IconButton onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {actionButton && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={actionButton.action}
              sx={{ whiteSpace: 'nowrap', display: { xs: 'none', sm: 'inline-flex' } }}
            >
              {actionButton.label}
            </Button>
          )}

          <Tooltip title="Notificações">
            <IconButton>
              <Badge color="error" variant="dot">
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark', fontSize: 13 }}>TI</Avatar>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

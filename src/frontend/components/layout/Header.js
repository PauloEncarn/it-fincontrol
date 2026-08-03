import React, { useMemo, useState } from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AppsIcon from '@mui/icons-material/Apps';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function Header({
  currentView,
  onOpenMenu,
  termoBusca,
  setTermoBusca,
  onNovoLancamento,
  onNovaSolicitacao,
  onRefresh,
  notificacoes = [],
  onNotificationClick,
  usuarioLogado,
}) {
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const notificationItems = Array.isArray(notificacoes) ? notificacoes : [];

  const getInfos = () => {
    switch (currentView) {
      case 'dashboard': return { titulo: 'Página inicial', sub: 'Visão consolidada' };
      case 'notas': return { titulo: 'Notas fiscais', sub: 'Gestão operacional' };
      case 'pendencias': return { titulo: 'Pendencias', sub: 'Fechamento mensal' };
      case 'contratos': return { titulo: 'Contratos', sub: 'Recorrentes e avulsos por fornecedor' };
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
  const unreadCount = notificationItems.length;
  const openNotifications = Boolean(notificationAnchor);
  const resumoNotificacoes = useMemo(() => ({
    criticas: notificationItems.filter((item) => item.severity === 'error').length,
    atencao: notificationItems.filter((item) => item.severity === 'warning').length,
  }), [notificationItems]);
  const nomeUsuario = usuarioLogado?.nome || usuarioLogado?.username || 'Usuario';
  const usernameUsuario = usuarioLogado?.username || '';
  const iniciaisUsuario = String(nomeUsuario)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase() || 'TI';

  const getNotificationIcon = (severity) => {
    if (severity === 'error') return <ErrorOutlineIcon color="error" fontSize="small" />;
    if (severity === 'warning') return <WarningAmberIcon color="warning" fontSize="small" />;
    if (severity === 'success') return <CheckCircleIcon color="success" fontSize="small" />;
    return <InfoOutlinedIcon color="info" fontSize="small" />;
  };

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
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
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
            <IconButton onClick={(event) => setNotificationAnchor(event.currentTarget)}>
              <Badge color="error" badgeContent={unreadCount} max={99} invisible={unreadCount === 0}>
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Popover
            open={openNotifications}
            anchorEl={notificationAnchor}
            onClose={() => setNotificationAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { width: 380, maxWidth: 'calc(100vw - 24px)', mt: 1 } }}
          >
            <Box sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={900}>
                    Notificações
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ações pontuais e retornos recentes
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.75}>
                  {resumoNotificacoes.criticas > 0 && <Chip size="small" color="error" label={resumoNotificacoes.criticas} />}
                  {resumoNotificacoes.atencao > 0 && <Chip size="small" color="warning" label={resumoNotificacoes.atencao} />}
                </Stack>
              </Stack>
            </Box>
            <Divider />
            {unreadCount === 0 ? (
              <Box sx={{ p: 2.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Nenhuma ação pendente no momento.
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding sx={{ maxHeight: 420, overflowY: 'auto' }}>
                {notificationItems.map((notificacao) => (
                  <ListItemButton
                    key={notificacao.key || `${notificacao.id}-${notificacao.title}`}
                    onClick={() => {
                      setNotificationAnchor(null);
                      onNotificationClick?.(notificacao);
                    }}
                    sx={{ alignItems: 'flex-start', gap: 1, py: 1.25 }}
                  >
                    <Box sx={{ pt: 0.35 }}>{getNotificationIcon(notificacao.severity)}</Box>
                    <ListItemText
                      primary={notificacao.title}
                      secondary={notificacao.description}
                      slotProps={{
                        primary: { fontWeight: 800, variant: 'body2' },
                        secondary: { variant: 'caption' },
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Popover>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ minWidth: 0, maxWidth: { xs: 38, sm: 220 } }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark', fontSize: 12, flex: '0 0 auto' }}>
              {iniciaisUsuario}
            </Avatar>
            <Box sx={{ minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" fontWeight={800} noWrap title={nomeUsuario}>
                {nomeUsuario}
              </Typography>
              {usernameUsuario && (
                <Typography variant="caption" color="text.secondary" noWrap title={usernameUsuario} sx={{ display: 'block', lineHeight: 1 }}>
                  {usernameUsuario}
                </Typography>
              )}
            </Box>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

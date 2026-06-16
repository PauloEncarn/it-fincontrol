import React from 'react';
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';

const drawerWidth = 248;

const menuItems = [
  { id: 'dashboard', label: 'Página inicial', icon: <DashboardOutlinedIcon /> },
  { id: 'notas', label: 'Notas fiscais', icon: <DescriptionOutlinedIcon /> },
  { id: 'contratos', label: 'Contratos', icon: <CalendarMonthOutlinedIcon /> },
  { id: 'subcontratos', label: 'Subcontratos', icon: <PlaylistAddCheckOutlinedIcon /> },
  { id: 'solicitacoes', label: 'Solicitações', icon: <ShoppingCartOutlinedIcon /> },
  { id: 'fornecedores', label: 'Fornecedores', icon: <GroupOutlinedIcon /> },
  { id: 'filiais', label: 'Filiais', icon: <ApartmentOutlinedIcon /> },
  { id: 'usuarios', label: 'Usuários', icon: <AccountCircleOutlinedIcon /> },
];

function DrawerContent({ currentView, setActiveView, onClose, onLogout }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2, minHeight: 56 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            IT FinControl
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Cicopal
          </Typography>
        </Box>
      </Toolbar>

      <Divider />

      <List sx={{ px: 1, py: 1, flex: 1 }}>
        {menuItems.map((item) => {
          const selected = currentView === item.id;

          return (
            <ListItemButton
              key={item.id}
              selected={selected}
              onClick={() => {
                setActiveView(item.id);
                onClose?.();
              }}
              sx={{
                minHeight: 40,
                mb: 0.25,
                borderRadius: 0.5,
                borderLeft: '3px solid',
                borderLeftColor: selected ? 'primary.main' : 'transparent',
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                },
                '&.Mui-selected:hover': {
                  bgcolor: 'primary.light',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: selected ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: 14, fontWeight: selected ? 600 : 400 }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      <Box sx={{ p: 1 }}>
        <ListItemButton onClick={onLogout} sx={{ borderRadius: 0.5, color: 'error.main' }}>
          <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
            <LogoutOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Sair" primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
        </ListItemButton>
      </Box>
    </Box>
  );
}

export default function Sidebar({ currentView, setActiveView, onLogout, isOpen, onClose }) {
  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRightColor: 'divider',
          },
        }}
        open
      >
        <DrawerContent currentView={currentView} setActiveView={setActiveView} onLogout={onLogout} />
      </Drawer>

      <Drawer
        variant="temporary"
        open={isOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <DrawerContent currentView={currentView} setActiveView={setActiveView} onClose={onClose} onLogout={onLogout} />
      </Drawer>
    </>
  );
}

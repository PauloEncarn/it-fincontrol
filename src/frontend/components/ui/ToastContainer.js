import React from 'react';
import { Alert, IconButton, Snackbar, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <Stack sx={{ position: 'fixed', top: 88, right: 16, zIndex: 1800, width: { xs: 'calc(100vw - 32px)', sm: 360 } }} spacing={1}>
      {toasts.map((toast) => (
        <Snackbar key={toast.id} open anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert
            severity={toast.type === 'error' ? 'error' : toast.type === 'info' ? 'info' : 'success'}
            variant="filled"
            action={
              <IconButton size="small" color="inherit" onClick={() => removeToast(toast.id)} aria-label="Fechar aviso">
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            sx={{ width: '100%', boxShadow: 3 }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
}

import { createTheme } from '@mui/material/styles';

export const sharepointTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0078d4',
      dark: '#005a9e',
      light: '#deecf9',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6264a7',
    },
    error: {
      main: '#a4262c',
    },
    warning: {
      main: '#ffb900',
    },
    success: {
      main: '#107c10',
    },
    background: {
      default: '#f3f2f1',
      paper: '#ffffff',
    },
    text: {
      primary: '#201f1e',
      secondary: '#605e5c',
    },
    divider: '#edebe9',
  },
  typography: {
    fontFamily: '"Segoe UI", Arial, sans-serif',
    h5: {
      fontWeight: 600,
      letterSpacing: 0,
    },
    h6: {
      fontWeight: 600,
      letterSpacing: 0,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 2,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          backgroundColor: '#ffffff',
        },
      },
    },
  },
});

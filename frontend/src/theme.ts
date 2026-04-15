import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a1a1a', // Claude-like dark gray
      light: '#f0f0f0',
      dark: '#000000',
    },
    secondary: {
      main: '#5865f2', // Discord-inspired purple-blue (similar to Claude)
      light: '#7986ff',
    },
    success: {
      main: '#10b981', // Tailwind emerald green
      light: '#6ee7b7',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
    },
    background: {
      default: '#ffffff', // Clean white
      paper: '#f9fafb', // Soft gray background
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: '"Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      letterSpacing: '-0.3px',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '-0.2px',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#1f2937',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#6b7280',
    },
  },
  shape: {
    borderRadius: 8, // Subtle, minimal rounded corners
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderBottom: '1px solid #e5e7eb',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          boxShadow: 'none',
          border: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          backgroundColor: '#5865f2',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#4752d4',
          },
        },
        outlined: {
          borderColor: '#e5e7eb',
          color: '#1f2937',
          '&:hover': {
            backgroundColor: '#f9fafb',
            borderColor: '#d1d5db',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          border: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
        },
        elevation0: {
          boxShadow: 'none',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f3f4f6',
          '& .MuiTableCell-root': {
            fontWeight: 600,
            color: '#1f2937',
            borderBottom: '2px solid #e5e7eb',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f9fafb',
          },
          '&.Mui-selected': {
            backgroundColor: '#f3f4f6',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          height: '28px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#e5e7eb',
            },
            '&:hover fieldset': {
              borderColor: '#d1d5db',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#5865f2',
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          border: '1px solid',
        },
      },
    },
  },
});

export default theme;
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { shadows } from './shadows';

const headingFontFamily =
  '"Montserrat", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const bodyFontFamily =
  '"Open Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#009966',
      light: '#D1FAE4',
      dark: '#004F3B',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#46546C',
      light: '#F1F5F9',
      dark: '#0E172B',
      contrastText: '#ffffff',
    },
    background: {
      default: 'oklch(98.4% 0.003 247.839)',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
  },
  typography: {
    fontFamily: bodyFontFamily,
    h1: {
      fontFamily: headingFontFamily,
      fontSize: 36,
      fontWeight: 700,
      lineHeight: 1.5,
    },
    h2: {
      fontFamily: headingFontFamily,
      fontSize: 32,
      fontWeight: 700,
      lineHeight: 1.5,
    },
    h3: {
      fontFamily: headingFontFamily,
      fontSize: 28,
      fontWeight: 700,
      lineHeight: 1.5,
    },
    h4: {
      fontFamily: headingFontFamily,
      fontSize: 24,
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h5: {
      fontFamily: headingFontFamily,
      fontSize: 20,
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontFamily: headingFontFamily,
      fontSize: 18,
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontFamily: bodyFontFamily,
      fontWeight: 500,
    },
    subtitle2: {
      fontFamily: bodyFontFamily,
      fontWeight: 600,
    },
    body1: {
      fontFamily: bodyFontFamily,
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontFamily: bodyFontFamily,
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontFamily: bodyFontFamily,
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
          minWidth: 150,
        },
      },
    },
    MuiAutocomplete: {
      defaultProps: {
        slotProps: {
          paper: {
            elevation: 2,
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          fontFamily: bodyFontFamily,
        },
        body: {
          backgroundColor: '#f8fafc',
          color: '#0f172a',
          margin: 0,
          fontFamily: bodyFontFamily,
        },
        '*, *::before, *::after': {
          boxSizing: 'border-box',
        },
      },
    },
  },
};

const theme = createTheme(themeOptions);
theme.shadows = shadows(theme);

export default theme;

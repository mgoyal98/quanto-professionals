import React from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { HashRouter } from 'react-router';
import App from './App';
import theme from './theme/theme';
import './index.css';
import { CompanyProvider } from './providers/company';

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <CompanyProvider>
          <App />
        </CompanyProvider>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
);

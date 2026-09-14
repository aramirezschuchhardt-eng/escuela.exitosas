import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { StoreProvider } from './data/store';
import { ToastProvider } from './components/ui';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/*
      HashRouter: la app se sirve como archivos estáticos (GitHub Pages, Netlify,
      S3...) sin necesidad de configurar reescrituras en el servidor.
    */}
    <HashRouter>
      <StoreProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </StoreProvider>
    </HashRouter>
  </StrictMode>,
);

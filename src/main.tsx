import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { SettingsProvider } from './state/settings';
import './index.css';

registerSW({ immediate: true });

// A single HTML file opened from disk has no server to resolve /lesson/x paths, so it routes on the #hash.
const Router = import.meta.env.VITE_SINGLE ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </Router>
  </StrictMode>,
);

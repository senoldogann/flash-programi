import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { retireLegacyPwa } from './app/legacy-pwa';

void retireLegacyPwa();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Flash Nick Hazırlayıcı başlatılamadı: ana uygulama alanı bulunamadı.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

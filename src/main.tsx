import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safeguard window.fetch against setter errors in strict mode / sandboxed environments
try {
  const origFetch = window.fetch;
  if (origFetch) {
    try {
      Object.defineProperty(window, 'fetch', {
        value: origFetch,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } catch {
      let _f = origFetch;
      Object.defineProperty(window, 'fetch', {
        get: () => _f,
        set: (v) => { _f = v; },
        configurable: true,
        enumerable: true,
      });
    }
  }
} catch {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

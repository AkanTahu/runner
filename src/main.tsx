import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against cross-origin iframe security errors (e.g. devtools/perf tracks inspecting window.parent)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event?.message || (typeof event === 'string' ? event : '');
    if (
      msg.includes('$$typeof') ||
      msg.includes('cross-origin frame') ||
      msg.includes('SecurityError') ||
      msg.includes('Blocked a frame')
    ) {
      event.preventDefault?.();
      event.stopImmediatePropagation?.();
      console.warn('Prevented cross-origin frame SecurityError:', msg);
      return true;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event?.reason?.message || String(event?.reason || '');
    if (
      reasonMsg.includes('$$typeof') ||
      reasonMsg.includes('cross-origin frame') ||
      reasonMsg.includes('SecurityError') ||
      reasonMsg.includes('Blocked a frame')
    ) {
      event.preventDefault?.();
      event.stopImmediatePropagation?.();
      console.warn('Prevented unhandled cross-origin frame rejection:', reasonMsg);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

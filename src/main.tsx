import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Chakra UI removido
import App from './App.tsx';
import './index.css';

// Tema Chakra UI removido

const rootElement = document.getElementById('root');
const root = createRoot(rootElement!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

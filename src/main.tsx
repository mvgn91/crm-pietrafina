import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import App from './App.tsx';
import './index.css';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#fff5f5',
      100: '#ffe3e3',
      200: '#ffbdbd',
      300: '#ff9b9b',
      400: '#f86a6a',
      500: '#ef3b3b', // Rojo principal
      600: '#e12d39',
      700: '#cf1124',
      800: '#ab091e',
      900: '#8a041a',
    },
    black: '#111',
    gray: {
      50: '#f9f9f9',
      100: '#f0f0f0',
      200: '#e0e0e0',
      300: '#c2c2c2',
      400: '#a3a3a3',
      500: '#858585',
      600: '#666',
      700: '#4d4d4d',
      800: '#333',
      900: '#1a1a1a',
    },
    white: '#fff',
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'black',
      },
    },
  },
});

const rootElement = document.getElementById('root');
const root = createRoot(rootElement!);

root.render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import ErrorBoundary from './renderer/components/ErrorBoundary.jsx';
import StartupHealthGate from './renderer/components/StartupHealthGate.jsx';
import { queryClient } from './renderer/lib/queryClient.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <StartupHealthGate>
          <App />
        </StartupHealthGate>
      </ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>
);

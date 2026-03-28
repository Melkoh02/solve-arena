import React, { createContext, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './pages/App';
import rootStore from './lib/stores/rootStore.ts';

export const StoreContext = createContext(rootStore);

// Expose stores for dev testing (e.g. simulate disconnect via console)
if (import.meta.env.DEV) {
  (window as any).__stores = rootStore;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreContext.Provider value={rootStore}>
      <App />
    </StoreContext.Provider>
  </StrictMode>,
);

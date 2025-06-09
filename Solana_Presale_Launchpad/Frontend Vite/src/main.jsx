import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import WalletContextProvider from './components/WalletContextProvider';
import { PresaleProvider } from './components/presale/PresaleProvider';

// require('@solana/wallet-adapter-react-ui/styles.css');
import '@solana/wallet-adapter-react-ui/styles.css';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WalletContextProvider>
      <PresaleProvider>
        <App />
      </PresaleProvider>
    </WalletContextProvider>
  </React.StrictMode>,
);

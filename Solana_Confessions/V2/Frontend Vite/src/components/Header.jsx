import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Ghost } from 'lucide-react';

const Header = () => {
  return (
    <header className="app-header">
      <h1>
        <Ghost />
        Solana Confessions
      </h1>
      <WalletMultiButton />
    </header>
  );
};

export default Header;

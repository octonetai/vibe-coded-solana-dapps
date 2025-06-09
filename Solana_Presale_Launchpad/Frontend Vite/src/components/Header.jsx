import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import BalanceDisplay from './BalanceDisplay';
import RequestAirdrop from './presale/RequestAirdrop';

const Header = ({ onBalanceChange, balanceRefreshTrigger }) => {
  return (
    <header className="app-header">
      <div className="logo">
        <h1>🚀 Solana Presale</h1>
      </div>
      <div className="header-controls">
        <BalanceDisplay refreshTrigger={balanceRefreshTrigger} />
        <RequestAirdrop onAirdrop={onBalanceChange} />
        <WalletMultiButton />
      </div>
    </header>
  );
};

export default Header;

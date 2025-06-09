import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import PoolInfo from './presale/PoolInfo';
import DepositSol from './presale/DepositSol';
import ClaimFunds from './presale/ClaimFunds';
import AllDepositors from './presale/AllDepositors';

const PoolDashboard = ({ poolAddress, onBack }) => {
  const { publicKey } = useWallet();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <div>
        <button onClick={onBack} className="back-button">← Look up another pool</button>
        <PoolInfo poolAddress={poolAddress} refreshTrigger={refreshTrigger} />
        
        <div className="actions-container">
            {publicKey && (
                <DepositSol poolAddress={poolAddress} onDeposit={handleRefresh} />
            )}
            {publicKey && (
                <ClaimFunds poolAddress={poolAddress} onClaim={handleRefresh} />
            )}
        </div>
        
        <AllDepositors poolAddress={poolAddress} refreshTrigger={refreshTrigger} />
    </div>
  );
};

export default PoolDashboard;

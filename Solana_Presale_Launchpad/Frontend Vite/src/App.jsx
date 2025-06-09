import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Header from './components/Header';
import CreatePool from './components/presale/CreatePool';
import PoolDashboard from './components/PoolDashboard';

export default function App() {
  const { publicKey } = useWallet();
  const [poolAddress, setPoolAddress] = useState('');
  const [lookupAddress, setLookupAddress] = useState('');
  const [balanceRefresh, setBalanceRefresh] = useState(0);

  const handlePoolCreated = (newPoolAddress) => {
    setPoolAddress(newPoolAddress);
    setLookupAddress(newPoolAddress);
  };

  const handleLookup = () => {
    setPoolAddress(lookupAddress);
  };

  return (
    <div className="app-container">
      <Header onBalanceChange={() => setBalanceRefresh(p => p + 1)} balanceRefreshTrigger={balanceRefresh} />
      <main className="app-main">
        {!publicKey ? (
          <div className="card connect-wallet-prompt">
            <h2>Welcome to the Solana Presale Launchpad</h2>
            <p>Please connect your wallet to create or interact with presale pools.</p>
          </div>
        ) : !poolAddress ? (
          <div className="lobby">
            <CreatePool onPoolCreated={handlePoolCreated} />
            <div className="card">
              <h3>Or Look Up an Existing Pool</h3>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Enter Pool Address"
                  value={lookupAddress}
                  onChange={(e) => setLookupAddress(e.target.value)}
                />
              </div>
              <button onClick={handleLookup} disabled={!lookupAddress}>
                Look Up Pool
              </button>
            </div>
          </div>
        ) : (
          <PoolDashboard poolAddress={poolAddress} onBack={() => setPoolAddress('')} />
        )}
      </main>
    </div>
  );
}

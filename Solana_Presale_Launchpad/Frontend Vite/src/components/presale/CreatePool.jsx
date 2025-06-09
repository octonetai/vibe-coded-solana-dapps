import React, { useState } from 'react';
import { usePresale } from '../../hooks/usePresale';
import { useWallet } from '@solana/wallet-adapter-react';

const CreatePool = ({ onPoolCreated }) => {
  const { presaleClient } = usePresale();
  const { publicKey } = useWallet();
  const [expiry, setExpiry] = useState(3600); // 1 hour
  const [minDeposit, setMinDeposit] = useState(0.1);
  const [maxDeposit, setMaxDeposit] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreatePool = async () => {
    if (!presaleClient || !publicKey) {
      setError('Please connect your wallet first.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const expiryTimestamp = Math.floor(Date.now() / 1000) + Number(expiry);
      const result = await presaleClient.createPool(expiryTimestamp, Number(minDeposit), Number(maxDeposit));
      setSuccess(`Pool created successfully! Address: ${result.pool}`);
      onPoolCreated(result.pool);
    } catch (err) {
      console.error(err);
      setError(`Failed to create pool: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Create New Presale Pool</h3>
      <div className="form-group">
        <label>Expiry (in seconds from now)</label>
        <input type="number" value={expiry} onChange={(e) => setExpiry(e.target.value)} disabled={isLoading} />
      </div>
      <div className="form-group">
        <label>Min Deposit (SOL)</label>
        <input type="number" value={minDeposit} onChange={(e) => setMinDeposit(e.target.value)} disabled={isLoading} />
      </div>
      <div className="form-group">
        <label>Max Deposit (SOL)</label>
        <input type="number" value={maxDeposit} onChange={(e) => setMaxDeposit(e.target.value)} disabled={isLoading} />
      </div>
      <button onClick={handleCreatePool} disabled={isLoading || !publicKey}>
        {isLoading ? 'Creating...' : 'Create Pool'}
      </button>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default CreatePool;

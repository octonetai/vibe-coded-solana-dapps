import React, { useState } from 'react';
import { usePresale } from '../../hooks/usePresale';

const DepositSol = ({ poolAddress, onDeposit }) => {
  const { presaleClient } = usePresale();
  const [amount, setAmount] = useState(0.1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDeposit = async () => {
    if (!presaleClient) {
      setError('Client not initialized.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const signature = await presaleClient.depositSOL(poolAddress, Number(amount));
      setSuccess(`Successfully deposited ${amount} SOL. Signature: ${signature.slice(0, 20)}...`);
      onDeposit(); // Callback to refresh pool info
    } catch (err) {
      console.error(err);
      setError(`Failed to deposit: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h4>Deposit SOL</h4>
      <div className="form-group">
        <label>Amount (SOL)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isLoading} />
      </div>
      <button onClick={handleDeposit} disabled={isLoading}>
        {isLoading ? 'Depositing...' : 'Deposit'}
      </button>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default DepositSol;

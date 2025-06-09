import React, { useState } from 'react';
import { usePresale } from '../../hooks/usePresale';

const ClaimFunds = ({ poolAddress, onClaim }) => {
  const { presaleClient } = usePresale();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleClaim = async () => {
    if (!presaleClient) {
      setError('Client not initialized.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const signature = await presaleClient.claimFunds(poolAddress);
      setSuccess(`Successfully claimed funds. Signature: ${signature.slice(0, 20)}...`);
      onClaim();
    } catch (err) {
      console.error(err);
      setError(`Failed to claim funds: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h4>Claim Funds (Owner only)</h4>
      <p>Only the pool creator can claim funds after the presale has expired.</p>
      <button onClick={handleClaim} disabled={isLoading}>
        {isLoading ? 'Claiming...' : 'Claim Funds'}
      </button>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default ClaimFunds;

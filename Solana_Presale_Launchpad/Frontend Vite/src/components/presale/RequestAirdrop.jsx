import React, { useState } from 'react';
import { usePresale } from '../../hooks/usePresale';
import { useWallet } from '@solana/wallet-adapter-react';

const RequestAirdrop = ({ onAirdrop }) => {
  const { presaleClient } = usePresale();
  const { publicKey } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAirdrop = async () => {
    if (!presaleClient || !publicKey) {
      setError('Please connect your wallet first.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await presaleClient.requestAirdrop(2);
      setSuccess('Airdrop successful! Your balance will update shortly.');
      onAirdrop();
    } catch (err) {
      console.error(err);
      setError(`Airdrop failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
        <button onClick={handleAirdrop} disabled={isLoading || !publicKey} className="airdrop-button">
            {isLoading ? 'Requesting...' : 'Request 2 SOL Airdrop'}
        </button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
    </>
  );
};

export default RequestAirdrop;

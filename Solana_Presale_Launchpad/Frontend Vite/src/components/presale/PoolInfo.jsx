import React, { useEffect, useState } from 'react';
import { usePresale } from '../../hooks/usePresale';

const PoolInfo = ({ poolAddress, refreshTrigger }) => {
  const { presaleClient } = usePresale();
  const [poolInfo, setPoolInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPoolInfo = async () => {
      if (!presaleClient || !poolAddress) return;
      setIsLoading(true);
      setError('');
      try {
        const info = await presaleClient.getPoolInfo(poolAddress);
        setPoolInfo(info);
      } catch (err) {
        console.error(err);
        setError(`Failed to fetch pool info: ${err.message}`);
        setPoolInfo(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPoolInfo();
  }, [presaleClient, poolAddress, refreshTrigger]);

  if (isLoading) return <div className="card">Loading pool information...</div>;
  if (error) return <div className="card error-message">{error}</div>;
  if (!poolInfo) return null;

  return (
    <div className="card">
      <h3>Pool Information</h3>
      <div className="info-grid">
        <div><strong>Address:</strong></div>
        <div><code className="code-inline">{poolInfo.address}</code></div>

        <div><strong>Owner:</strong></div>
        <div><code className="code-inline">{poolInfo.owner}</code></div>

        <div><strong>Status:</strong></div>
        <div>
          <span className={`status-badge ${poolInfo.isExpired ? 'expired' : 'active'}`}>
            {poolInfo.isExpired ? 'Expired' : 'Active'}
          </span>
          {poolInfo.isClaimed && <span className="status-badge claimed">Claimed</span>}
        </div>

        <div><strong>Total Raised:</strong></div>
        <div>{poolInfo.totalRaised.toFixed(4)} SOL</div>
        
        <div><strong>Depositors:</strong></div>
        <div>{poolInfo.depositorCount}</div>

        <div><strong>Deposit Range:</strong></div>
        <div>{poolInfo.minDeposit} - {poolInfo.maxDeposit} SOL</div>
        
        <div><strong>Expires:</strong></div>
        <div>{poolInfo.expiryDate.toLocaleString()}</div>
      </div>
    </div>
  );
};

export default PoolInfo;

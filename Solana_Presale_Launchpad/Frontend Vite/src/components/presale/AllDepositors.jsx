import React, { useEffect, useState } from 'react';
import { usePresale } from '../../hooks/usePresale';

const AllDepositors = ({ poolAddress, refreshTrigger }) => {
  const { presaleClient } = usePresale();
  const [depositors, setDepositors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDepositors = async () => {
      if (!presaleClient || !poolAddress) return;
      setIsLoading(true);
      setError('');
      try {
        const data = await presaleClient.getAllDepositors(poolAddress);
        setDepositors(data);
      } catch (err) {
        console.error(err);
        setError(`Failed to fetch depositors: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDepositors();
  }, [presaleClient, poolAddress, refreshTrigger]);

  if (isLoading) return <div className="card">Loading depositors...</div>;
  if (error) return <div className="card error-message">{error}</div>;

  return (
    <div className="card">
      <h4>All Depositors</h4>
      {depositors.length === 0 ? (
        <p>No depositors yet.</p>
      ) : (
        <div className="table-container">
            <table>
            <thead>
                <tr>
                <th>Depositor</th>
                <th>Amount (SOL)</th>
                <th>Date</th>
                </tr>
            </thead>
            <tbody>
                {depositors.map((d, i) => (
                <tr key={i}>
                    <td><code className="code-inline">{`${d.depositor.slice(0, 4)}...${d.depositor.slice(-4)}`}</code></td>
                    <td>{d.amount.toFixed(4)}</td>
                    <td>{d.date.toLocaleString()}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default AllDepositors;

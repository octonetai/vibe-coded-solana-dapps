import React, { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const BalanceDisplay = ({ refreshTrigger }) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!publicKey || !connection) {
      setBalance(0);
      return;
    }
    const fetchBalance = async () => {
        const newBalance = await connection.getBalance(publicKey);
        setBalance(newBalance / LAMPORTS_PER_SOL);
    }
    fetchBalance();
  }, [publicKey, connection, refreshTrigger]);

  if (!publicKey) return null;

  return (
    <div className="balance-container">
      <span>Balance: </span>
      <span className="balance-value">{balance.toFixed(4)} SOL</span>
    </div>
  );
};

export default BalanceDisplay;

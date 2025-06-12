import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useEffect, useState } from 'react';

const BalanceDisplay = () => {
    const { connection } = useConnection();
    const { publicKey, connected } = useWallet();
    const [balance, setBalance] = useState(null);

    useEffect(() => {
        if (connected && publicKey) {
            const getBalance = async () => {
                try {
                    const lamports = await connection.getBalance(publicKey);
                    setBalance(lamports / LAMPORTS_PER_SOL);
                } catch (error) {
                    console.error("Error fetching balance:", error);
                    setBalance(null);
                }
            };
            getBalance();
        } else {
            setBalance(null);
        }
    }, [connected, publicKey, connection]);

    if (!connected) {
        return (
            <div className="balance-container not-connected">
                <p>Connect your wallet to view your balance.</p>
            </div>
        );
    }

    return (
        <div className="balance-container">
            <h2>Your Balance</h2>
            {balance !== null ? (
                <p className="balance-value">{balance.toFixed(4)} SOL</p>
            ) : (
                <p>Loading balance...</p>
            )}
        </div>
    );
};

export default BalanceDisplay;

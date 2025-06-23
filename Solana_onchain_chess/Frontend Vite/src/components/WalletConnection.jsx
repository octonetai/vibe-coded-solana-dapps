import React, { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

const WalletConnection = ({ network }) => {
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch wallet balance
  const fetchBalance = async () => {
    if (!publicKey || !connected) return

    setLoading(true)
    setError(null)
    
    try {
      const balance = await connection.getBalance(publicKey)
      setBalance(balance / LAMPORTS_PER_SOL)
    } catch (err) {
      console.error('Error fetching balance:', err)
      setError('Failed to fetch balance. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance()
    } else {
      setBalance(null)
      setError(null)
    }
  }, [connected, publicKey, connection])

  // Format wallet address for display
  const formatAddress = (address) => {
    if (!address) return ''
    const str = address.toString()
    return `${str.slice(0, 4)}...${str.slice(-4)}`
  }

  return (
    <div className="wallet-section">
      <div className="network-badge">
        Network: {network.charAt(0).toUpperCase() + network.slice(1)}
      </div>

      {!connected ? (
        <div>
          <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
            Connect your Solana wallet to view your balance and interact with the blockchain.
          </p>
          <WalletMultiButton />
        </div>
      ) : (
        <div className="wallet-info">
          <h3 style={{ marginBottom: '1rem', color: '#4ecdc4' }}>
            Wallet Connected ✓
          </h3>
          
          <div className="wallet-address">
            <strong>Address:</strong><br />
            {formatAddress(publicKey)} 
            <br />
            <small style={{ opacity: 0.7 }}>
              {publicKey?.toString()}
            </small>
          </div>

          <div className="balance-card">
            <div className="balance-label">SOL Balance</div>
            <div className="balance-amount">
              {loading ? (
                <span>
                  <span className="loading"></span>
                  Loading...
                </span>
              ) : balance !== null ? (
                <>
                  {balance.toFixed(4)}
                  <span className="sol-symbol">SOL</span>
                </>
              ) : (
                'Unable to load'
              )}
            </div>
          </div>

          {error && (

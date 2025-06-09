import React, { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import PresaleClient from '../../lib/presale-client';
import { PresaleContext } from '../../contexts/PresaleContext';

export const PresaleProvider = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const presaleClient = useMemo(() => {
    if (wallet && connection && wallet.publicKey) {
      return new PresaleClient(wallet, connection);
    }
    return null;
  }, [wallet, connection, wallet.publicKey]);

  return (
    <PresaleContext.Provider value={{ presaleClient }}>
      {children}
    </PresaleContext.Provider>
  );
};

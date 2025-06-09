import { useContext } from 'react';
import { PresaleContext } from '../contexts/PresaleContext';

export const usePresale = () => {
  const context = useContext(PresaleContext);
  if (context === null) {
    throw new Error('usePresale must be used within a PresaleProvider');
  }
  return context;
};

import React from 'react';
import { Power } from 'lucide-react';

const InitializeProgram = ({ onInitialize, isInitializing }) => {
  return (
    <div className="card initialize-card">
      <Power size={48} className="centered" style={{ marginBottom: '1rem', color: 'var(--accent-color)' }} />
      <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Program Not Initialized</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        The on-chain program requires a one-time setup to create the main state account. 
        As the first user, you can initialize it now.
      </p>
      <button
        className="form-button"
        onClick={onInitialize}
        disabled={isInitializing}
      >
        {isInitializing ? 'Initializing...' : 'Initialize Program'}
      </button>
    </div>
  );
};

export default InitializeProgram;

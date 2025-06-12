import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Ghost } from 'lucide-react';
import Header from './components/Header';
import ConfessionForm from './components/ConfessionForm';
import ConfessionFeed from './components/ConfessionFeed';
import Notification from './components/Notification';
import InitializeProgram from './components/InitializeProgram';
import AnonymousConfessionsClient from './lib/AnonymousConfessionsClient';

function App() {
  const wallet = useWallet();
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [key, setKey] = useState(0); // Used to force re-render of feed
  const [programState, setProgramState] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const client = useMemo(() => {
    if (wallet && wallet.connected) {
      return new AnonymousConfessionsClient(wallet);
    }
    return null;
  }, [wallet]);

  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  }, []);

  useEffect(() => {
    if (!client) {
      setProgramState(null);
      return;
    }
    const fetchState = async () => {
      setProgramState(null); // Set to loading
      console.log("Fetching program state...");
      const stateResult = await client.getConfessionState();
      if (stateResult.success) {
        setProgramState(stateResult.state);
        console.log("Program state:", stateResult.state);
      } else {
        showNotification(stateResult.error, 'error');
        setProgramState({ admin: 'Error' }); // Handle error case
      }
    };
    fetchState();
  }, [client, showNotification]);

  const handlePostSuccess = (newConfession) => {
    showNotification('Confession posted anonymously!', 'success');
    setKey(prev => prev + 1); // Trigger refresh
  };

  const handleInitialize = async () => {
    if (!client) return;
    setIsInitializing(true);
    showNotification('Initializing program... This may take a moment.', 'info');
    try {
      const result = await client.initialize();
      if (result.success) {
        showNotification('Program initialized successfully!', 'success');
        // Refetch state
        const stateResult = await client.getConfessionState();
        if (stateResult.success) {
          setProgramState(stateResult.state);
        }
      } else {
        throw new Error(result.error || 'Initialization failed.');
      }
    } catch (error) {
      console.error("Initialization error:", error);
      showNotification(error.message, 'error');
    } finally {
      setIsInitializing(false);
    }
  };
  
  const renderContent = () => {
    if (!wallet.connected || !client) {
      return (
        <div className="card empty-state">
          <Ghost size={48} className="centered" style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }} />
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Welcome to Anonymous Confessions</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            Connect your Solana wallet to share your thoughts and see what others are saying.
          </p>
        </div>
      );
    }
    
    if (!programState) {
        return <div className="card"><p className="centered">Loading program state...</p></div>;
    }
    
    if (programState.admin === 'Not Initialized') {
        return <InitializeProgram onInitialize={handleInitialize} isInitializing={isInitializing} />;
    }
    
    if (programState.admin === 'Error') {
      return <div className="card"><p className="centered error">Failed to load program state. Please refresh.</p></div>;
    }

    // Program is initialized, show the main app
    return (
      <>
        <ConfessionForm 
          client={client} 
          onPostSuccess={handlePostSuccess} 
          showNotification={showNotification}
        />
        <ConfessionFeed
          key={key} 
          client={client}
          showNotification={showNotification}
        />
      </>
    );
  };


  return (
    <div className="app-container">
      <Header />
      <main className="app-main">
        {renderContent()}
      </main>
      {notification.show && (
        <Notification message={notification.message} type={notification.type} />
      )}
    </div>
  );
}

export default App;

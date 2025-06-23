import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Keypair } from '@solana/web3.js';

const GameControls = ({ game, rawGameState, onNewGame, onJoinGame, onResign, onOfferDraw, onAcceptDraw, canAcceptDraw }) => {
  const [opponent, setOpponent] = useState('');
  const [hostKey, setHostKey] = useState('');
  const wallet = useWallet();

  const handleNewGameVsPlayer = () => {
    if (opponent.trim()) {
      onNewGame(opponent.trim());
    } else {
      alert('Please enter a valid opponent public key.');
    }
  };
  
  const handleNewGameVsBot = () => {
    const botKeypair = Keypair.generate();
    onNewGame(botKeypair.publicKey.toString());
  };

  const handleJoinGame = () => {
    if (hostKey.trim()) {
      onJoinGame(hostKey.trim());
    } else {
      alert('Please enter a valid host public key.');
    }
  };

  // If there's no game, or the game is over, show the lobby
  if (!rawGameState || game.isGameOver()) {
    return (
      <div className="lobby-controls">
        <div className="controls-panel">
          <h3>Play the Bot</h3>
          <p>Start a new game against a computer opponent. The easiest way to test.</p>
           <button onClick={handleNewGameVsBot} className="btn btn-primary">
            Create Bot Game
          </button>
        </div>
        <div className="controls-panel">
          <h3>Play a Friend</h3>
          <p>Paste your friend's wallet address to challenge them to a game.</p>
          <input
            type="text"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            placeholder="Opponent's Public Key"
            className="input-field"
          />
          <button onClick={handleNewGameVsPlayer} className="btn btn-primary">
            Create Player Game
          </button>
        </div>
        <div className="controls-panel">
          <h3>Join/Spectate Game</h3>
          <p>Enter a host's public key to watch or join their game.</p>
          <input
            type="text"
            value={hostKey}
            onChange={(e) => setHostKey(e.target.value)}
            placeholder="Host's Public Key"
            className="input-field"
          />
          <button onClick={handleJoinGame} className="btn btn-secondary">
            Join Game
          </button>
        </div>
      </div>
    );
  }

  // If game is in progress
  const isPlayer = rawGameState.players.white === wallet.publicKey?.toString() || 
                   rawGameState.players.black === wallet.publicKey?.toString();
  
  return (
    <div className="controls-panel">
      <h3>Actions</h3>
      {isPlayer ? (
        <div className="action-buttons">
          <button onClick={onOfferDraw} className="btn btn-secondary">Offer Draw</button>
          {canAcceptDraw && (
            <button onClick={onAcceptDraw} className="btn btn-confirm">Accept Draw</button>
          )}
          <button onClick={onResign} className="btn btn-danger">Resign</button>
        </div>
      ) : (
        <p>You are spectating this game.</p>
      )}
    </div>
  );
};

export default GameControls;

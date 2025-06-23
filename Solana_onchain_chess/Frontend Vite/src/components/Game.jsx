import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Chessboard } from 'react-chessboard';
import { useChess } from '../hooks/useChess';
import GameControls from './GameControls';

const Game = () => {
  const { connected, publicKey } = useWallet();
  const { 
    game,
    rawGameState,
    isLoading, 
    error, 
    message,
    showMessage,
    initializeGame, 
    joinGame,
    makeMove, 
    resign,
    offerDraw,
    acceptDraw
  } = useChess();
  
  if (!connected) {
    return (
      <div className="info-box">
        <h2>Connect Your Wallet</h2>
        <p>Please connect your wallet to start playing Solana Chess.</p>
      </div>
    );
  }

  const onPieceDrop = (sourceSquare, targetSquare) => {
    if (!rawGameState || !publicKey) return false;

    const myColor = rawGameState.players.white === publicKey.toString() ? 'w' : 'b';
    const myTurn = game.turn() === myColor;

    if (game.isGameOver()) {
      showMessage("The game is over.");
      return false;
    }

    if (!myTurn) {
      showMessage("It's not your turn.");
      return false;
    }

    makeMove(sourceSquare, targetSquare);
    return true; // Indicates a valid move was attempted
  };

  const renderGameStatus = () => {
    if (!rawGameState) {
      return isLoading ? <p>Initializing Client...</p> : <p>No active game. Create or join one!</p>;
    }
    
    if (game.isGameOver()) {
      let statusText = "Game Over";
      if (rawGameState.gameStatus === 'WhiteWins') {
        statusText = `Checkmate! White wins.`;
      } else if (rawGameState.gameStatus === 'BlackWins') {
        statusText = `Checkmate! Black wins.`;
      } else if (rawGameState.gameStatus === 'Draw') {
        if (game.isStalemate()) statusText = "Draw by Stalemate.";
        else if (game.isThreefoldRepetition()) statusText = "Draw by Threefold Repetition.";
        else if (game.isInsufficientMaterial()) statusText = "Draw by Insufficient Material.";
        else statusText = "Game drawn by agreement.";
      }
      return <h3 className="status-gameover">{statusText}</h3>;
    }
    
    const myColor = rawGameState.players.white === publicKey?.toString() ? 'w' : 'b';
    const turnText = game.turn() === myColor ? "Your Turn" : "Opponent's Turn";
    const turnColor = game.turn() === 'w' ? 'White' : 'Black';

    return <h3 className={`status-turn ${game.turn() === myColor ? 'my-turn' : ''}`}>{turnText} ({turnColor})</h3>;
  };
  
  const canAcceptDraw = () => {
    if (!rawGameState || !publicKey) return false;
    const myColor = rawGameState.players.white === publicKey.toString() ? 'White' : 'Black';
    if (myColor === 'White' && rawGameState.drawOfferedByBlack) return true;
    if (myColor === 'Black' && rawGameState.drawOfferedByWhite) return true;
    return false;
  };

  const boardOrientation = rawGameState?.players.white === publicKey?.toString() ? 'white' : 'black';

  return (
    <div className="game-container">
      {error && <div className="notification error-message">{error}</div>}
      {message && <div className="notification info-message">{message}</div>}
      
      <div className="game-layout">
        <div className="chessboard-container">
          <Chessboard 
            position={game.fen()}
            onPieceDrop={onPieceDrop}
            boardOrientation={boardOrientation}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
            }}
          />
        </div>
        
        <div className="game-info-container">
          <h2>Game Info</h2>
          <div className="info-box">
            {isLoading && <div className="loading-indicator">Processing...</div>}
            {renderGameStatus()}
            {rawGameState && (
              <div className="game-details">
                <p><strong>White:</strong> {rawGameState.players.white.substring(0,6)}...</p>
                <p><strong>Black:</strong> {rawGameState.players.black.substring(0,6)}...</p>
                <p><strong>Move:</strong> {game.moveNumber()}</p>
                 {rawGameState.drawOfferedByWhite && <p className="draw-offer">White has offered a draw.</p>}
                 {rawGameState.drawOfferedByBlack && <p className="draw-offer">Black has offered a draw.</p>}
              </div>
            )}
          </div>

          <GameControls
            game={game}
            rawGameState={rawGameState}
            onNewGame={initializeGame}
            onJoinGame={joinGame}
            onResign={resign}
            onOfferDraw={offerDraw}
            onAcceptDraw={acceptDraw}
            canAcceptDraw={canAcceptDraw()}
          />
        </div>
      </div>
    </div>
  );
};

export default Game;

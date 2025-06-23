import {
  useState,
  useEffect,
  useCallback
} from 'react';
import {
  useConnection,
  useWallet
} from '@solana/wallet-adapter-react';
import {
  PublicKey
} from '@solana/web3.js';
import {
  Chess
} from 'chess.js';
import {
  SolanaChessClient
} from '../SolanaChessClient';

const PROGRAM_ID = "7Le8FobBEEcKUdSY25NdYLpsAXxNSYFD1NGzTB4eZXkw";

const pieceToFenChar = {
  'White': {
    'Pawn': 'P',
    'Rook': 'R',
    'Knight': 'N',
    'Bishop': 'B',
    'Queen': 'Q',
    'King': 'K'
  },
  'Black': {
    'Pawn': 'p',
    'Rook': 'r',
    'Knight': 'n',
    'Bishop': 'b',
    'Queen': 'q',
    'King': 'k'
  }
};

const boardToFEN = (state) => {
  if (!state || !state.board) return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const {
    board,
    currentTurn,
    castlingRights,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber
  } = state;

  const fenRanks = [];
  for (let rank = 7; rank >= 0; rank--) {
    let emptySquares = 0;
    let rankFen = '';
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece) {
        if (emptySquares > 0) {
          rankFen += emptySquares;
          emptySquares = 0;
        }
        rankFen += pieceToFenChar[piece.color][piece.type];
      } else {
        emptySquares++;
      }
    }
    if (emptySquares > 0) {
      rankFen += emptySquares;
    }
    fenRanks.push(rankFen);
  }
  const fenBoard = fenRanks.join('/');
  const turnChar = currentTurn === 'White' ? 'w' : 'b';

  let castlingFen = '';
  if (castlingRights) {
    if (castlingRights.whiteKingside) castlingFen += 'K';
    if (castlingRights.whiteQueenside) castlingFen += 'Q';
    if (castlingRights.blackKingside) castlingFen += 'k';
    if (castlingRights.blackQueenside) castlingFen += 'q';
  }
  if (castlingFen === '') castlingFen = '-';

  let enPassantFen = '-';
  if (enPassantTarget !== null && enPassantTarget !== undefined) {
    const file = String.fromCharCode(97 + (enPassantTarget % 8));
    const rank = Math.floor(enPassantTarget / 8) + 1;
    // chess.js expects the target square, not the pawn's starting square
    const enPassantRank = turnChar === 'w' ? (rank + 1) : (rank - 1);
    enPassantFen = file + enPassantRank;
  }


  const halfmoveFen = halfmoveClock || 0;
  const fullmoveFen = fullmoveNumber || 1;

  return `${fenBoard} ${turnChar} ${castlingFen} ${enPassantFen} ${halfmoveFen} ${fullmoveFen}`;
};

export const useChess = () => {
  const {
    connection
  } = useConnection();
  const wallet = useWallet();
  const [chessClient, setChessClient] = useState(null);
  const [gameHost, setGameHost] = useState(null); // The public key of the game initializer
  const [gamePda, setGamePda] = useState(null);
  const [rawGameState, setRawGameState] = useState(null);
  const [game, setGame] = useState(new Chess());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // 1. Initialize client when wallet connects
  useEffect(() => {
    const initClient = async () => {
      if (wallet.connected && connection) {
        setIsLoading(true);
        try {
          const client = new SolanaChessClient(connection, wallet, PROGRAM_ID);
          await client.initialize();
          setChessClient(client);
        } catch (err) {
          handleError(err, "Failed to initialize the chess client.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setChessClient(null);
        setGameHost(null);
        setGamePda(null);
        setRawGameState(null);
        setGame(new Chess());
      }
    };
    initClient();
  }, [wallet.connected, connection, wallet.publicKey]);

  // 2. Derive PDA when gameHost is set
  useEffect(() => {
    if (chessClient && gameHost) {
      const [pda] = chessClient.getGamePDA(gameHost);
      setGamePda(pda);
    } else {
      setGamePda(null);
    }
  }, [chessClient, gameHost]);

  const showMessage = (msg, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  const handleError = (err, defaultMsg) => {
    console.error(err);
    const message = err.message || defaultMsg;
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const fetchGameState = useCallback(async () => {
    if (!chessClient || !gamePda) {
      setRawGameState(null);
      setGame(new Chess());
      return;
    }
    // No setIsLoading(true) here to make polling less intrusive
    try {
      const state = await chessClient.getGameState(gamePda);
      setRawGameState(state);
      if (state) {
        const fen = boardToFEN(state);
        try {
          setGame(new Chess(fen));
        } catch (fenError) {
          console.error("Invalid FEN generated:", fen);
          console.error("FEN parsing error:", fenError);
          handleError(new Error("Failed to load board from on-chain state."), "State sync error.");
        }
      } else {
        setRawGameState(null);
        setGame(new Chess());
        if (gameHost) {
          showMessage("No active game found for that host.");
          setGameHost(null);
        }
      }
    } catch (err) {
      console.error('Background fetch failed:', err);
    }
  }, [chessClient, gamePda, gameHost]);


  // 3. Fetch game state when PDA is available and periodically
  useEffect(() => {
    if (gamePda) {
      fetchGameState(); // Initial fetch
      const interval = setInterval(fetchGameState, 5000);
      return () => clearInterval(interval);
    }
  }, [gamePda, fetchGameState]);

  const initializeGame = async (opponentPublicKeyStr) => {
    if (!chessClient || !wallet.publicKey) return;
    setIsLoading(true);
    setError(null);

    try {
      const [pda] = chessClient.getGamePDA(wallet.publicKey);
      const existingGame = await chessClient.getGameState(pda);

      if (existingGame && existingGame.gameStatus === 'InProgress') {
        showMessage("You already have an active game. Loading it now.");
        setGameHost(wallet.publicKey);
        return;
      }

      const opponentPublicKey = new PublicKey(opponentPublicKeyStr);
      await chessClient.initializeGame(wallet.publicKey, opponentPublicKey);
      showMessage('New game initialized! Board will update shortly.');
      setGameHost(wallet.publicKey);
    } catch (err) {
      handleError(err, 'Failed to initialize game.');
    } finally {
      setIsLoading(false);
    }
  };

  const joinGame = (hostPublicKeyStr) => {
    try {
      const hostKey = new PublicKey(hostPublicKeyStr);
      setGameHost(hostKey);
      showMessage(`Attempting to join game hosted by ${hostPublicKeyStr.substring(0,6)}...`);
    } catch (err) {
      handleError(err, 'Invalid host public key.');
    }
  };

  const makeMove = async (fromSquare, toSquare) => {
    if (!chessClient || !gamePda || game.isGameOver()) return;

    const tempGame = new Chess(game.fen());
    const moveResult = tempGame.move({
      from: fromSquare,
      to: toSquare,
      promotion: 'q'
    });

    if (moveResult === null) {
      showMessage("That move is not allowed.");
      return;
    }

    setGame(tempGame);
    setIsLoading(true);
    setError(null);

    try {
      const from = chessClient.algebraicToSquare(fromSquare);
      const to = chessClient.algebraicToSquare(toSquare);
      await chessClient.makeMove(gamePda, from, to, moveResult.promotion);
      showMessage(`Move ${fromSquare}-${toSquare} submitted.`);
      setTimeout(fetchGameState, 2000);
    } catch (err) {
      handleError(err, `Invalid move: ${fromSquare}-${toSquare}. Reverting.`);
      fetchGameState();
    } finally {
      setIsLoading(false);
    }
  };

  const resign = async () => {
    if (!chessClient || !gamePda) return;
    setIsLoading(true);
    setError(null);
    try {
      await chessClient.resign(gamePda);
      showMessage('You have resigned the game.');
      setTimeout(fetchGameState, 2000);
    } catch (err) {
      handleError(err, 'Failed to resign.');
    } finally {
      setIsLoading(false);
    }
  };

  const offerDraw = async () => {
    if (!chessClient || !gamePda) return;
    setIsLoading(true);
    setError(null);
    try {
      await chessClient.offerDraw(gamePda);
      showMessage('Draw offer sent.');
      setTimeout(fetchGameState, 2000);
    } catch (err) {
      handleError(err, 'Failed to offer draw.');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptDraw = async () => {
    if (!chessClient || !gamePda) return;
    setIsLoading(true);
    setError(null);
    try {
      await chessClient.acceptDraw(gamePda);
      showMessage('Draw offer accepted.');
      setTimeout(fetchGameState, 2000);
    } catch (err) {
      handleError(err, 'Failed to accept draw.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
};

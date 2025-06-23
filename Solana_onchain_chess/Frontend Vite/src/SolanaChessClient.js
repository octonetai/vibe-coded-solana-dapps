// Solana Chess Game JavaScript Client (Browser-Compatible)
// Program ID: 7Le8FobBEEcKUdSY25NdYLpsAXxNSYFD1NGzTB4eZXkw

import {
  Connection,
  PublicKey,
  SystemProgram
} from '@solana/web3.js';
import {
  Program,
  AnchorProvider
} from '@project-serum/anchor';
import {
  Buffer
} from 'buffer';

class SolanaChessClient {
  constructor(connection, wallet, programId) {
    this.connection = connection;
    this.wallet = wallet;
    this.programId = new PublicKey(programId);
    this.provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: 'confirmed',
      commitment: 'confirmed',
    });
    this.program = null;
    this.idl = this.getIDL();
  }

  // Initialize the Anchor program
  async initialize() {
    this.program = new Program(this.idl, this.programId, this.provider);
    console.log('✅ Chess client initialized with program ID:', this.programId.toString());
  }

  // Complete IDL for the chess program
  getIDL() {
    return {
      "version": "0.1.0",
      "name": "chess_game",
      "instructions": [{
        "name": "initializeGame",
        "accounts": [{
          "name": "game",
          "isMut": true,
          "isSigner": false
        }, {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        }, {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }],
        "args": [{
          "name": "whitePlayer",
          "type": "publicKey"
        }, {
          "name": "blackPlayer",
          "type": "publicKey"
        }]
      }, {
        "name": "makeMove",
        "accounts": [{
          "name": "game",
          "isMut": true,
          "isSigner": false
        }, {
          "name": "player",
          "isMut": false,
          "isSigner": true
        }],
        "args": [{
          "name": "fromSquare",
          "type": "u8"
        }, {
          "name": "toSquare",
          "type": "u8"
        }, {
          "name": "promotionPiece",
          "type": {
            "option": {
              "defined": "PieceType"
            }
          }
        }]
      }, {
        "name": "resign",
        "accounts": [{
          "name": "game",
          "isMut": true,
          "isSigner": false
        }, {
          "name": "player",
          "isMut": false,
          "isSigner": true
        }],
        "args": []
      }, {
        "name": "offerDraw",
        "accounts": [{
          "name": "game",
          "isMut": true,
          "isSigner": false
        }, {
          "name": "player",
          "isMut": false,
          "isSigner": true
        }],
        "args": []
      }, {
        "name": "acceptDraw",
        "accounts": [{
          "name": "game",
          "isMut": true,
          "isSigner": false
        }, {
          "name": "player",
          "isMut": false,
          "isSigner": true
        }],
        "args": []
      }],
      "accounts": [{
        "name": "GameState",
        "type": {
          "kind": "struct",
          "fields": [{
            "name": "whitePlayer",
            "type": "publicKey"
          }, {
            "name": "blackPlayer",
            "type": "publicKey"
          }, {
            "name": "currentTurn",
            "type": {
              "defined": "Player"
            }
          }, {
            "name": "gameStatus",
            "type": {
              "defined": "GameStatus"
            }
          }, {
            "name": "winner",
            "type": {
              "option": "publicKey"
            }
          }, {
            "name": "board",
            "type": {
              "array": [{
                "array": [{
                  "option": {
                    "defined": "Piece"
                  }
                }, 8]
              }, 8]
            }
          }, {
            "name": "moveCount",
            "type": "u32"
          }, {
            "name": "castlingRights",
            "type": {
              "defined": "CastlingRights"
            }
          }, {
            "name": "enPassantTarget",
            "type": {
              "option": "u8"
            }
          }, {
            "name": "halfmoveClock",
            "type": "u8"
          }, {
            "name": "fullmoveNumber",
            "type": "u32"
          }, {
            "name": "drawOfferedByWhite",
            "type": "bool"
          }, {
            "name": "drawOfferedByBlack",
            "type": "bool"
          }]
        }
      }],
      "types": [{
        "name": "Player",
        "type": {
          "kind": "enum",
          "variants": [{
            "name": "White"
          }, {
            "name": "Black"
          }]
        }
      }, {
        "name": "GameStatus",
        "type": {
          "kind": "enum",
          "variants": [{
            "name": "InProgress"
          }, {
            "name": "WhiteWins"
          }, {
            "name": "BlackWins"
          }, {
            "name": "Draw"
          }]
        }
      }, {
        "name": "PieceType",
        "type": {
          "kind": "enum",
          "variants": [{
            "name": "Pawn"
          }, {
            "name": "Rook"
          }, {
            "name": "Knight"
          }, {
            "name": "Bishop"
          }, {
            "name": "Queen"
          }, {
            "name": "King"
          }]
        }
      }, {
        "name": "Piece",
        "type": {
          "kind": "struct",
          "fields": [{
            "name": "pieceType",
            "type": {
              "defined": "PieceType"
            }
          }, {
            "name": "color",
            "type": {
              "defined": "Player"
            }
          }]
        }
      }, {
        "name": "CastlingRights",
        "type": {
          "kind": "struct",
          "fields": [{
            "name": "whiteKingside",
            "type": "bool"
          }, {
            "name": "whiteQueenside",
            "type": "bool"
          }, {
            "name": "blackKingside",
            "type": "bool"
          }, {
            "name": "blackQueenside",
            "type": "bool"
          }]
        }
      }, {
        "name": "ChessMove",
        "type": {
          "kind": "struct",
          "fields": [{
            "name": "from",
            "type": "u8"
          }, {
            "name": "to",
            "type": "u8"
          }, {
            "name": "promotion",
            "type": {
              "option": {
                "defined": "PieceType"
              }
            }
          }]
        }
      }],
      "errors": [{
        "code": 6000,
        "name": "NotYourTurn",
        "msg": "It's not your turn"
      }, {
        "code": 6001,
        "name": "InvalidMove",
        "msg": "Invalid move"
      }, {
        "code": 6002,
        "name": "GameNotInProgress",
        "msg": "Game is not in progress"
      }, {
        "code": 6003,
        "name": "NotAPlayer",
        "msg": "You are not a player in this game"
      }, {
        "code": 6004,
        "name": "NoDrawOffer",
        "msg": "No draw offer to accept"
      }]
    };
  }

  // Generate game account PDA
  getGamePDA(payer) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("game"), payer.toBuffer()],
      this.programId
    );
  }

  // Initialize a new chess game
  async initializeGame(whitePlayer, blackPlayer) {
    try {
      const [gameAccount] = this.getGamePDA(this.wallet.publicKey);

      console.log('🎮 Initializing game...');
      console.log('📍 Game PDA:', gameAccount.toString());
      console.log('⚪ White Player:', whitePlayer.toString());
      console.log('⚫ Black Player:', blackPlayer.toString());

      const tx = await this.program.methods
        .initializeGame(whitePlayer, blackPlayer)
        .accounts({
          game: gameAccount,
          payer: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('✅ Game initialized! Transaction:', tx);
      return {
        gameAccount,
        transaction: tx
      };
    } catch (error) {
      console.error('❌ Error initializing game:', error);
      throw error;
    }
  }

  // Make a move in the chess game
  async makeMove(gameAccount, fromSquare, toSquare, promotionPiece = 'q') {
    try {
      console.log(`♟️ Making move: ${this.squareToAlgebraic(fromSquare)} -> ${this.squareToAlgebraic(toSquare)}`);
      
      const promotionMap = { q: { queen: {} }, r: { rook: {} }, n: { knight: {} }, b: { bishop: {} } };
      const promotion = promotionPiece ? promotionMap[promotionPiece] : null;
      if (promotion) console.log('👑 Promotion piece:', promotionPiece);
      
      const tx = await this.program.methods
        .makeMove(fromSquare, toSquare, promotion)
        .accounts({
          game: gameAccount,
          player: this.wallet.publicKey,
        })
        .rpc();

      console.log('✅ Move made! Transaction:', tx);
      return tx;
    } catch (error) {
      console.error('❌ Error making move:', error);
      throw error;
    }
  }

  // Resign from the game
  async resign(gameAccount) {
    try {
      console.log('🏳️ Resigning from game...');
      const tx = await this.program.methods
        .resign()
        .accounts({
          game: gameAccount,
          player: this.wallet.publicKey,
        })
        .rpc();
      console.log('✅ Resigned from game! Transaction:', tx);
      return tx;
    } catch (error) {
      console.error('❌ Error resigning:', error);
      throw error;
    }
  }

  // Offer a draw
  async offerDraw(gameAccount) {
    try {
      console.log('🤝 Offering draw...');
      const tx = await this.program.methods
        .offerDraw()
        .accounts({
          game: gameAccount,
          player: this.wallet.publicKey,
        })
        .rpc();
      console.log('✅ Draw offered! Transaction:', tx);
      return tx;
    } catch (error) {
      console.error('❌ Error offering draw:', error);
      throw error;
    }
  }

  // Accept a draw offer
  async acceptDraw(gameAccount) {
    try {
      console.log('✅ Accepting draw...');
      const tx = await this.program.methods
        .acceptDraw()
        .accounts({
          game: gameAccount,
          player: this.wallet.publicKey,
        })
        .rpc();
      console.log('✅ Draw accepted! Transaction:', tx);
      return tx;
    } catch (error) {
      console.error('❌ Error accepting draw:', error);
      throw error;
    }
  }

  // Get game state
  async getGameState(gameAccount) {
    try {
      const gameState = await this.program.account.gameState.fetch(gameAccount);
      return this.parseGameState(gameState);
    } catch (error) {
       if (error.message.includes("Account does not exist")) {
        return null;
      }
      console.error('❌ Error fetching game state:', error);
      throw error;
    }
  }

  // Parse game state for easier reading
  parseGameState(gameState) {
    const players = {
      white: gameState.whitePlayer.toString(),
      black: gameState.blackPlayer.toString()
    };
    const statusMap = {
      inProgress: 'InProgress',
      whiteWins: 'WhiteWins',
      blackWins: 'BlackWins',
      draw: 'Draw'
    };
    const turnMap = {
      white: 'White',
      black: 'Black'
    };
    const status = statusMap[Object.keys(gameState.gameStatus)[0]] || 'Unknown';
    const currentTurn = turnMap[Object.keys(gameState.currentTurn)[0]] || 'Unknown';

    return {
      players,
      currentTurn,
      gameStatus: status,
      winner: gameState.winner ? gameState.winner.toString() : null,
      moveCount: gameState.moveCount,
      fullmoveNumber: gameState.fullmoveNumber,
      halfmoveClock: gameState.halfmoveClock,
      drawOfferedByWhite: gameState.drawOfferedByWhite,
      drawOfferedByBlack: gameState.drawOfferedByBlack,
      enPassantTarget: gameState.enPassantTarget,
      castlingRights: gameState.castlingRights,
      board: this.parseBoard(gameState.board)
    };
  }

  // Parse the board array correctly
  parseBoard(boardArray) {
    const pieceTypeMap = { pawn: 'Pawn', rook: 'Rook', knight: 'Knight', bishop: 'Bishop', queen: 'Queen', king: 'King' };
    const colorMap = { white: 'White', black: 'Black' };
    const board = [];

    for (let row = 0; row < 8; row++) {
      board[row] = [];
      for (let col = 0; col < 8; col++) {
        const piece = boardArray[row][col];
        if (piece === null || piece === undefined) {
          board[row][col] = null;
        } else {
          const pieceTypeKey = Object.keys(piece.pieceType)[0];
          const colorKey = Object.keys(piece.color)[0];
          board[row][col] = {
            type: pieceTypeMap[pieceTypeKey] || 'Unknown',
            color: colorMap[colorKey] || 'Unknown'
          };
        }
      }
    }
    return board;
  }

  // Convert algebraic notation to square number (e.g., "e4" -> 28)
  algebraicToSquare(algebraic) {
    if (!algebraic || algebraic.length !== 2) throw new Error('Invalid algebraic notation');
    const file = algebraic.charCodeAt(0) - 97;
    const rank = parseInt(algebraic[1]) - 1;
    if (file < 0 || file > 7 || rank < 0 || rank > 7) throw new Error('Square out of bounds');
    return rank * 8 + file;
  }

  // Convert square number to algebraic notation (e.g., 28 -> "e4")
  squareToAlgebraic(square) {
    if (square < 0 || square > 63) throw new Error('Square number out of bounds');
    const file = String.fromCharCode(97 + (square % 8));
    const rank = Math.floor(square / 8) + 1;
    return file + rank;
  }
}

export {
  SolanaChessClient
};

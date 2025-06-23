use anchor_lang::prelude::*;

declare_id!("7Le8FobBEEcKUdSY25NdYLpsAXxNSYFD1NGzTB4eZXkw");

#[program]
pub mod chess_game {
    use super::*;

    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        white_player: Pubkey,
        black_player: Pubkey,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        game.white_player = white_player;
        game.black_player = black_player;
        game.current_turn = Player::White;
        game.game_status = GameStatus::InProgress;
        game.move_count = 0;
        game.board = initialize_board();
        game.castling_rights = CastlingRights {
            white_kingside: true,
            white_queenside: true,
            black_kingside: true,
            black_queenside: true,
        };
        game.en_passant_target = None;
        game.halfmove_clock = 0;
        game.fullmove_number = 1;
        game.draw_offered_by_white = false;
        game.draw_offered_by_black = false;
        
        msg!("Chess game initialized between {} and {}", white_player, black_player);
        Ok(())
    }

    pub fn make_move(
        ctx: Context<MakeMove>,
        from_square: u8,
        to_square: u8,
        promotion_piece: Option<PieceType>,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;

        require!(
            (game.current_turn == Player::White && game.white_player == player.key()) ||
            (game.current_turn == Player::Black && game.black_player == player.key()),
            ChessError::NotYourTurn
        );

        require!(
            game.game_status == GameStatus::InProgress,
            ChessError::GameNotInProgress
        );

        let chess_move = ChessMove {
            from: from_square,
            to: to_square,
            promotion: promotion_piece,
        };

        require!(
            is_valid_move(&game.board, &chess_move, game.current_turn, &game.castling_rights, game.en_passant_target),
            ChessError::InvalidMove
        );

        execute_move(game, &chess_move)?;
        check_game_end(game)?;

        game.current_turn = match game.current_turn {
            Player::White => Player::Black,
            Player::Black => Player::White,
        };

        game.move_count += 1;
        
        if game.current_turn == Player::White {
            game.fullmove_number += 1;
        }

        game.draw_offered_by_white = false;
        game.draw_offered_by_black = false;

        msg!("Move made: {} to {}", from_square, to_square);
        Ok(())
    }

    pub fn resign(ctx: Context<ResignGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;

        require!(
            game.white_player == player.key() || game.black_player == player.key(),
            ChessError::NotAPlayer
        );

        require!(
            game.game_status == GameStatus::InProgress,
            ChessError::GameNotInProgress
        );

        if game.white_player == player.key() {
            game.game_status = GameStatus::BlackWins;
            game.winner = Some(game.black_player);
        } else {
            game.game_status = GameStatus::WhiteWins;
            game.winner = Some(game.white_player);
        }

        msg!("Player {} resigned", player.key());
        Ok(())
    }

    pub fn offer_draw(ctx: Context<OfferDraw>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;

        require!(
            game.white_player == player.key() || game.black_player == player.key(),
            ChessError::NotAPlayer
        );

        require!(
            game.game_status == GameStatus::InProgress,
            ChessError::GameNotInProgress
        );

        if game.white_player == player.key() {
            game.draw_offered_by_white = true;
        } else {
            game.draw_offered_by_black = true;
        }

        if game.draw_offered_by_white && game.draw_offered_by_black {
            game.game_status = GameStatus::Draw;
        }

        msg!("Draw offered by {}", player.key());
        Ok(())
    }

    pub fn accept_draw(ctx: Context<AcceptDraw>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;

        require!(
            game.white_player == player.key() || game.black_player == player.key(),
            ChessError::NotAPlayer
        );

        require!(
            game.game_status == GameStatus::InProgress,
            ChessError::GameNotInProgress
        );

        let draw_offered = if game.white_player == player.key() {
            game.draw_offered_by_black
        } else {
            game.draw_offered_by_white
        };

        require!(draw_offered, ChessError::NoDrawOffer);

        game.game_status = GameStatus::Draw;
        msg!("Draw accepted by {}", player.key());
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + GameState::INIT_SPACE,
        seeds = [b"game", payer.key().as_ref()],
        bump
    )]
    pub game: Account<'info, GameState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MakeMove<'info> {
    #[account(mut)]
    pub game: Account<'info, GameState>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResignGame<'info> {
    #[account(mut)]
    pub game: Account<'info, GameState>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct OfferDraw<'info> {
    #[account(mut)]
    pub game: Account<'info, GameState>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct AcceptDraw<'info> {
    #[account(mut)]
    pub game: Account<'info, GameState>,
    pub player: Signer<'info>,
}

#[account]
pub struct GameState {
    pub white_player: Pubkey,
    pub black_player: Pubkey,
    pub current_turn: Player,
    pub game_status: GameStatus,
    pub winner: Option<Pubkey>,
    pub board: [[Option<Piece>; 8]; 8],
    pub move_count: u32,
    pub castling_rights: CastlingRights,
    pub en_passant_target: Option<u8>,
    pub halfmove_clock: u8,
    pub fullmove_number: u32,
    pub draw_offered_by_white: bool,
    pub draw_offered_by_black: bool,
}

impl GameState {
    pub const INIT_SPACE: usize = 32 + 32 + 1 + 1 + 33 + (64 * 9) + 4 + 4 + 2 + 1 + 4 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Player {
    White,
    Black,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum GameStatus {
    InProgress,
    WhiteWins,
    BlackWins,
    Draw,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub struct Piece {
    pub piece_type: PieceType,
    pub color: Player,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PieceType {
    Pawn,
    Rook,
    Knight,
    Bishop,
    Queen,
    King,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct CastlingRights {
    pub white_kingside: bool,
    pub white_queenside: bool,
    pub black_kingside: bool,
    pub black_queenside: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct ChessMove {
    pub from: u8,
    pub to: u8,
    pub promotion: Option<PieceType>,
}

fn initialize_board() -> [[Option<Piece>; 8]; 8] {
    let mut board = [[None; 8]; 8];
    
    board[0] = [
        Some(Piece { piece_type: PieceType::Rook, color: Player::White }),
        Some(Piece { piece_type: PieceType::Knight, color: Player::White }),
        Some(Piece { piece_type: PieceType::Bishop, color: Player::White }),
        Some(Piece { piece_type: PieceType::Queen, color: Player::White }),
        Some(Piece { piece_type: PieceType::King, color: Player::White }),
        Some(Piece { piece_type: PieceType::Bishop, color: Player::White }),
        Some(Piece { piece_type: PieceType::Knight, color: Player::White }),
        Some(Piece { piece_type: PieceType::Rook, color: Player::White }),
    ];
    
    for i in 0..8 {
        board[1][i] = Some(Piece { piece_type: PieceType::Pawn, color: Player::White });
    }
    
    board[7] = [
        Some(Piece { piece_type: PieceType::Rook, color: Player::Black }),
        Some(Piece { piece_type: PieceType::Knight, color: Player::Black }),
        Some(Piece { piece_type: PieceType::Bishop, color: Player::Black }),
        Some(Piece { piece_type: PieceType::Queen, color: Player::Black }),
        Some(Piece { piece_type: PieceType::King, color: Player::Black }),
        Some(Piece { piece_type: PieceType::Bishop, color: Player::Black }),
        Some(Piece { piece_type: PieceType::Knight, color: Player::Black }),
        Some(Piece { piece_type: PieceType::Rook, color: Player::Black }),
    ];
    
    for i in 0..8 {
        board[6][i] = Some(Piece { piece_type: PieceType::Pawn, color: Player::Black });
    }
    
    board
}

fn square_to_coords(square: u8) -> (usize, usize) {
    let row = (square / 8) as usize;
    let col = (square % 8) as usize;
    (row, col)
}

fn coords_to_square(row: usize, col: usize) -> u8 {
    (row * 8 + col) as u8
}

fn is_valid_move(
    board: &[[Option<Piece>; 8]; 8],
    chess_move: &ChessMove,
    current_player: Player,
    castling_rights: &CastlingRights,
    en_passant_target: Option<u8>,
) -> bool {
    let (from_row, from_col) = square_to_coords(chess_move.from);
    let (to_row, to_col) = square_to_coords(chess_move.to);
    
    if from_row >= 8 || from_col >= 8 || to_row >= 8 || to_col >= 8 {
        return false;
    }
    
    let piece = match board[from_row][from_col] {
        Some(p) => p,
        None => return false,
    };
    
    if piece.color != current_player {
        return false;
    }
    
    if let Some(dest_piece) = board[to_row][to_col] {
        if dest_piece.color == current_player {
            return false;
        }
    }
    
    match piece.piece_type {
        PieceType::Pawn => is_valid_pawn_move(board, chess_move, current_player, en_passant_target),
        PieceType::Rook => is_valid_rook_move(board, chess_move),
        PieceType::Knight => is_valid_knight_move(chess_move),
        PieceType::Bishop => is_valid_bishop_move(board, chess_move),
        PieceType::Queen => is_valid_queen_move(board, chess_move),
        PieceType::King => is_valid_king_move(board, chess_move, current_player, castling_rights),
    }
}

fn is_valid_pawn_move(
    board: &[[Option<Piece>; 8]; 8],
    chess_move: &ChessMove,
    current_player: Player,
    en_passant_target: Option<u8>,
) -> bool {
    let (from_row, from_col) = square_to_coords(chess_move.from);
    let (to_row, to_col) = square_to_coords(chess_move.to);
    
    let direction = if current_player == Player::White { 1 } else { -1 };
    let start_row = if current_player == Player::White { 1 } else { 6 };
    
    let row_diff = (to_row as i8) - (from_row as i8);
    let col_diff = (to_col as i8) - (from_col as i8);
    
    if col_diff == 0 {
        if board[to_row][to_col].is_some() {
            return false;
        }
        
        if row_diff == direction {
            return true;
        }
        
        if from_row == start_row && row_diff == 2 * direction {
            return true;
        }
    }
    
    if col_diff.abs() == 1 && row_diff == direction {
        if board[to_row][to_col].is_some() {
            return true;
        }
        
        if let Some(ep_target) = en_passant_target {
            if chess_move.to == ep_target {
                return true;
            }
        }
    }
    
    false
}

fn is_valid_rook_move(board: &[[Option<Piece>; 8]; 8], chess_move: &ChessMove) -> bool {
    let (from_row, from_col) = square_to_coords(chess_move.from);
    let (to_row, to_col) = square_to_coords(chess_move.to);
    
    if from_row != to_row && from_col != to_col {
        return false;
    }
    
    is_path_clear(board, from_row, from_col, to_row, to_col)
}

fn is_valid_knight_move(chess_move: &ChessMove) -> bool {
    let (from_row, from_col) = square_to_coords(chess_move.from);
    let (to_row, to_col) = square_to_coords(chess_move.to);
    
    let row_diff = ((to_row as i8) - (from_row as i8)).abs();
    let col_diff = ((to_col as i8) - (from_col as i8)).abs();
    
    (row_diff == 2 && col_diff == 1) || (row_diff == 1 && col_diff == 2)
}

fn is_valid_bishop_move(board: &[[Option<Piece>; 8]; 8], chess_move: &ChessMove) -> bool {
    let (from_row, from_col) = square_to_coords(chess_move.from);
    let (to_row, to_col) = square_to_coords(chess_move.to);
    
    let row_diff = ((to_row as i8) - (from_row as i8)).abs();
    let col_diff = ((to_col as i8) - (from_col as i8)).abs();
    
    if row_diff != col_diff {
        return false;
    }
    
    is_path_clear(board, from_row, from_col, to_row, to_col)
}

fn is_valid_queen_move(board: &[[Option<Piece>; 8]; 8], chess_move: &ChessMove) -> bool {
    is_valid_rook_move(board, chess_move) || is_valid_bishop_move(board, chess_move)
}

fn is_valid_king_move(
    board: &[[Option<Piece>; 8]; 8],
    chess_move: &ChessMove,
    current_player: Player,
    castling_rights: &CastlingRights,
) -> bool {
    let (from_row, from_col) = square_to_coords(chess_move.from);
    let (to_row, to_col) = square_to_coords(chess_move.to);
    
    let row_diff = ((to_row as i8) - (from_row as i8)).abs();
    let col_diff = ((to_col as i8) - (from_col as i8)).abs();
    
    if row_diff <= 1 && col_diff <= 1 {
        return true;
    }
    
    if row_diff == 0 && col_diff == 2 {
        return is_valid_castling(board, chess_move, current_player, castling_rights);
    }
    
    false
}

fn is_valid_castling(
    board: &[[Option<Piece>; 8]; 8],
    chess_move: &ChessMove,
    current_player: Player,
    castling_rights: &CastlingRights,
) -> bool {
    let (from_row, from_col) = square_to_coords(chess_move.from);
    let (_, to_col) = square_to_coords(chess_move.to);
    
    let king_start_col = 4;
    if from_col != king_start_col {
        return false;
    }
    
    let expected_row = if current_player == Player::White { 0 } else { 7 };
    if from_row != expected_row {
        return false;
    }
    
    let is_kingside = to_col > from_col;
    
    let can_castle = match (current_player, is_kingside) {
        (Player::White, true) => castling_rights.white_kingside,
        (Player::White, false) => castling_rights.white_queenside,
        (Player::Black, true) => castling_rights.black_kingside,
        (Player::Black, false) => castling_rights.black_queenside,
    };
    
    if !can_castle {
        return false;
    }
    
    let rook_col = if is_kingside { 7 } else { 0 };
    let path_clear = is_path_clear(board, from_row, from_col, from_row, rook_col);
    
    if !path_clear {
        return false;
    }
    
    true
}

fn is_path_clear(
    board: &[[Option<Piece>; 8]; 8],
    from_row: usize,
    from_col: usize,
    to_row: usize,
    to_col: usize,
) -> bool {
    let row_step = if to_row > from_row {
        1
    } else if to_row < from_row {
        -1
    } else {
        0
    };
    
    let col_step = if to_col > from_col {
        1
    } else if to_col < from_col {
        -1
    } else {
        0
    };
    
    let mut current_row = from_row as i8 + row_step;
    let mut current_col = from_col as i8 + col_step;
    
    while current_row != to_row as i8 || current_col != to_col as i8 {
        if board[current_row as usize][current_col as usize].is_some() {
            return false;
        }
        current_row += row_step;
        current_col += col_step;
    }
    
    true
}

fn execute_move(game: &mut GameState, chess_move: &ChessMove) -> Result<()> {
    let (from_row, from_col) = square_to_coords(chess_move.from);
    let (to_row, to_col) = square_to_coords(chess_move.to);
    
    let piece = game.board[from_row][from_col].unwrap();
    
    match piece.piece_type {
        PieceType::King => {
            if ((to_col as i8) - (from_col as i8)).abs() == 2 {
                let is_kingside = to_col > from_col;
                let rook_from_col = if is_kingside { 7 } else { 0 };
                let rook_to_col = if is_kingside { 5 } else { 3 };
                
                let rook = game.board[from_row][rook_from_col].unwrap();
                game.board[from_row][rook_from_col] = None;
                game.board[from_row][rook_to_col] = Some(rook);
            }
            
            if piece.color == Player::White {
                game.castling_rights.white_kingside = false;
                game.castling_rights.white_queenside = false;
            } else {
                game.castling_rights.black_kingside = false;
                game.castling_rights.black_queenside = false;
            }
        }
        PieceType::Rook => {
            if from_row == 0 && from_col == 0 {
                game.castling_rights.white_queenside = false;
            } else if from_row == 0 && from_col == 7 {
                game.castling_rights.white_kingside = false;
            } else if from_row == 7 && from_col == 0 {
                game.castling_rights.black_queenside = false;
            } else if from_row == 7 && from_col == 7 {
                game.castling_rights.black_kingside = false;
            }
        }
        PieceType::Pawn => {
            if let Some(ep_target) = game.en_passant_target {
                if chess_move.to == ep_target {
                    let captured_pawn_row = if piece.color == Player::White { to_row - 1 } else { to_row + 1 };
                    game.board[captured_pawn_row][to_col] = None;
                }
            }
            
            if ((to_row as i8) - (from_row as i8)).abs() == 2 {
                let ep_row = if piece.color == Player::White { from_row + 1 } else { from_row - 1 };
                game.en_passant_target = Some(coords_to_square(ep_row, from_col));
            } else {
                game.en_passant_target = None;
            }
            
            if (piece.color == Player::White && to_row == 7) || (piece.color == Player::Black && to_row == 0) {
                let promoted_piece_type = chess_move.promotion.unwrap_or(PieceType::Queen);
                game.board[to_row][to_col] = Some(Piece {
                    piece_type: promoted_piece_type,
                    color: piece.color,
                });
                game.board[from_row][from_col] = None;
                return Ok(());
            }
        }
        _ => {
            game.en_passant_target = None;
        }
    }
    
    game.board[to_row][to_col] = Some(piece);
    game.board[from_row][from_col] = None;
    
    if piece.piece_type == PieceType::Pawn || game.board[to_row][to_col].is_some() {
        game.halfmove_clock = 0;
    } else {
        game.halfmove_clock += 1;
    }
    
    Ok(())
}

fn check_game_end(game: &mut GameState) -> Result<()> {
    if game.halfmove_clock >= 100 {
        game.game_status = GameStatus::Draw;
        return Ok(());
    }
    
    Ok(())
}

#[error_code]
pub enum ChessError {
    #[msg("It's not your turn")]
    NotYourTurn,
    #[msg("Invalid move")]
    InvalidMove,
    #[msg("Game is not in progress")]
    GameNotInProgress,
    #[msg("You are not a player in this game")]
    NotAPlayer,
    #[msg("No draw offer to accept")]
    NoDrawOffer,
}

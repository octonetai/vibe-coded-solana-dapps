use anchor_lang::prelude::*;

declare_id!("FoHCiuKzML2o3b6GkG1kE27XaTRAiTAnzSSwobJpiR6S");

#[program]
pub mod presale_program {
    use super::*;

    pub fn create_pool(
        ctx: Context<CreatePool>,
        expiry_timestamp: i64,
        min_deposit: u64,
        max_deposit: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        require!(expiry_timestamp > clock.unix_timestamp, PresaleError::InvalidExpiryTime);
        require!(min_deposit > 0, PresaleError::InvalidDepositAmount);
        require!(max_deposit >= min_deposit, PresaleError::InvalidDepositAmount);

        pool.owner = ctx.accounts.owner.key();
        pool.expiry_timestamp = expiry_timestamp;
        pool.total_raised = 0;
        pool.min_deposit = min_deposit;
        pool.max_deposit = max_deposit;
        pool.is_claimed = false;
        pool.depositor_count = 0;
        pool.bump = ctx.bumps.pool;

        emit!(PoolCreated {
            pool: pool.key(),
            owner: pool.owner,
            expiry_timestamp,
            min_deposit,
            max_deposit,
        });

        Ok(())
    }

    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        // Check if pool is still active
        require!(clock.unix_timestamp < pool.expiry_timestamp, PresaleError::PoolExpired);
        
        // Check deposit amount limits
        require!(amount >= pool.min_deposit, PresaleError::DepositTooLow);
        require!(amount <= pool.max_deposit, PresaleError::DepositTooHigh);

        // Transfer SOL from depositor to pool vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.depositor.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        // Update or create depositor record
        let depositor_record = &mut ctx.accounts.depositor_record;
        if depositor_record.amount == 0 {
            // New depositor
            pool.depositor_count += 1;
            depositor_record.depositor = ctx.accounts.depositor.key();
            depositor_record.pool = pool.key();
        }
        
        depositor_record.amount += amount;
        depositor_record.timestamp = clock.unix_timestamp;
        
        pool.total_raised += amount;

        emit!(DepositMade {
            pool: pool.key(),
            depositor: ctx.accounts.depositor.key(),
            amount,
            total_deposit: depositor_record.amount,
            pool_total: pool.total_raised,
        });

        Ok(())
    }

    pub fn claim_funds(ctx: Context<ClaimFunds>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        // Check if pool has expired
        require!(clock.unix_timestamp >= pool.expiry_timestamp, PresaleError::PoolNotExpired);
        
        // Check if funds haven't been claimed yet
        require!(!pool.is_claimed, PresaleError::AlreadyClaimed);
        
        // Check if caller is the pool owner
        require!(pool.owner == ctx.accounts.owner.key(), PresaleError::Unauthorized);

        let amount_to_claim = ctx.accounts.pool_vault.lamports();
        
        // Transfer SOL from pool vault to owner
        **ctx.accounts.pool_vault.try_borrow_mut_lamports()? -= amount_to_claim;
        **ctx.accounts.owner.try_borrow_mut_lamports()? += amount_to_claim;

        pool.is_claimed = true;

        emit!(FundsClaimed {
            pool: pool.key(),
            owner: pool.owner,
            amount: amount_to_claim,
        });

        Ok(())
    }

    pub fn get_pool_info(ctx: Context<GetPoolInfo>) -> Result<PoolInfo> {
        let pool = &ctx.accounts.pool;
        
        Ok(PoolInfo {
            owner: pool.owner,
            expiry_timestamp: pool.expiry_timestamp,
            total_raised: pool.total_raised,
            min_deposit: pool.min_deposit,
            max_deposit: pool.max_deposit,
            is_claimed: pool.is_claimed,
            depositor_count: pool.depositor_count,
        })
    }
}

#[derive(Accounts)]
pub struct CreatePool<'info> {
    #[account(
        init,
        payer = owner,
        space = Pool::SPACE,
        seeds = [b"pool", owner.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    
    #[account(
        init,
        payer = owner,
        space = 0,
        seeds = [b"vault", pool.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as a vault to hold SOL
    pub pool_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    
    #[account(
        mut,
        seeds = [b"vault", pool.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as a vault to hold SOL
    pub pool_vault: AccountInfo<'info>,
    
    #[account(
        init_if_needed,
        payer = depositor,
        space = DepositorRecord::SPACE,
        seeds = [b"depositor", pool.key().as_ref(), depositor.key().as_ref()],
        bump
    )]
    pub depositor_record: Account<'info, DepositorRecord>,
    
    #[account(mut)]
    pub depositor: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimFunds<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    
    #[account(
        mut,
        seeds = [b"vault", pool.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as a vault to hold SOL
    pub pool_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetPoolInfo<'info> {
    pub pool: Account<'info, Pool>,
}

#[account]
pub struct Pool {
    pub owner: Pubkey,
    pub expiry_timestamp: i64,
    pub total_raised: u64,
    pub min_deposit: u64,
    pub max_deposit: u64,
    pub is_claimed: bool,
    pub depositor_count: u32,
    pub bump: u8,
}

impl Pool {
    pub const SPACE: usize = 8 + 32 + 8 + 8 + 8 + 8 + 1 + 4 + 1;
}

#[account]
pub struct DepositorRecord {
    pub depositor: Pubkey,
    pub pool: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

impl DepositorRecord {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PoolInfo {
    pub owner: Pubkey,
    pub expiry_timestamp: i64,
    pub total_raised: u64,
    pub min_deposit: u64,
    pub max_deposit: u64,    
    pub is_claimed: bool,
    pub depositor_count: u32,
}

#[event]
pub struct PoolCreated {
    pub pool: Pubkey,
    pub owner: Pubkey,
    pub expiry_timestamp: i64,
    pub min_deposit: u64,
    pub max_deposit: u64,
}

#[event]
pub struct DepositMade {
    pub pool: Pubkey,
    pub depositor: Pubkey,
    pub amount: u64,
    pub total_deposit: u64,
    pub pool_total: u64,
}

#[event]
pub struct FundsClaimed {
    pub pool: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum PresaleError {
    #[msg("Invalid expiry time - must be in the future")]
    InvalidExpiryTime,
    #[msg("Invalid deposit amount")]
    InvalidDepositAmount,
    #[msg("Pool has expired")]
    PoolExpired,
    #[msg("Deposit amount is too low")]
    DepositTooLow,
    #[msg("Deposit amount is too high")]
    DepositTooHigh,
    #[msg("Pool has not expired yet")]
    PoolNotExpired,
    #[msg("Funds have already been claimed")]
    AlreadyClaimed,
    #[msg("Unauthorized - only pool owner can perform this action")]
    Unauthorized,
}

use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;

declare_id!("A8aaqLS7S5bts7mjapKtgTMJWakNNNm6KzQZrs1hbrpU");

#[program]
pub mod anonymous_confessions {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let confession_state = &mut ctx.accounts.confession_state;
        confession_state.total_confessions = 0;
        confession_state.admin = ctx.accounts.admin.key();
        Ok(())
    }

    pub fn post_confession(
        ctx: Context<PostConfession>,
        content: String,
        salt: String,
        category: u8,
    ) -> Result<()> {
        require!(content.len() <= 500, ErrorCode::ContentTooLong);
        require!(content.len() >= 10, ErrorCode::ContentTooShort);
        require!(salt.len() >= 8, ErrorCode::SaltTooShort);
        require!(category <= 10, ErrorCode::InvalidCategory);

        let confession_state = &mut ctx.accounts.confession_state;
        let confession = &mut ctx.accounts.confession;

        // Create fingerprint using user's public key + salt + current slot
        let clock = Clock::get()?;
        let fingerprint_data = format!(
            "{}{}{}",
            ctx.accounts.user.key(),
            salt,
            clock.slot
        );
        let fingerprint_hash = hash(fingerprint_data.as_bytes());
        let fingerprint = format!("{:x}", fingerprint_hash.to_bytes()[0]);

        // Check for potential spam (same user posting too frequently)
        require!(
            clock.slot > confession_state.last_confession_slot + 100, // ~40 seconds minimum between posts
            ErrorCode::PostingTooFrequently
        );

        confession.id = confession_state.total_confessions;
        confession.content = content;
        confession.fingerprint = fingerprint;
        confession.category = category;
        confession.timestamp = clock.unix_timestamp;
        confession.slot = clock.slot;
        confession.likes = 0;
        confession.reports = 0;
        confession.is_hidden = false;

        confession_state.total_confessions += 1;
        confession_state.last_confession_slot = clock.slot;

        emit!(ConfessionPosted {
            id: confession.id,
            fingerprint: confession.fingerprint.clone(),
            category: confession.category,
            timestamp: confession.timestamp,
        });

        Ok(())
    }

    pub fn like_confession(ctx: Context<LikeConfession>) -> Result<()> {
        let confession = &mut ctx.accounts.confession;
        let like_record = &mut ctx.accounts.like_record;

        require!(!confession.is_hidden, ErrorCode::ConfessionHidden);
        require!(!like_record.has_liked, ErrorCode::AlreadyLiked);

        confession.likes += 1;
        like_record.has_liked = true;
        like_record.user = ctx.accounts.user.key();
        like_record.confession_id = confession.id;

        emit!(ConfessionLiked {
            confession_id: confession.id,
            total_likes: confession.likes,
        });

        Ok(())
    }

    pub fn report_confession(ctx: Context<ReportConfession>, reason: String) -> Result<()> {
        require!(reason.len() <= 100, ErrorCode::ReasonTooLong);
        require!(reason.len() >= 5, ErrorCode::ReasonTooShort);

        let confession = &mut ctx.accounts.confession;
        let report_record = &mut ctx.accounts.report_record;

        require!(!confession.is_hidden, ErrorCode::ConfessionHidden);
        require!(!report_record.has_reported, ErrorCode::AlreadyReported);

        confession.reports += 1;
        report_record.has_reported = true;
        report_record.user = ctx.accounts.user.key();
        report_record.confession_id = confession.id;
        report_record.reason = reason;

        // Auto-hide confession if it receives too many reports
        if confession.reports >= 10 {
            confession.is_hidden = true;
        }

        emit!(ConfessionReported {
            confession_id: confession.id,
            total_reports: confession.reports,
            is_hidden: confession.is_hidden,
        });

        Ok(())
    }

    pub fn get_confessions_by_category(
        _ctx: Context<GetConfessions>,
        category: u8,
        _start_id: u64,
        limit: u8,
    ) -> Result<Vec<u64>> {
        require!(category <= 10, ErrorCode::InvalidCategory);
        require!(limit <= 50, ErrorCode::LimitTooHigh);
        
        // This would typically return confession IDs for the frontend to fetch
        // In a real implementation, you'd iterate through confession accounts
        let confession_ids: Vec<u64> = vec![];
        Ok(confession_ids)
    }

    pub fn moderate_confession(ctx: Context<ModerateConfession>, hide: bool) -> Result<()> {
        let confession_state = &ctx.accounts.confession_state;
        require!(
            ctx.accounts.admin.key() == confession_state.admin,
            ErrorCode::Unauthorized
        );

        let confession = &mut ctx.accounts.confession;
        confession.is_hidden = hide;

        emit!(ConfessionModerated {
            confession_id: confession.id,
            is_hidden: hide,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 8 + 8, // discriminator + admin + total_confessions + last_confession_slot
        seeds = [b"confession_state"],
        bump
    )]
    pub confession_state: Account<'info, ConfessionState>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PostConfession<'info> {
    #[account(
        mut,
        seeds = [b"confession_state"],
        bump
    )]
    pub confession_state: Account<'info, ConfessionState>,
    
    #[account(
        init,
        payer = user,
        space = 8 + 8 + 500 + 20 + 1 + 8 + 8 + 8 + 8 + 1, // discriminator + id + content + fingerprint + category + timestamp + slot + likes + reports + is_hidden
        seeds = [b"confession", confession_state.total_confessions.to_le_bytes().as_ref()],
        bump
    )]
    pub confession: Account<'info, Confession>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LikeConfession<'info> {
    #[account(mut)]
    pub confession: Account<'info, Confession>,
    
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 1, // discriminator + user + confession_id + has_liked
        seeds = [b"like", user.key().as_ref(), confession.id.to_le_bytes().as_ref()],
        bump
    )]
    pub like_record: Account<'info, LikeRecord>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReportConfession<'info> {
    #[account(mut)]
    pub confession: Account<'info, Confession>,
    
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 1 + 100, // discriminator + user + confession_id + has_reported + reason
        seeds = [b"report", user.key().as_ref(), confession.id.to_le_bytes().as_ref()],
        bump
    )]
    pub report_record: Account<'info, ReportRecord>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetConfessions<'info> {
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct ModerateConfession<'info> {
    #[account(
        seeds = [b"confession_state"],
        bump
    )]
    pub confession_state: Account<'info, ConfessionState>,
    
    #[account(mut)]
    pub confession: Account<'info, Confession>,
    
    pub admin: Signer<'info>,
}

#[account]
pub struct ConfessionState {
    pub admin: Pubkey,
    pub total_confessions: u64,
    pub last_confession_slot: u64,
}

#[account]
pub struct Confession {
    pub id: u64,
    pub content: String,
    pub fingerprint: String,
    pub category: u8,
    pub timestamp: i64,
    pub slot: u64,
    pub likes: u64,
    pub reports: u64,
    pub is_hidden: bool,
}

#[account]
pub struct LikeRecord {
    pub user: Pubkey,
    pub confession_id: u64,
    pub has_liked: bool,
}

#[account]
pub struct ReportRecord {
    pub user: Pubkey,
    pub confession_id: u64,
    pub has_reported: bool,
    pub reason: String,
}

#[event]
pub struct ConfessionPosted {
    pub id: u64,
    pub fingerprint: String,
    pub category: u8,
    pub timestamp: i64,
}

#[event]
pub struct ConfessionLiked {
    pub confession_id: u64,
    pub total_likes: u64,
}

#[event]
pub struct ConfessionReported {
    pub confession_id: u64,
    pub total_reports: u64,
    pub is_hidden: bool,
}

#[event]
pub struct ConfessionModerated {
    pub confession_id: u64,
    pub is_hidden: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Content must be between 10-500 characters")]
    ContentTooLong,
    #[msg("Content must be at least 10 characters")]
    ContentTooShort,
    #[msg("Salt must be at least 8 characters")]
    SaltTooShort,
    #[msg("Invalid category (0-10)")]
    InvalidCategory,
    #[msg("Please wait before posting again")]
    PostingTooFrequently,
    #[msg("Already liked this confession")]
    AlreadyLiked,
    #[msg("Already reported this confession")]
    AlreadyReported,
    #[msg("Confession is hidden")]
    ConfessionHidden,
    #[msg("Reason must be between 5-100 characters")]
    ReasonTooLong,
    #[msg("Reason must be at least 5 characters")]
    ReasonTooShort,
    #[msg("Limit cannot exceed 50")]
    LimitTooHigh,
    #[msg("Unauthorized action")]
    Unauthorized,
}

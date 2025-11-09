use anchor_lang::prelude::*;

declare_id!("HDNJ2F8CMHksj2EzuutDZiHrduCyi4KLZGabpdCs5BfZ");

#[program]
pub mod checkin {
    use super::*;

    /// 初始化用户的 PDA 账户
    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_pda = &mut ctx.accounts.user_pda;
        user_pda.authority = ctx.accounts.authority.key();
        // Anchor 0.32.x：用字段读取 bump（不再用 ctx.bumps.get(...)）
        user_pda.bump = ctx.bumps.user_pda;
        user_pda.last_checkin_slot = 0;
        user_pda.last_checkin_ts = 0;
        user_pda.count = 0;
        Ok(())
    }

    /// 签到：更新最近一次 slot/时间与累计次数
    pub fn checkin(ctx: Context<Checkin>) -> Result<()> {
        let clock = Clock::get()?;
        let user_pda = &mut ctx.accounts.user_pda;

        // 确认签名者与账户绑定的 authority 一致
        require_keys_eq!(
            user_pda.authority,
            ctx.accounts.authority.key(),
            ErrorCode::InvalidAuthority
        );

        user_pda.last_checkin_slot = clock.slot;
        user_pda.last_checkin_ts = clock.unix_timestamp;
        user_pda.count = user_pda
            .count
            .checked_add(1)
            .ok_or(ErrorCode::Overflow)?;

        Ok(())
    }
}

/* --------------------------- Accounts 定义 --------------------------- */

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    /// 用户专属 PDA：种子 = ["user", authority]
    #[account(
        init,
        payer = authority,
        space = 8 + UserPda::SIZE,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user_pda: Account<'info, UserPda>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Checkin<'info> {
    /// 访问同一 PDA：用已存的 bump 进行校验
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump = user_pda.bump
    )]
    pub user_pda: Account<'info, UserPda>,

    pub authority: Signer<'info>,
}

/* ----------------------------- 数据结构 ----------------------------- */

#[account]
pub struct UserPda {
    pub authority: Pubkey,      // 32
    pub bump: u8,               // 1
    pub last_checkin_slot: u64, // 8
    pub last_checkin_ts: i64,   // 8
    pub count: u64,             // 8
}

impl UserPda {
    // 账户大小（不含 8 字节 discriminator）
    pub const SIZE: usize = 32 + 1 + 8 + 8 + 8;
}

/* ------------------------------- 错误码 ------------------------------ */

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid authority for this user PDA")]
    InvalidAuthority,
    #[msg("Arithmetic overflow")]
    Overflow,
}

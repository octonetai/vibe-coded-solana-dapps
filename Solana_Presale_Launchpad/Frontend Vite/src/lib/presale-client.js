import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

/**
 * Complete Solana Presale Client Implementation
 * Ready-to-use client for interacting with your presale program
 */
class PresaleClient {
  constructor(wallet, connection, programId = 'FoHCiuKzML2o3b6GkG1kE27XaTRAiTAnzSSwobJpiR6S') {
    this.connection = connection;
    this.programId = new PublicKey(programId);
    this.wallet = wallet;
  }

  /**
   * Get pool PDA
   */
  getPoolPDA(owner) {
    const [poolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool'), owner.toBuffer()],
      this.programId
    );
    return poolPDA;
  }

  /**
   * Get vault PDA
   */
  getVaultPDA(pool) {
    const [vaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), pool.toBuffer()],
      this.programId
    );
    return vaultPDA;
  }

  /**
   * Get depositor record PDA
   */
  getDepositorRecordPDA(pool, depositor) {
    const [depositorRecordPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('depositor'), pool.toBuffer(), depositor.toBuffer()],
      this.programId
    );
    return depositorRecordPDA;
  }

  /**
   * Create instruction data for create_pool
   */
  createPoolInstructionData(expiryTimestamp, minDepositLamports, maxDepositLamports) {
    const discriminator = Buffer.from([233, 146, 209, 142, 207, 104, 64, 188]);
    const data = Buffer.alloc(8 + 8 + 8 + 8);
    discriminator.copy(data, 0);
    data.writeBigInt64LE(BigInt(expiryTimestamp), 8);
    data.writeBigUInt64LE(BigInt(minDepositLamports), 16);
    data.writeBigUInt64LE(BigInt(maxDepositLamports), 24);
    return data;
  }

  /**
   * Create instruction data for deposit_sol
   */
  depositSolInstructionData(amountLamports) {
    const discriminator = Buffer.from([108, 81, 78, 117, 125, 155, 56, 200]);
    const data = Buffer.alloc(8 + 8);
    discriminator.copy(data, 0);
    data.writeBigUInt64LE(BigInt(amountLamports), 8);
    return data;
  }

  /**
   * Create instruction data for claim_funds
   */
  claimFundsInstructionData() {
    return Buffer.from([145, 36, 143, 242, 168, 66, 200, 155]);
  }

  /**
   * Create a presale pool
   */
  async createPool(expiryTimestamp, minDepositSOL, maxDepositSOL) {
    if (!this.wallet || !this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const owner = this.wallet.publicKey;
    const pool = this.getPoolPDA(owner);
    const poolVault = this.getVaultPDA(pool);

    const minDepositLamports = minDepositSOL * LAMPORTS_PER_SOL;
    const maxDepositLamports = maxDepositSOL * LAMPORTS_PER_SOL;

    const instruction = {
      programId: this.programId,
      keys: [
        { pubkey: pool, isSigner: false, isWritable: true },
        { pubkey: poolVault, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: this.createPoolInstructionData(expiryTimestamp, minDepositLamports, maxDepositLamports),
    };

    const transaction = new Transaction().add(instruction);
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = owner;

    const signedTransaction = await this.wallet.signTransaction(transaction);
    const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
    
    await this.connection.confirmTransaction(signature, 'confirmed');

    return {
      signature,
      pool: pool.toString(),
      vault: poolVault.toString(),
    };
  }

  /**
   * Deposit SOL into a pool
   */
  async depositSOL(poolAddress, amountSOL) {
    if (!this.wallet || !this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const pool = new PublicKey(poolAddress);
    const poolVault = this.getVaultPDA(pool);
    const depositor = this.wallet.publicKey;
    const depositorRecord = this.getDepositorRecordPDA(pool, depositor);

    const amountLamports = amountSOL * LAMPORTS_PER_SOL;

    const instruction = {
      programId: this.programId,
      keys: [
        { pubkey: pool, isSigner: false, isWritable: true },
        { pubkey: poolVault, isSigner: false, isWritable: true },
        { pubkey: depositorRecord, isSigner: false, isWritable: true },
        { pubkey: depositor, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: this.depositSolInstructionData(amountLamports),
    };

    const transaction = new Transaction().add(instruction);
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = depositor;

    const signedTransaction = await this.wallet.signTransaction(transaction);
    const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
    
    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }

  /**
   * Claim funds from an expired pool
   */
  async claimFunds(poolAddress) {
    if (!this.wallet || !this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const pool = new PublicKey(poolAddress);
    const poolVault = this.getVaultPDA(pool);
    const owner = this.wallet.publicKey;

    const instruction = {
      programId: this.programId,
      keys: [
        { pubkey: pool, isSigner: false, isWritable: true },
        { pubkey: poolVault, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: true },
      ],
      data: this.claimFundsInstructionData(),
    };

    const transaction = new Transaction().add(instruction);
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = owner;

    const signedTransaction = await this.wallet.signTransaction(transaction);
    const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
    
    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }

  /**
   * Get pool information
   */
  async getPoolInfo(poolAddress) {
    const pool = new PublicKey(poolAddress);
    const accountInfo = await this.connection.getAccountInfo(pool);

    if (!accountInfo) {
      throw new Error('Pool not found');
    }

    const data = accountInfo.data;
    let offset = 8; 

    const owner = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    const expiryTimestamp = Number(data.readBigInt64LE(offset));
    offset += 8;
    const totalRaised = Number(data.readBigUInt64LE(offset));
    offset += 8;
    const minDeposit = Number(data.readBigUInt64LE(offset));
    offset += 8;
    const maxDeposit = Number(data.readBigUInt64LE(offset));
    offset += 8;
    const isClaimed = data[offset] === 1;
    offset += 1;
    const depositorCount = data.readUInt32LE(offset);

    return {
      address: poolAddress,
      owner: owner.toString(),
      expiryTimestamp,
      expiryDate: new Date(expiryTimestamp * 1000),
      totalRaised: totalRaised / LAMPORTS_PER_SOL,
      minDeposit: minDeposit / LAMPORTS_PER_SOL,
      maxDeposit: maxDeposit / LAMPORTS_PER_SOL,
      isClaimed,
      depositorCount,
      isExpired: Date.now() / 1000 > expiryTimestamp,
    };
  }

  /**
   * Get all depositors for a pool
   */
  async getAllDepositors(poolAddress) {
    const pool = new PublicKey(poolAddress);
    const depositorRecords = await this.connection.getProgramAccounts(
      this.programId,
      {
        filters: [
          { dataSize: 88 },
          { memcmp: { offset: 40, bytes: pool.toBase58() } },
        ],
      }
    );

    const depositors = depositorRecords.map(({ account, pubkey }) => {
      const data = account.data;
      let offset = 8;
      const depositor = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;
      const poolPubkey = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;
      const amount = Number(data.readBigUInt64LE(offset));
      offset += 8;
      const timestamp = Number(data.readBigInt64LE(offset));
      
      return {
        address: pubkey.toString(),
        depositor: depositor.toString(),
        pool: poolPubkey.toString(),
        amount: amount / LAMPORTS_PER_SOL,
        timestamp,
        date: new Date(timestamp * 1000),
      };
    });

    return depositors.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Request airdrop (devnet only)
   */
  async requestAirdrop(amountSOL = 1) {
    if (!this.wallet || !this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    const signature = await this.connection.requestAirdrop(
      this.wallet.publicKey,
      amountSOL * LAMPORTS_PER_SOL
    );
    await this.connection.confirmTransaction(signature, 'confirmed');
    return signature;
  }
}

export default PresaleClient;

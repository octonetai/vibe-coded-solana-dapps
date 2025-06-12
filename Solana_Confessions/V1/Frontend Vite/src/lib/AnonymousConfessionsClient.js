import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  clusterApiUrl,
} from '@solana/web3.js';
import { Program, AnchorProvider, web3, utils, BN } from '@project-serum/anchor';
import { Buffer } from 'buffer';

// Program IDL - Generated from your Anchor program
const IDL = {
  "version": "0.1.0",
  "name": "anonymous_confessions",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "confessionState", "isMut": true, "isSigner": false },
        { "name": "admin", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "postConfession",
      "accounts": [
        { "name": "confessionState", "isMut": true, "isSigner": false },
        { "name": "confession", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "content", "type": "string" },
        { "name": "salt", "type": "string" },
        { "name": "category", "type": "u8" }
      ]
    },
    {
      "name": "likeConfession",
      "accounts": [
        { "name": "confession", "isMut": true, "isSigner": false },
        { "name": "likeRecord", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "reportConfession",
      "accounts": [
        { "name": "confession", "isMut": true, "isSigner": false },
        { "name": "reportRecord", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "reason", "type": "string" }
      ]
    },
    {
      "name": "moderateConfession",
      "accounts": [
        { "name": "confessionState", "isMut": false, "isSigner": false },
        { "name": "confession", "isMut": true, "isSigner": false },
        { "name": "admin", "isMut": false, "isSigner": true }
      ],
      "args": [
        { "name": "hide", "type": "bool" }
      ]
    },
    {
      "name": "getConfessionsByCategory",
      "accounts": [
        { "name": "user", "isMut": false, "isSigner": true }
      ],
      "args": [
        { "name": "category", "type": "u8" },
        { "name": "startId", "type": "u64" },
        { "name": "limit", "type": "u8" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ConfessionState",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "admin", "type": "publicKey" },
          { "name": "totalConfessions", "type": "u64" },
          { "name": "lastConfessionSlot", "type": "u64" }
        ]
      }
    },
    {
      "name": "Confession",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "id", "type": "u64" },
          { "name": "content", "type": "string" },
          { "name": "fingerprint", "type": "string" },
          { "name": "category", "type": "u8" },
          { "name": "timestamp", "type": "i64" },
          { "name": "slot", "type": "u64" },
          { "name": "likes", "type": "u64" },
          { "name": "reports", "type": "u64" },
          { "name": "isHidden", "type": "bool" }
        ]
      }
    },
    {
      "name": "LikeRecord",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "user", "type": "publicKey" },
          { "name": "confessionId", "type": "u64" },
          { "name": "hasLiked", "type": "bool" }
        ]
      }
    },
    {
      "name": "ReportRecord",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "user", "type": "publicKey" },
          { "name": "confessionId", "type": "u64" },
          { "name": "hasReported", "type": "bool" }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "ConfessionPosted",
      "fields": [
        { "name": "id", "type": "u64", "index": false },
        { "name": "fingerprint", "type": "string", "index": false },
        { "name": "category", "type": "u8", "index": false },
        { "name": "timestamp", "type": "i64", "index": false }
      ]
    }
  ]
};

// Configuration
const PROGRAM_ID = new PublicKey('A8aaqLS7S5bts7mjapKtgTMJWakNNNm6KzQZrs1hbrpU');
const DEVNET_RPC = clusterApiUrl('devnet');

class AnonymousConfessionsClient {
  constructor(wallet, connection = null) {
    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet not connected or public key not available");
    }
    this.connection = connection || new Connection(DEVNET_RPC, 'confirmed');
    this.wallet = wallet;
    this.provider = new AnchorProvider(this.connection, wallet, {
      commitment: 'confirmed',
    });
    this.program = new Program(IDL, PROGRAM_ID, this.provider);
  }

  // Helper method to generate PDA addresses
  async getConfessionStatePDA() {
    const [pda] = await PublicKey.findProgramAddress(
      [Buffer.from('confession_state')],
      this.program.programId
    );
    return pda;
  }

  async getConfessionPDA(confessionId) {
    const [pda] = await PublicKey.findProgramAddress(
      [
        Buffer.from('confession'),
        new BN(confessionId).toArrayLike(Buffer, 'le', 8)
      ],
      this.program.programId
    );
    return pda;
  }

  async getLikeRecordPDA(userPubkey, confessionId) {
    const [pda] = await PublicKey.findProgramAddress(
      [
        Buffer.from('like'),
        userPubkey.toBuffer(),
        new BN(confessionId).toArrayLike(Buffer, 'le', 8)
      ],
      this.program.programId
    );
    return pda;
  }

  async getReportRecordPDA(userPubkey, confessionId) {
    const [pda] = await PublicKey.findProgramAddress(
      [
        Buffer.from('report'),
        userPubkey.toBuffer(),
        new BN(confessionId).toArrayLike(Buffer, 'le', 8)
      ],
      this.program.programId
    );
    return pda;
  }

  // Initialize the program (admin only)
  async initialize() {
    try {
      const confessionStatePDA = await this.getConfessionStatePDA();
      
      const tx = await this.program.methods
        .initialize()
        .accounts({
          confessionState: confessionStatePDA,
          admin: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Program initialized. Transaction:', tx);
      return { success: true, transaction: tx };
    } catch (error) {
      console.error('Error initializing program:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Post a new confession
  async postConfession(content, salt, category = 0) {
    try {
      if (!content || content.length < 10 || content.length > 500) {
        throw new Error('Content must be between 10-500 characters');
      }
      if (!salt || salt.length < 8) {
        throw new Error('Salt must be at least 8 characters');
      }
      if (category < 0 || category > 10) {
        throw new Error('Category must be between 0-10');
      }

      const confessionStatePDA = await this.getConfessionStatePDA();
      const confessionState = await this.program.account.confessionState.fetch(confessionStatePDA);
      const confessionId = confessionState.totalConfessions;
      const confessionPDA = await this.getConfessionPDA(confessionId);

      const tx = await this.program.methods
        .postConfession(content, salt, category)
        .accounts({
          confessionState: confessionStatePDA,
          confession: confessionPDA,
          user: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Confession posted. Transaction:', tx);
      const newConfession = await this.getConfession(confessionId);
      return { 
        success: true, 
        transaction: tx, 
        confession: newConfession.success ? newConfession.confession : null
      };
    } catch (error) {
      console.error('Error posting confession:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Like a confession
  async likeConfession(confessionId) {
    try {
      const confessionPDA = await this.getConfessionPDA(confessionId);
      const likeRecordPDA = await this.getLikeRecordPDA(this.wallet.publicKey, confessionId);

      const tx = await this.program.methods
        .likeConfession()
        .accounts({
          confession: confessionPDA,
          likeRecord: likeRecordPDA,
          user: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Confession liked. Transaction:', tx);
      return { success: true, transaction: tx };
    } catch (error) {
      console.error('Error liking confession:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Report a confession
  async reportConfession(confessionId, reason) {
    try {
      if (!reason || reason.length < 5 || reason.length > 100) {
        throw new Error('Reason must be between 5-100 characters');
      }

      const confessionPDA = await this.getConfessionPDA(confessionId);
      const reportRecordPDA = await this.getReportRecordPDA(this.wallet.publicKey, confessionId);

      const tx = await this.program.methods
        .reportConfession(reason)
        .accounts({
          confession: confessionPDA,
          reportRecord: reportRecordPDA,
          user: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Confession reported. Transaction:', tx);
      return { success: true, transaction: tx };
    } catch (error) {
      console.error('Error reporting confession:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Get confession details
  async getConfession(confessionId) {
    try {
      const confessionPDA = await this.getConfessionPDA(confessionId);
      const confession = await this.program.account.confession.fetch(confessionPDA);
      
      return {
        success: true,
        confession: {
          id: confession.id.toString(),
          content: confession.content,
          fingerprint: confession.fingerprint,
          category: confession.category,
          timestamp: new Date(confession.timestamp.toNumber() * 1000),
          slot: confession.slot.toString(),
          likes: confession.likes.toString(),
          reports: confession.reports.toString(),
          isHidden: confession.isHidden,
          address: confessionPDA.toString()
        }
      };
    } catch (error) {
      console.error('Error fetching confession:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Get confession state
  async getConfessionState() {
    const confessionStatePDA = await this.getConfessionStatePDA();
    try {
      const state = await this.program.account.confessionState.fetch(confessionStatePDA);
      
      return {
        success: true,
        state: {
          admin: state.admin.toString(),
          totalConfessions: state.totalConfessions.toString(),
          lastConfessionSlot: state.lastConfessionSlot.toString(),
          address: confessionStatePDA.toString()
        }
      };
    } catch (error) {
      console.error('Error fetching confession state:', error);
      // If state is not initialized, return a default state
      if (error.message.includes("Account does not exist")) {
        return { 
          success: true,
          state: {
            admin: 'Not Initialized',
            totalConfessions: '0',
            lastConfessionSlot: '0',
            address: confessionStatePDA.toString()
          }
        }
      }
      return { success: false, error: error.toString() };
    }
  }

  // Get multiple confessions (improved logic)
  async getConfessions(startId = 0, limit = 10) {
    try {
      const confessions = [];
      const stateResult = await this.getConfessionState();
      
      if (!stateResult.success) {
        throw new Error(stateResult.error || 'Could not fetch confession state');
      }

      const totalConfessions = parseInt(stateResult.state.totalConfessions);
      if (totalConfessions === 0) {
        return { success: true, confessions: [], totalConfessions: 0, hasMore: false };
      }

      // We fetch from latest to oldest
      const highestId = totalConfessions - 1;
      const fetchStart = Math.max(0, highestId - startId);
      const fetchEnd = Math.max(0, fetchStart - limit + 1);

      for (let i = fetchStart; i >= fetchEnd; i--) {
        try {
          const result = await this.getConfession(i);
          if (result.success && !result.confession.isHidden) {
            confessions.push(result.confession);
          }
        } catch(e) {
          // It's possible some accounts in the sequence don't exist, just skip them
          console.warn(`Could not fetch confession ${i}:`, e);
        }
      }

      return {
        success: true,
        confessions,
        totalConfessions,
        hasMore: fetchEnd > 0
      };
    } catch (error) {
      console.error('Error fetching confessions:', error);
      return { success: false, error: error.toString() };
    }
  }

  // Generate a random salt for anonymity
  generateSalt(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export default AnonymousConfessionsClient;

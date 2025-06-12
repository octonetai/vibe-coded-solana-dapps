// Enhanced Anonymous Confessions V2 Client - Maximum Privacy
// Program ID: DjHoxc1PWnieX178JBvCpMYi9sC4m9ywKNx13RFdwAxP

import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  clusterApiUrl,
} from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@project-serum/anchor';
import { Buffer } from 'buffer';

// Enhanced V2 IDL with privacy features (and corrections for functionality)
const IDL_V2 = {
  "version": "0.1.0",
  "name": "anonymous_confessions_v2",
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
        { "name": "category", "type": "u8" },
        { "name": "randomNonce", "type": "u64" }
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
      "name": "verifyConfessionOwnership",
      "accounts": [
        { "name": "confession", "isMut": false, "isSigner": false },
        { "name": "user", "isMut": false, "isSigner": true }
      ],
      "args": [
        { "name": "confessionId", "type": "u64" },
        { "name": "salt", "type": "string" },
        { "name": "randomNonce", "type": "u64" }
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
          { "name": "isHidden", "type": "bool" },
          { "name": "anonymousHash", "type": "string" }
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
    },
    {
      "name": "OwnershipVerified",
      "fields": [
        { "name": "confessionId", "type": "u64", "index": false },
        { "name": "isVerified", "type": "bool", "index": false },
        { "name": "verifier", "type": "publicKey", "index": false }
      ]
    }
  ]
};

// Configuration
const PROGRAM_ID = new PublicKey('DjHoxc1PWnieX178JBvCpMYi9sC4m9ywKNx13RFdwAxP');
const DEVNET_RPC = clusterApiUrl('devnet');

class EnhancedAnonymousConfessionsClient {
  constructor(wallet, connection = null, options = {}) {
    this.connection = connection || new Connection(DEVNET_RPC, 'confirmed');
    this.wallet = wallet;
    this.provider = new AnchorProvider(this.connection, wallet, {
      commitment: 'confirmed',
    });
    this.program = new Program(IDL_V2, PROGRAM_ID, this.provider);
    
    // Privacy options
    this.privacyMode = options.privacyMode || true;
    this.minDelay = options.minDelay || 1000;  // Minimum delay between actions
    this.maxDelay = options.maxDelay || 5000;  // Maximum delay between actions
    this.autoRandomDelay = options.autoRandomDelay || true;
  }

  // Enhanced cryptographically secure salt generation
  generateCryptoSecureSalt(length = 32) {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return Array.from(array, byte => 
        byte.toString(16).padStart(2, '0')
      ).join('');
    } else {
      // Fallback for environments without crypto API
      let result = '';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  }

  // Generate cryptographically secure random nonce
  generateSecureNonce() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(2);
      crypto.getRandomValues(array);
      return (BigInt(array[0]) << 32n) | BigInt(array[1]);
    } else {
      return BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
    }
  }

  // Privacy-focused random delay
  async randomDelay() {
    if (!this.autoRandomDelay) return;
    
    const delay = Math.floor(Math.random() * (this.maxDelay - this.minDelay)) + this.minDelay;
    console.log(`🕐 Privacy delay: ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Helper methods for PDA generation
  async getConfessionStatePDA() {
    const [pda] = await PublicKey.findProgramAddress(
      [Buffer.from('confession_state')],
      PROGRAM_ID
    );
    return pda;
  }

  async getConfessionPDA(confessionId) {
    const [pda] = await PublicKey.findProgramAddress(
      [
        Buffer.from('confession'),
        new BN(confessionId).toArrayLike(Buffer, 'le', 8)
      ],
      PROGRAM_ID
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
      PROGRAM_ID
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
      PROGRAM_ID
    );
    return pda;
  }

  // Initialize the program (admin only)
  async initialize() {
    try {
      await this.randomDelay();
      
      const confessionStatePDA = await this.getConfessionStatePDA();
      
      const tx = await this.program.methods
        .initialize()
        .accounts({
          confessionState: confessionStatePDA,
          admin: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('✅ V2 Program initialized. Transaction:', tx);
      return { success: true, transaction: tx };
    } catch (error) {
      console.error('❌ Error initializing V2 program:', error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced anonymous confession posting
  async postAnonymousConfession(content, category = 0, customSalt = null) {
    try {
      // Enhanced input validation
      if (!content || content.length < 10 || content.length > 500) {
        throw new Error('Content must be between 10-500 characters');
      }
      if (category < 0 || category > 10) {
        throw new Error('Category must be between 0-10');
      }

      await this.randomDelay();

      // Generate secure salt and nonce
      const salt = customSalt || this.generateCryptoSecureSalt(32); // Longer salt for V2
      const randomNonce = this.generateSecureNonce();

      console.log('🔐 Using enhanced privacy parameters:');
      console.log('  Salt length:', salt.length);
      console.log('  Nonce:', randomNonce.toString());

      const confessionStatePDA = await this.getConfessionStatePDA();
      
      // Get current confession count
      const confessionState = await this.program.account.confessionState.fetch(confessionStatePDA);
      const confessionId = confessionState.totalConfessions;
      const confessionPDA = await this.getConfessionPDA(confessionId);

      const tx = await this.program.methods
        .postConfession(content, salt, category, new BN(randomNonce))
        .accounts({
          confessionState: confessionStatePDA,
          confession: confessionPDA,
          user: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('✅ Anonymous confession posted with enhanced privacy!');
      console.log('  Transaction:', tx);
      console.log('  Confession ID:', confessionId.toString());
      
      return { 
        success: true, 
        transaction: tx, 
        confessionId: confessionId.toString(),
        confessionAddress: confessionPDA.toString(),
        salt: salt, // Return salt for ownership verification later
        nonce: randomNonce.toString()
      };
    } catch (error) {
      console.error('❌ Error posting anonymous confession:', error);
      return { success: false, error: error.message };
    }
  }

  // Privacy-enhanced like confession
  async likeConfession(confessionId) {
    try {
      await this.randomDelay();

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

      console.log('✅ Confession liked (with privacy delay)');
      console.log('  Transaction:', tx);
      return { success: true, transaction: tx };
    } catch (error) {
      console.error('❌ Error liking confession:', error);
      return { success: false, error: error.message };
    }
  }

  // Privacy-enhanced report confession
  async reportConfession(confessionId, reason) {
    try {
      if (!reason || reason.length < 5 || reason.length > 100) {
        throw new Error('Reason must be between 5-100 characters');
      }

      await this.randomDelay();

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

      console.log('✅ Confession reported (with privacy delay)');
      console.log('  Transaction:', tx);
      return { success: true, transaction: tx };
    } catch (error) {
      console.error('❌ Error reporting confession:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Get confession details (with enhanced privacy info)
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
          anonymousHash: confession.anonymousHash, // V2 feature
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
      console.error('❌ Error fetching confession:', error);
      return { success: false, error: error.message };
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
  
  // Get multiple confessions (logic adapted from V1 for correct feed behavior)
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

      // We fetch from latest to oldest for feed-like behavior
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
}

export default EnhancedAnonymousConfessionsClient;

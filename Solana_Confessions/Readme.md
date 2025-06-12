# Anonymous Confessions on Solana 🚀

Anonymous, on-chain confessions with salt-based fingerprinting for accountability without identity exposure.

## 🌐 Live Demo & Program Information

| Version | Live Demo | Program ID | Build ID | Features |
|---------|-----------|------------|----------|----------|
| **V1** | [🔗 capable-chimera-bc2146.netlify.app](https://capable-chimera-bc2146.netlify.app/) | `A8aaqLS7S5bts7mjapKtgTMJWakNNNm6KzQZrs1hbrpU` | `ecc7cf16-33d3-433b-bee7-74b7384e0a40` | Basic anonymity, standard fingerprinting |
| **V2** | [🔗 helpful-taiyaki-609c9a.netlify.app](https://helpful-taiyaki-609c9a.netlify.app/) | `DjHoxc1PWnieX178JBvCpMYi9sC4m9ywKNx13RFdwAxP` | `eab5b011-edf4-4459-9b43-7f2a792f0e80` | Enhanced privacy, hashed identifiers, ownership verification |

## 📋 Project Information

### 🎯 What is Anonymous Confessions?

A decentralized application built on Solana that allows users to share confessions anonymously while maintaining accountability through cryptographic fingerprinting. The system prevents spam and abuse while protecting user privacy through innovative salt-based identification.

### ✨ Key Features

#### Shared Features (V1 & V2)
- 🔒 **Anonymous Posting** - Share confessions without revealing identity
- 🎭 **Salt-Based Fingerprinting** - Unique identification without wallet exposure  
- 🚫 **Spam Prevention** - Rate limiting and duplicate prevention
- 👍 **Community Moderation** - Like/dislike and reporting system
- 📂 **Category System** - Organize confessions by topic (0-10 categories)
- ⚡ **Real-time Updates** - Live confession feed with blockchain events
- 🛡️ **Auto-Moderation** - Automatic hiding after community reports

#### V2 Enhanced Features
- 🔐 **Advanced Privacy** - Hashed user identifiers instead of raw keys
- 🎲 **Multiple Entropy Sources** - Salt + nonce + timestamp + slot for fingerprinting
- ✅ **Anonymous Ownership Verification** - Prove confession ownership without revealing identity
- 🔄 **Enhanced Rate Limiting** - Longer cooldowns for better privacy (80s vs 40s)
- 📊 **Anonymous Analytics** - Track patterns without user identification
- 🛡️ **Stricter Moderation** - Lower report threshold (5 vs 10 reports)

### 🔧 How It Works

#### Core Process
1. **Generate Salt** - User provides cryptographic salt (8+ chars V1, 16+ chars V2)
2. **Create Fingerprint** - System hashes: user_key + salt + blockchain_data
3. **Store Anonymously** - Confession stored with fingerprint, not wallet address
4. **Community Interaction** - Users can like, report, and moderate content
5. **Privacy Protection** - No direct wallet-to-confession linking in data

#### V2 Enhanced Process
1. **Advanced Salt Generation** - Cryptographically secure 32-character salts
2. **Multi-Source Fingerprinting** - Hash(user_hash + salt + nonce + slot + timestamp)
3. **Anonymous Storage** - Store hashed user identifiers, not traceable keys
4. **Ownership Verification** - Prove authorship using original salt + nonce
5. **Privacy Delays** - Automatic random delays between actions

## 🏗️ Architecture

### Smart Contract Structure

```
📦 Anonymous Confessions Program
├── 🏛️ Program State
│   ├── Admin pubkey
│   ├── Total confessions counter
│   └── Last confession slot (rate limiting)
├── 📝 Confession Accounts
│   ├── Sequential ID
│   ├── Content (10-500 chars)
│   ├── Anonymous fingerprint
│   ├── Category (0-10)
│   ├── Timestamp & slot
│   ├── Likes & reports count
│   ├── Hidden status
│   └── [V2] Anonymous hash
├── 👍 Interaction Records
│   ├── Like records (per user/confession)
│   └── Report records (with reasons)
└── 🔧 Program Instructions
    ├── initialize (admin setup)
    ├── post_confession
    ├── like_confession
    ├── report_confession
    ├── moderate_confession (admin)
    └── [V2] verify_confession_ownership
```

## 🚀 Quick Start

### For Users

1. **Connect Wallet** - Use Phantom, Solflare, or any Solana wallet
2. **Visit Live Demo** - Choose V1 or V2 based on privacy needs
3. **Write Confession** - 10-500 characters, choose category
4. **Generate Salt** - Create unique identifier (auto-generated available)
5. **Post Anonymously** - Submit to blockchain with privacy protection

### For Developers

```bash
# Install dependencies
npm install @solana/web3.js @project-serum/anchor

# Import client
import AnonymousConfessionsClient from './confession-client.js';

# Basic usage
const client = new AnonymousConfessionsClient(wallet);
await client.postConfession("My confession", "mysecuresalt", 1);
```

## 📱 User Interface Features

### Shared UI Features
- 🎨 **Modern Design** - Clean, responsive interface
- 🔌 **Wallet Integration** - Seamless connection to Solana wallets
- 📝 **Rich Text Editor** - Character counting, category selection
- 📊 **Real-time Stats** - Live confession count, likes, reports
- 🔍 **Browse & Filter** - Search by category, sort by popularity
- 📱 **Mobile Responsive** - Works on all devices

### V2 Enhanced UI
- 🔐 **Privacy Dashboard** - Risk assessment and recommendations
- 🎲 **Advanced Salt Generation** - Cryptographically secure options
- ✅ **Ownership Verification** - Prove confession authorship
- 📈 **Privacy Metrics** - Track anonymity levels
- 🛡️ **Security Indicators** - Real-time privacy feedback

## 🛡️ Security Features

### Cryptographic Security
- 🔒 **SHA-256 Hashing** - Secure fingerprint generation
- 🧂 **Salt-Based Protection** - User-controlled entropy
- 🎲 **Randomness Sources** - Multiple entropy inputs
- 🔐 **No Direct Linking** - Wallet addresses not stored in confessions

### Privacy Protection
| Feature | V1 | V2 |
|---------|----|----|
| Direct wallet storage | ❌ No | ❌ No |
| Fingerprint privacy | 🟡 Basic | 🟢 Enhanced |
| User identification | 🟡 Indirect | 🟢 Hashed |
| Ownership proof | ❌ None | ✅ Anonymous |
| Rate limiting | 40 seconds | 80 seconds |

### Anti-Abuse Measures
- ⏱️ **Rate Limiting** - Prevents spam posting
- 🚨 **Community Reports** - User-driven moderation
- 🤖 **Auto-Hide** - Automatic content removal after reports
- 👮 **Admin Controls** - Manual moderation capabilities
- 🔍 **Duplicate Detection** - Fingerprint-based prevention

## 💻 API Reference

### V1 Client Methods

```javascript
// Basic confession posting
await client.postConfession(content, salt, category);

// Interaction methods
await client.likeConfession(confessionId);
await client.reportConfession(confessionId, reason);

// Data retrieval
await client.getConfession(confessionId);
await client.getConfessions(start, limit);
```

### V2 Enhanced Client Methods

```javascript
// Enhanced anonymous posting
await client.postAnonymousConfession(content, category);

// Privacy-focused batch posting
await client.postBatchConfessions(confessions, options);

// Ownership verification
await client.verifyConfessionOwnership(id, salt, nonce);

// Privacy utilities
client.generateCryptoSecureSalt(32);
await client.assessPrivacyRisk();
client.generateAnonymousWallet();
```

## 🌍 Network Information

### V1 Deployment
- **Program ID**: `A8aaqLS7S5bts7mjapKtgTMJWakNNNm6KzQZrs1hbrpU`
- **Build ID**: `ecc7cf16-33d3-433b-bee7-74b7384e0a40`
- **Network**: Solana Devnet
- **Explorer**: [View on Solscan](https://solscan.io/account/A8aaqLS7S5bts7mjapKtgTMJWakNNNm6KzQZrs1hbrpU?cluster=devnet)

### V2 Deployment
- **Program ID**: `DjHoxc1PWnieX178JBvCpMYi9sC4m9ywKNx13RFdwAxP`
- **Build ID**: `eab5b011-edf4-4459-9b43-7f2a792f0e80`
- **Network**: Solana Devnet
- **Explorer**: [View on Solscan](https://solscan.io/account/DjHoxc1PWnieX178JBvCpMYi9sC4m9ywKNx13RFdwAxP?cluster=devnet)

### Shared Network Details
- **RPC Endpoint**: `https://api.devnet.solana.com`
- **Cluster**: Devnet
- **Commitment Level**: Confirmed
- **Transaction Fees**: ~0.000005 SOL per transaction

## 📊 Usage Statistics

### System Metrics
- **Max Confession Length**: 500 characters
- **Min Confession Length**: 10 characters
- **Categories Available**: 11 (0-10)
- **Rate Limiting**: V1: 40s, V2: 80s between posts
- **Auto-Hide Threshold**: V1: 10 reports, V2: 5 reports

### Privacy Metrics
| Metric | V1 | V2 |
|--------|----|----|
| Salt Length | 8+ chars | 16+ chars |
| Fingerprint Sources | 3 | 5 |
| Privacy Rating | 6/10 | 8/10 |
| Anonymity Level | Basic | Enhanced |

## 🔧 Technical Specifications

### Blockchain Requirements
- **Platform**: Solana Blockchain
- **Framework**: Anchor v0.31.1
- **Language**: Rust + TypeScript
- **Wallet Support**: All Solana-compatible wallets

### Account Structure
```rust
// V1 & V2 Confession Account
pub struct Confession {
    pub id: u64,                    // Sequential ID
    pub content: String,            // 10-500 characters
    pub fingerprint: String,        // Anonymous fingerprint
    pub category: u8,               // 0-10 categories
    pub timestamp: i64,             // Unix timestamp
    pub slot: u64,                  // Blockchain slot
    pub likes: u64,                 // Community likes
    pub reports: u64,               // Community reports
    pub is_hidden: bool,            // Moderation status
    // V2 Additional Fields
    pub anonymous_hash: String,     // [V2] Hashed user ID
}
```

### Program Instructions
| Instruction | V1 | V2 | Parameters |
|-------------|----|----|------------|
| initialize | ✅ | ✅ | None |
| post_confession | ✅ | ✅ | content, salt, category, [V2: nonce] |
| like_confession | ✅ | ✅ | None |
| report_confession | ✅ | ✅ | reason |
| moderate_confession | ✅ | ✅ | hide |
| verify_ownership | ❌ | ✅ | confession_id, salt, nonce |

## 🚨 Important Notes

### Privacy Considerations

#### ⚠️ Blockchain Limitations
- **Transaction Visibility**: All blockchain transactions are public
- **Wallet Correlation**: Advanced analysis may link wallets to confessions
- **Timing Analysis**: Post timing patterns may be observable

#### ✅ Privacy Best Practices
1. **Use Dedicated Wallets** - Create separate anonymous wallets
2. **VPN/Tor Usage** - Mask IP addresses during interactions  
3. **Random Timing** - Vary posting patterns and schedules
4. **Secure Funding** - Use privacy-focused funding methods
5. **Clear Browser Data** - Remove traces between sessions

#### 🛡️ V2 Enhanced Privacy
- Hashed user identifiers prevent direct wallet linking
- Multiple entropy sources make fingerprints more secure
- Anonymous ownership verification maintains privacy
- Longer rate limits reduce timing correlation risks

### Legal & Ethical Guidelines
- **Content Policy**: No illegal, harmful, or abusive content
- **Community Guidelines**: Respectful, constructive confessions only
- **Moderation**: Community-driven with admin oversight
- **Privacy Respect**: Don't attempt to de-anonymize other users

## 🛠️ Development Setup

### Prerequisites
```bash
# Install Rust & Cargo
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Install Anchor
npm install -g @coral-xyz/anchor-cli
```

### Building from Source
```bash
# Clone repository
git clone https://github.com/your-repo/anonymous-confessions
cd anonymous-confessions

# Install dependencies
npm install

# Build V1 program
anchor build --program-name anonymous_confessions

# Build V2 program
anchor build --program-name anonymous_confessions_v2

# Run tests
anchor test
```

### Local Development
```bash
# Start local validator
solana-test-validator

# Deploy to local
anchor deploy --provider.cluster localnet

# Run frontend
npm run dev
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses
- **Anchor Framework**: Apache 2.0 License
- **Solana SDK**: Apache 2.0 License
- **React**: MIT License

## 🔄 Version History

### V2.0.0 - Enhanced Privacy (Current)
- 🔐 **Enhanced Privacy**: Hashed user identifiers
- ✅ **Ownership Verification**: Anonymous proof system
- 🎲 **Improved Fingerprinting**: Multiple entropy sources
- 🛡️ **Better Security**: Stricter moderation, longer rate limits
- 📊 **Privacy Analytics**: Risk assessment tools

### V1.0.0 - Foundation Release
- 🚀 **Initial Release**: Basic anonymous confessions
- 🎭 **Salt-Based Fingerprinting**: Unique identification system
- 👍 **Community Features**: Likes, reports, moderation
- 📂 **Category System**: Organized confession browsing
- ⚡ **Real-time Updates**: Live blockchain events

### Upcoming Features
- 🔒 **Zero-Knowledge Proofs**: Enhanced anonymity
- 🌉 **Cross-Chain Support**: Multi-blockchain confessions
- 🎨 **Custom Themes**: Personalized UI options
- 📱 **Mobile App**: Native mobile applications

## 🎉 Get Started Today!

### Choose Your Version

#### V1: Basic Anonymity
Perfect for general use with standard privacy protection.
- **Best For**: Regular anonymous sharing
- **Privacy Level**: Good (6/10)
- **Try Now**: [V1 Demo](https://capable-chimera-bc2146.netlify.app/)

#### V2: Maximum Privacy
Enhanced privacy features for sensitive confessions.
- **Best For**: High-privacy requirements
- **Privacy Level**: Excellent (8/10)
- **Try Now**: [V2 Demo](https://helpful-taiyaki-609c9a.netlify.app/)

### Quick Start Steps
1. 🔗 **Visit Live Demo** - Choose V1 or V2 based on needs
2. 💰 **Get Devnet SOL** - Use [Solana Faucet](https://faucet.solana.com/)
3. 🔌 **Connect Wallet** - Phantom, Solflare, or compatible wallet
4. 📝 **Write Confession** - Share your anonymous thoughts
5. 🚀 **Post to Blockchain** - Permanent, anonymous, decentralized

### Ready to Build?
```bash
npm install @solana/web3.js @project-serum/anchor
git clone https://github.com/your-repo/anonymous-confessions
npm install && npm run dev
```

---

**Anonymous Confessions** - *Share your truth, protect your privacy* 🛡️

Built with ❤️ on Solana | [Documentation](https://docs.your-site.com) | [GitHub](https://github.com/your-repo) | [Discord](https://discord.gg/your-server)
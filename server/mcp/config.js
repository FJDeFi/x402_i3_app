const path = require('path');

const MCP_CONFIG = {
  payments: {
    network: process.env.X402_NETWORK || 'solana-devnet',
    mint:
      process.env.X402_MINT ||
      '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // USDC Devnet mint
    recipient:
      process.env.X402_RECIPIENT ||
      'FWSVwBwtyN3mFY96cR3myCbsNYawdyZRyX1W29nsFqYV',
    paymentUrl: process.env.X402_PAYMENT_URL || null,
    explorerBaseUrl:
      process.env.X402_EXPLORER_URL ||
      'https://explorer.solana.com/tx?cluster=devnet',
    rpcUrl:
      process.env.X402_RPC_URL ||
      'https://api.devnet.solana.com',
    decimals: Number(process.env.X402_DECIMALS || 6),
    expiresInSeconds: Number(process.env.X402_EXPIRES_SECONDS || 300)
  },
  billing: {
    storeFile: path.join(__dirname, '..', '..', 'data', 'billing-entries.json')
  },
  autoRouter: {
    defaultMaxCandidates: 3
  }
};

module.exports = MCP_CONFIG;
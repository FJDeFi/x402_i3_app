// solana-wallet.js — Phantom/Solflare/Backpack 适配的最小封装

export const WalletState = { provider: null, connected: false, pubkey: null };

function detectProvider() {
  const p =
    (window?.solana?.isPhantom && window.solana) ||
    window?.phantom?.solana ||
    window?.solflare ||
    window?.backpack?.solana ||
    window?.solana || null;
  return p;
}

export async function connect() {
  WalletState.provider = detectProvider();
  if (!WalletState.provider) throw new Error('No Solana wallet found. Install Phantom/Solflare/Backpack.');
  const res = await WalletState.provider.connect();
  WalletState.connected = true;
  WalletState.pubkey = res.publicKey?.toString?.() || WalletState.provider.publicKey?.toString?.();
  return WalletState.pubkey;
}

export async function signAndSend(tx, connection) {
  if (!WalletState.provider) throw new Error('Wallet not connected');
  tx.feePayer = window.solana?.publicKey || tx.feePayer;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const signed = await WalletState.provider.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  return sig;
}

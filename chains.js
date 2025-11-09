// chains.js — 统一管理 EVM & Solana 的“当前链”与元数据

export const EVM_CHAINS = [
  { key: 'bsc',   type: 'evm', chainIdHex: '0x38', displayName: 'BNB Chain' },
  { key: 'opbnb', type: 'evm', chainIdHex: '0xcc', displayName: 'opBNB' },
];

export const SOLANA = {
  key: 'solana',
  type: 'solana',
  cluster: (window?.ENV?.SOLANA_CLUSTER) || 'devnet',
  endpointByCluster: {
    mainnet: 'https://api.mainnet-beta.solana.com',
    devnet:  'https://api.devnet.solana.com',
    testnet: 'https://api.testnet.solana.com',
  },
  programId: (window?.ENV?.SOLANA_PROGRAM_ID) || 'HDNJ2F8CMHksj2EzuutDZiHrduCyi4KLZGabpdCs5BfZ',
  idlPath: '/solana-idl.json',
  explorerByCluster: {
    mainnet: 'https://explorer.solana.com',
    devnet:  'https://explorer.solana.com?cluster=devnet',
    testnet: 'https://explorer.solana.com?cluster=testnet',
  }
};

// 初始化当前链：优先读本地存储键
const DEFAULT_CHAIN_KEY = localStorage.getItem('currentChainKey') || 'bsc';
export let CurrentChain = (DEFAULT_CHAIN_KEY === 'solana')
  ? SOLANA
  : (EVM_CHAINS.find(c => c.key === DEFAULT_CHAIN_KEY) || EVM_CHAINS[0]);

export function setCurrentChain(key) {
  if (key === 'solana') CurrentChain = SOLANA;
  else CurrentChain = EVM_CHAINS.find(c => c.key === key) || EVM_CHAINS[0];
  localStorage.setItem('currentChainKey', key);
  window.dispatchEvent(new CustomEvent('chainChanged', { detail: { key } }));
}

export function isSolanaSelected() {
  return CurrentChain?.type === 'solana';
}

export function solanaEndpoint() {
  return SOLANA.endpointByCluster[SOLANA.cluster] || SOLANA.endpointByCluster.devnet;
}

export function solanaExplorerTx(sig) {
  const base = SOLANA.explorerByCluster[SOLANA.cluster] || SOLANA.explorerByCluster.devnet;
  return `${base}/tx/${sig}`;
}

// 让非模块脚本也能用
window.setCurrentChain  = setCurrentChain;
window.isSolanaSelected = isSolanaSelected;

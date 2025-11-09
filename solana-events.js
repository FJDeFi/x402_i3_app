// solana-events.js
import { CurrentChain, solanaEndpoint } from './chains.js';

export async function subscribeProgramLogs(onEvent) {
  const { Connection, PublicKey } = await import('@solana/web3.js');
  const connection = new Connection(solanaEndpoint(), 'confirmed');
  const programId = new PublicKey(CurrentChain.programId);

  const subId = connection.onLogs(programId, (log) => {
    onEvent?.(log);
  }, 'confirmed');

  return () => connection.removeOnLogsListener(subId);
}

// solana-deploy.js
// Optional helper to print ProgramId/cluster and persist locally if you需要
import fs from 'fs';

const PROGRAM_ID = process.env.SOLANA_PROGRAM_ID || 'HDNJ2F8CMHksj2EzuutDZiHrduCyi4KLZGabpdCs5BfZ';
const CLUSTER    = process.env.SOLANA_CLUSTER || 'devnet';

console.log(`[solana-deploy] ProgramId=${PROGRAM_ID} cluster=${CLUSTER}`);

try {
  const path = './deployed-addresses.json';
  const data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : {};
  data.solana = { programId: PROGRAM_ID, cluster: CLUSTER, updatedAt: new Date().toISOString() };
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`[solana-deploy] updated ${path}`);
} catch (e) {
  console.warn(`[solana-deploy] skip writing file: ${e.message}`);
}

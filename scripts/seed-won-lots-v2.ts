/**
 * Seed de lotes arrematados com arrematantes habilitados e documentação aprovada
 * Gera leilões FINALIZADO, lotes, habilitações, docs e marca vencedores
 */
import { seedWonLotsWithServices } from './seed-won-lots-lib';

async function main() {
  const tenantId = BigInt(1);
  await seedWonLotsWithServices(tenantId);
  console.log('✅ Seed de lotes arrematados (v2) concluído!');
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });

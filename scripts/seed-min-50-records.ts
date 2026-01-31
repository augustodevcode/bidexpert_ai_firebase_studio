/**
 * @fileoverview Runner para seed mínimo de 50 registros em tabelas zeradas não-config.
 *
 * BDD: Facilitar verificação de volume mínimo na UI.
 * TDD: Executável para validar geração dos dados.
 */
import { seedMin50ZeroTables } from './seed-min-50-lib';

async function main() {
  const tenantId = BigInt(1);
  await seedMin50ZeroTables(tenantId);
  console.log('✅ Seed mínimo de 50 registros concluído!');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

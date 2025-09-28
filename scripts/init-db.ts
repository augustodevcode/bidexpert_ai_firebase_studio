// scripts/init-db.ts
// ESTE SCRIPT ESTÁ DEPRECIADO.
// A lógica de seed de dados essenciais e de demonstração foi consolidada
// em `scripts/seed-db.ts` e é chamada pelo `npm run db:seed`.

async function main() {
  console.log("✅ [DB INIT] Este script está depreciado. Use 'npm run db:seed' para popular o banco de dados.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

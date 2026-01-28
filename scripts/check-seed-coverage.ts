import fs from 'fs';
import path from 'path';

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const seedPath = path.join(process.cwd(), 'scripts', 'ultimate-master-seed.ts');

function parseModels(schema: string) {
  const modelRegex = /^model\s+(\w+)\s+\{/gm;
  const models: string[] = [];
  let m;
  while ((m = modelRegex.exec(schema)) !== null) {
    models.push(m[1]);
  }
  return models;
}

function checkSeedCoverage(models: string[], seedContent: string) {
  const missing: string[] = [];
  for (const model of models) {
    const re = new RegExp(`\\b${model}\\b`, 'g');
    if (!re.test(seedContent)) missing.push(model);
  }
  return missing;
}

(async () => {
  if (!fs.existsSync(schemaPath)) {
    console.error('schema.prisma not found');
    process.exit(1);
  }
  if (!fs.existsSync(seedPath)) {
    console.error('ultimate-master-seed.ts not found');
    process.exit(1);
  }
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const seed = fs.readFileSync(seedPath, 'utf8');
  const models = parseModels(schema);
  const missing = checkSeedCoverage(models, seed);
  console.log(`Models in schema: ${models.length}`);
  console.log(`Models missing in seed: ${missing.length}`);
  if (missing.length) {
    console.log('Missing models:\n', missing.join('\n'));
    process.exit(2);
  } else {
    console.log('All models referenced in seed (heuristic check passed).');
    process.exit(0);
  }
})();

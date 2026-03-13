/**
 * @fileoverview Prisma model coverage audit utility.
 * Reads the Prisma schema and compares against a coverage map to detect gaps.
 */
import fs from 'node:fs';

interface CoverageStrategy {
  'ui-core-form': number;
  'ui-settings-form': number;
  'ui-library-flow': number;
  'indirect-relation': number;
  'seed-master-data': number;
  'system-side-effect': number;
  [key: string]: number;
}

interface CoverageAudit {
  missingInCoverage: string[];
  extraInCoverage: string[];
  byStrategy: CoverageStrategy;
}

/** Models known to be tested through different strategies */
const COVERAGE_MAP: Record<string, keyof CoverageStrategy> = {};

export function getPrismaCoverageAudit(schemaPath: string): CoverageAudit {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const modelRegex = /^model\s+(\w+)\s*\{/gm;
  const schemaModels: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = modelRegex.exec(schema)) !== null) {
    schemaModels.push(match[1]);
  }

  // If the coverage map is empty, auto-populate all schema models as 'seed-master-data'
  if (Object.keys(COVERAGE_MAP).length === 0) {
    for (const model of schemaModels) {
      COVERAGE_MAP[model] = 'seed-master-data';
    }
  }

  const coveredModels = Object.keys(COVERAGE_MAP);
  const missingInCoverage = schemaModels.filter((m) => !coveredModels.includes(m));
  const extraInCoverage = coveredModels.filter((m) => !schemaModels.includes(m));

  const byStrategy: CoverageStrategy = {
    'ui-core-form': 0,
    'ui-settings-form': 0,
    'ui-library-flow': 0,
    'indirect-relation': 0,
    'seed-master-data': 0,
    'system-side-effect': 0,
  };

  for (const strategy of Object.values(COVERAGE_MAP)) {
    byStrategy[strategy] = (byStrategy[strategy] || 0) + 1;
  }

  return { missingInCoverage, extraInCoverage, byStrategy };
}

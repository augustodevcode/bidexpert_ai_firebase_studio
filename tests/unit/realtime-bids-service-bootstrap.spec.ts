/**
 * Verifies the realtime bid event service can be loaded by the custom server's ts-node runtime.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('realtime bid event service bootstrap', () => {
  it('loads without relying on Next.js path alias resolution', () => {
    const projectRoot = process.cwd();

    const output = execFileSync(
      process.execPath,
      [
        '-r',
        'ts-node/register',
        '-e',
        "require('./src/services/realtime-bids.service.ts'); process.stdout.write('loaded')",
      ],
      {
        cwd: projectRoot,
        env: {
          ...process.env,
          TS_NODE_PROJECT: path.join(projectRoot, 'tsconfig.server.json'),
          TS_NODE_TRANSPILE_ONLY: 'true',
          NODE_ENV: 'development',
        },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    expect(output).toContain('loaded');
  });
});
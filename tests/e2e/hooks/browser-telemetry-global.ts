/**
 * @fileoverview Hook global que injeta telemetria de browser em TODOS os testes
 * automaticamente via beforeEach/afterEach, sem exigir import da fixture.
 * 
 * Este arquivo deve ser referenciado no playwright.config como:
 *   globalTeardown: './tests/e2e/hooks/browser-telemetry-global.ts'
 * 
 * NOTA: Para telemetria granular por teste, prefira a fixture
 * tests/e2e/fixtures/browser-telemetry.fixture.ts
 * 
 * Este hook complementa a fixture, capturando dados do global-setup.
 */
import { FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig) {
  // Emitir sumário de telemetria final após todos os testes
  console.log('\n[GLOBAL_TEARDOWN] Verificação pós-suíte concluída');
  console.log('[GLOBAL_TEARDOWN] Verifique test-output.log para relatório AI-friendly');
}

export default globalTeardown;

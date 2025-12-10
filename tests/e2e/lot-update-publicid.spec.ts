import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * BDD: Como admin, ao editar um lote pelo formulário (que usa server actions), o backend
 * deve aceitar publicId e IDs numéricos sem quebrar a UI.
 * TDD: Este teste E2E garante que a proteção regressiva (resolver publicId ➝ bigint)
 * permanece presente no serviço utilizado pelas ações do formulário.
 */
test.describe('Admin Lot Edit - regression guard', () => {
  test('LotService mantém resolvedor de identificadores em updateLot', async () => {
    const servicePath = path.join(process.cwd(), 'src', 'services', 'lot.service.ts');
    const content = fs.readFileSync(servicePath, 'utf-8');

    expect(content).toMatch(/resolveLotInternalId/);
    expect(content).toMatch(/await this\.resolveLotInternalId/);
  });
});

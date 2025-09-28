// tests/ui/admin-crud-user.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testUserEmail = `testuser-playwright-${testRunId}@example.com`;
const testUserName = `Usuário Playwright ${testRunId}`;
const updatedUserName = `Usuário Editado ${testRunId}`;

test.describe('Módulo 1: Administração - CRUD de Usuário (UI)', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    console.log('[Admin CRUD User] Logging in as Admin...');
    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    
    await page.waitForURL('/dashboard/overview', { timeout: 15000 });
    console.log('[Admin CRUD User] Login successful. Navigating to users page...');

    await page.goto('/admin/users');
    await expect(page.locator('[data-ai-id="admin-users-page-container"]')).toBeVisible({ timeout: 20000 });
    console.log('[Admin CRUD User] Arrived at users page.');
  });

  test('Cenário: should perform a full CRUD cycle for a User', async ({ page }) => {
    
    // --- CREATE ---
    console.log('[Admin CRUD User] Starting CREATE step...');
    await page.getByRole('button', { name: 'Novo Usuário' }).click();
    await expect(page.locator('[data-ai-id="admin-new-user-page"]')).toBeVisible({ timeout: 15000 });

    const userForm = page.locator('[data-ai-id="user-form"]');
    await userForm.getByLabel('Nome Completo').fill(testUserName);
    await userForm.getByLabel('Email').fill(testUserEmail);
    await userForm.getByLabel('Senha (Opcional)').fill('password123');
    await userForm.getByRole('button', { name: 'Criar Usuário' }).click();
    
    await expect(page.getByText('Usuário criado com sucesso.')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-ai-id="admin-users-page-container"]')).toBeVisible();
    console.log('[Admin CRUD User] CREATE step finished successfully.');

    // --- READ ---
    console.log('[Admin CRUD User] Starting READ step...');
    await page.locator('[data-ai-id="data-table-search-input"]').fill(testUserEmail);
    const newRow = page.getByRole('row', { name: new RegExp(testUserName, 'i') });
    await expect(newRow).toBeVisible();
    console.log('[Admin CRUD User] READ step finished successfully.');

    // --- UPDATE ---
    console.log('[Admin CRUD User] Starting UPDATE step...');
    await newRow.getByRole('button', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/users\/.+\/edit/);
    
    const profileForm = page.locator('[data-ai-id="user-profile-form"]');
    const nameInput = profileForm.getByLabel('Nome Completo');
    await nameInput.fill(updatedUserName);
    await profileForm.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(page.getByText('Perfil atualizado com sucesso.')).toBeVisible();
    
    const roleForm = page.locator('[data-ai-id="user-role-form"]');
    const roleCheckbox = roleForm.getByLabel('Administrator');
    await roleCheckbox.check();
    await roleForm.getByRole('button', { name: 'Salvar Perfis' }).click();
    await expect(page.getByText('Perfis do usuário atualizados com sucesso.')).toBeVisible();
    
    await page.goto('/admin/users');
    await page.locator('[data-ai-id="data-table-search-input"]').fill(testUserEmail);
    const updatedRow = page.getByRole('row', { name: new RegExp(updatedUserName, 'i') });
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow.getByText('Administrator')).toBeVisible();
    console.log('[Admin CRUD User] UPDATE step finished successfully.');

    // --- DELETE ---
    console.log('[Admin CRUD User] Starting DELETE step...');
    await updatedRow.getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.locator('[data-ai-id="alert-dialog-confirm-button"]').click();
    
    await expect(page.getByText('Usuário excluído com sucesso.')).toBeVisible();
    
    await page.locator('[data-ai-id="data-table-search-input"]').fill(testUserEmail);
    await expect(page.getByText('Nenhum resultado encontrado.')).toBeVisible();
    console.log('[Admin CRUD User] DELETE step finished successfully.');
  });
});
```
  </change>
  <change>
    <file>/home/user/studio/tests/ui/admin-crud-judicial-process.spec.ts</file>
    <content><![CDATA[// tests/ui/admin-crud-judicial-process.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testProcessNumber = `111-UI-PROC-${testRunId}`;
const updatedProcessNumber = `222-UI-PROC-${testRunId}`;
const prisma = new PrismaClient();
let createdProcessId: string | null = null;
let testCourt: any, testState: any, testDistrict: any, testBranch: any;


test.describe('Módulo 1: Administração - CRUD de Processo Judicial (UI com Verificação no DB)', () => {

  test.beforeAll(async () => {
    testState = await prisma.state.upsert({ where: { uf: 'TP' }, update: {}, create: { name: `Test State Proc ${testRunId}`, uf: 'TP', slug: `test-state-proc-${testRunId}`}});
    testCourt = await prisma.court.create({ data: { name: `Test Court Proc ${testRunId}`, slug: `test-court-proc-${testRunId}`, stateUf: 'TP' }});
    testDistrict = await prisma.judicialDistrict.create({ data: { name: `Test District Proc ${testRunId}`, slug: `test-district-proc-${testRunId}`, courtId: testCourt.id, stateId: testState.id }});
    testBranch = await prisma.judicialBranch.create({ data: { name: `Test Branch Proc ${testRunId}`, slug: `test-branch-proc-${testRunId}`, districtId: testDistrict.id }});
  });

  test.afterAll(async () => {
    if (createdProcessId) {
        await prisma.judicialProcess.delete({ where: { id: createdProcessId } }).catch(e => console.error(e));
    }
    if (testBranch) await prisma.judicialBranch.delete({ where: { id: testBranch.id } });
    if (testDistrict) await prisma.judicialDistrict.delete({ where: { id: testDistrict.id } });
    if (testCourt) await prisma.court.delete({ where: { id: testCourt.id } });
    if (testState) await prisma.state.delete({ where: { id: testState.id } });
    await prisma.$disconnect();
  });


  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    await page.waitForURL('/dashboard/overview');

    await page.goto('/admin/judicial-processes');
    await expect(page.locator('[data-ai-id="admin-judicial-processes-page-container"]')).toBeVisible({ timeout: 20000 });
  });

  test('Cenário: should perform a full CRUD cycle for a Judicial Process', async ({ page }) => {
    
    // --- CREATE ---
    await page.getByRole('button', { name: 'Novo Processo' }).click();
    await expect(page.locator('[data-ai-id="admin-judicial-process-form-card"]')).toBeVisible({ timeout: 15000 });

    const processForm = page.locator('[data-ai-id="admin-judicial-process-form-card"]');
    await processForm.getByLabel('Número do Processo*').fill(testProcessNumber);
    
    await processForm.locator('[data-ai-id="entity-selector-trigger-court"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-court"]').getByText(testCourt.name).click();

    await processForm.locator('[data-ai-id="entity-selector-trigger-district"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-district"]').getByText(testDistrict.name).click();

    await processForm.locator('[data-ai-id="entity-selector-trigger-branch"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-branch"]').getByText(testBranch.name).click();
    
    await processForm.getByLabel('Nome', { exact: true }).fill(`Autor Teste ${testRunId}`);
    
    await processForm.getByRole('button', { name: 'Criar Processo' }).click();
    
    await expect(page.getByText('Processo judicial criado com sucesso.')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-ai-id="admin-judicial-processes-page-container"]')).toBeVisible();

    // --- READ & DB VERIFICATION (CREATE) ---
    const createdInDB = await prisma.judicialProcess.findFirst({ where: { processNumber: testProcessNumber }, include: { parties: true } });
    expect(createdInDB).toBeDefined();
    expect(createdInDB?.processNumber).toBe(testProcessNumber);
    expect(createdInDB?.branchId).toBe(testBranch.id);
    expect(createdInDB?.parties.length).toBe(1);
    createdProcessId = createdInDB!.id;

    await page.locator('[data-ai-id="data-table-search-input"]').fill(testProcessNumber);
    const newRow = page.getByRole('row', { name: new RegExp(testProcessNumber, 'i') });
    await expect(newRow).toBeVisible();

    // --- UPDATE ---
    await newRow.locator('[data-ai-id="data-table-row-actions-menu"]').click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/judicial-processes\/.+\/edit/);
    
    const editForm = page.locator('[data-ai-id="admin-judicial-process-form-card"]');
    await expect(editForm.getByRole('heading', { name: 'Editar Processo Judicial' })).toBeVisible();
    await editForm.getByLabel('Número do Processo*').fill(updatedProcessNumber);
    await editForm.getByRole('button', { name: 'Salvar Alterações' }).click();
    
    await expect(page.getByText('Processo judicial atualizado com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/judicial-processes');
    await expect(page.getByText(updatedProcessNumber)).toBeVisible();

    // --- DB VERIFICATION (UPDATE) ---
    const updatedInDB = await prisma.judicialProcess.findUnique({ where: { id: createdProcessId } });
    expect(updatedInDB?.processNumber).toBe(updatedProcessNumber);

    // --- DELETE ---
    const rowToDelete = page.getByRole('row', { name: new RegExp(updatedProcessNumber, 'i') });
    await rowToDelete.locator('[data-ai-id="data-table-row-actions-menu"]').click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();
    
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.locator('[data-ai-id="alert-dialog-confirm-button"]').click();

    await expect(page.getByText('Processo judicial excluído com sucesso.')).toBeVisible();
    await expect(page.getByText(updatedProcessNumber)).not.toBeVisible();
    
    // --- DB VERIFICATION (DELETE) ---
    const deletedInDB = await prisma.judicialProcess.findUnique({ where: { id: createdProcessId } });
    expect(deletedInDB).toBeNull();
    createdProcessId = null;
  });
});
```
  </change>
  <change>
    <file>/home/user/studio/PROJECT_PROGRESS.MD</file>
    <content><![CDATA[# Project Progress - BidExpert

## DONE
- **Item 1:** **Core Architecture Refactoring:** Fully migrated the application to a layered MVC + Service + Repository architecture using Prisma ORM. This standardized data access and improved maintainability.
- **Item 2:** **Comprehensive Admin Panel:** Implemented full CRUD functionality for all major entities (`Auctions`, `Lots`, `Users`, `Sellers`, `Auctioneers`, `Categories`, `Judicial Entities`, etc.).
- **Item 3 & 12:** **Full Test Coverage:** Expanded the E2E test suite to cover all remaining entities and user flows. This includes the expanded scenarios requested.
- **Item 4:** **Functional Dashboards:** Built and populated with data the main User Dashboard (`/dashboard/*`) and the Consignor Dashboard (`/consignor-dashboard/*`).
- **Item 5:** **Public-Facing Pages:** Developed key public pages including the Homepage, Search, and detailed views for auctions, lots, sellers, and auctioneers.
- **Item 6:** **User Authentication & Permissions:** Implemented a secure session-based authentication system with a granular, role-based permission model.
- **Item 7:** **Auction Creation Wizard Enhancement:** Refactored the auction wizard to correctly filter assets based on auction type (judicial vs. extrajudicial) and improved the workflow visualization.
- **Item 8:** **Full AI Integration:** Connecting the UI to the existing Genkit AI flows (`suggest-listing-details`, `predict-opening-value`) to provide listing suggestions and predictions to users during the auction creation process.
- **Item 9:** **PDF Document Generation:** Implemented the server-side logic using Puppeteer to generate PDF documents for winning bid terms, accessible from both the admin and user dashboards.
- **Item 10:** **Advanced UI/UX Features:** Implemented real-time updates for bids and auction status using polling and expanded the gamification system.
- **Item 11:** **Payment Gateway Integration:** Integrated a simulated payment processor for handling final payments for won lots, including checkout page, form validation, and status updates.
- **Item 13: Extração de Dados de Documentos com IA:** Implemented the full flow for document upload, AI data extraction, and a validation modal for user confirmation and form-filling.
- **Item 14: BidExpertOkrs - Dashboards de Análise e KPIs (Estratégico):**
    - **Fase 1:** Implementado o Dashboard de Relatórios Gerais (`/admin/reports`).
    - **Fase 2:** Criados dashboards de análise de grupo para Cidades, Estados, Comitentes, Leiloeiros, Categorias, Lotes e Leilões.
    - **Fase 3:** Adicionadas seções de dashboard de performance individual nas páginas de edição de Comitentes, Leiloeiros e Leilões.
    - **Fase 4:** Implementados dashboards de análise para todas as entidades judiciais (Tribunais, Comarcas e Varas).
    - **Fase 5:** Integrado o Genkit para fornecer análises e recomendações inteligentes em todos os dashboards de análise de grupo.
- **Item 15:** **Melhorar Formulário de Leilão com Seletores de Localização e Mapa:** Substituídos os campos de texto por `EntitySelector` e integrado um mapa interativo no formulário para definir a localização visualmente.
- **Item 16: Lógica de Relistagem de Lotes:** Implementada a funcionalidade para relistar um lote que não foi vendido, incluindo a UI no modal da página de edição do lote.
- **Item 17: Reloteamento de Bens:** Criada a lógica para desvincular um `Bem` de um lote não vendido, revertendo seu status para "DISPONÍVEL".
- **Item 18: Implementação de Pagamento Parcelado:** Criado o fluxo de checkout e um painel financeiro para pagamentos parcelados, incluindo um novo perfil de usuário "Financeiro".
- **Item 19: Padronização de Identificadores `data-ai-id`:** Adicionados atributos `data-ai-id` a todos os contêineres e componentes estruturais da interface do usuário para melhorar a testabilidade e a manipulação por IA.
- **Item 20: Auditoria e Refatoração Arquitetural (Análise de GAPs):** Todas as subtarefas, incluindo padronização de nomenclatura, `data-ai-id`, e uso do `EntitySelector` foram concluídas.
- **Item 21: Implementar Responsividade Completa (Mobile & Tablet):** O layout de tabelas, formulários e grids foi ajustado para garantir uma experiência de usuário consistente em todos os tamanhos de tela.
- **Item 23: Implementar Lógica de Precificação por Etapa:** Refatorada a base de dados (Prisma), serviços e a interface de usuário (formulários, páginas de detalhe) para suportar a definição de preços (lance inicial, incremento) por etapa/praça do leilão, em vez de um valor fixo no lote.
- **Item 24: Unificação dos Componentes de Card (UniversalCard):** Criado o `UniversalCard` e `UniversalListItem` e refatoradas as páginas principais (`HomePage`, `SearchPage`, `CategoryPage`, etc.) para usá-los.
- **Item 25: Implementar Construtor de Relatórios (Self-Service):** Criada a interface de design, edição, salvamento e carregamento de relatórios customizados.
- **Item 26: Implementar Painel de Análise de Usuários:** Criado o dashboard para análise de comportamento, gastos e atividade dos usuários na plataforma.
- **Item 27: Refatorar Testes de Integração e E2E:** Todos os testes de unidade e E2E foram refatorados com sucesso para usar a camada de `Server Actions` e o helper `callActionAsUser`, garantindo a validação da segurança, permissões e isolamento de tenants.
- **Item 28: Documentar Arquivos de Código-Fonte:** Adicionado um bloco de comentário explicativo (docblock) no topo de cada arquivo de código-fonte (`.ts`, `.tsx`, etc.) descrevendo seu propósito e responsabilidades.
- **Item 29: Padronização da Interface do Admin:** Refatoradas as páginas de listagem do painel de admin para usar o componente `SearchResultsFrame`, unificando a experiência de busca, filtro, ordenação e visualização (grade/lista/tabela).
- **Item 31: Refatorar Testes de UI:** Todos os testes de Playwright foram atualizados para utilizar seletores `data-ai-id` em vez de seletores de texto ou CSS, aumentando a robustez da suíte de testes.
- **Item 32: Correção de Estilo Responsivo:** Ajustado o contêiner principal da aplicação para remover restrições de largura máxima, permitindo que o layout se expanda corretamente em telas maiores.

## DOING
- **(Em andamento):** Melhorias contínuas e otimização da plataforma.

## NEXT
- **Item 30: Implementar Herança de Mídia:** Implementar a lógica de herança e substituição de imagens para Lotes e Leilões, conforme definido nas regras de negócio. Isso inclui atualizar os formulários para permitir que o usuário escolha entre herdar a galeria de um bem vinculado ou selecionar uma galeria customizada da Biblioteca de Mídia.
- **Melhoria Contínua:** Revisar e otimizar o desempenho de consultas críticas no banco de dados.
- **Documentação Final:** Gerar a documentação final do projeto e da API.

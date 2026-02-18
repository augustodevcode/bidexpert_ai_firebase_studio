# Relatório de Conflitos de Documentação e Regras Unificadas
**Data:** 13 de Fevereiro de 2026
**Status:** Consolidado via análise de código (Baseline: Realidade do Código)

## 1. Introdução
Este documento identifica as discrepâncias entre a documentação oficial (`.md`, `rules/`, `docs/`) e a implementação real no repositório. Seguindo a orientação do usuário, as regras presentes no **código-fonte** foram adotadas como oficiais. Regras documentadas que não possuem reflexo no código foram listadas separadamente para fins de geração de casos de teste.

---

## 2. Conflitos de Arquitetura e Dados

### 2.1 Acesso ao Banco de Dados (Prisma)
- **Conflito:** `AI_PROJECT_RULES.md` e `PIN_AI_RULES.txt` exigem o uso de um "Database Adapter Pattern" e proíbem o acesso direto ao cliente Prisma.
- **Realidade no Código:** Repositories (ex: `src/repositories/lot.repository.ts`) e Services (ex: `src/services/fipe.service.ts`) importam e usam o `prisma` (instância do `PrismaClient`) diretamente.
- **Regra Unificada (Adotada):** **Acesso direto ao Prisma Client via Repositories/Services é o padrão atual.** O `REGRAS_NEGOCIO_CONSOLIDADO.md` de Dez/2025 já corrobora esta prática como "Padrão Oficial".

### 2.2 Estratégia de Seed (Massa de Dados)
- **Conflito:** `REGRAS_NEGOCIO_CONSOLIDADO.md` afirma que scripts de seed DEVEM usar Actions ou Services e NUNCA o Prisma diretamente.
- **Realidade no Código:** Os scripts canônicos (`scripts/ultimate-master-seed.ts` e `prisma/seed.ts`) instanciam `new PrismaClient()` e realizam operações `upsert`/`create` diretamente no banco.
- **Regra Unificada (Adotada):** **Seeds podem utilizar o Prisma Client diretamente** para garantir performance e independência de lógica de UI em massa de dados.

### 2.3 Estrutura do Schema Prisma
- **Conflito:** Instruções em memória sugeriam uma estrutura modular (`prisma/models/`).
- **Realidade no Código:** Existe um arquivo único `prisma/schema.prisma`.
- **Regra Unificada (Adotada):** **Schema único em `prisma/schema.prisma`.** A modularização não foi implementada ou foi revertida.

---

## 3. Discrepâncias de Implementação (GAPs Críticos)

### 3.1 Status dos 8 GAPs de Investidores
- **Conflito:** Documentos declaram que os 8 GAPs (FIPE, Jurídico, Simulador, etc.) estão "✅ Implementados".
- **Realidade no Código:**
    - Os serviços existem (ex: `fipe.service.ts`, `super-opportunities.service.ts`).
    - **Porém**, os modelos de dados necessários (ex: `VehicleFipePrice`, `AssetFipeEvaluation`) ainda residem em `prisma/schema_gaps_extension.prisma` e **não foram mesclados ao `schema.prisma` principal**.
- **Regra Unificada (Adotada):** **GAPs estão em estado "Parcialmente Implementado"**. A lógica de serviço existe, mas a persistência real depende de atualização manual do schema.

---

## 4. Padrões de UI, UX e Design System

### 4.1 Nomenclatura CSS
- **Conflito:** Memórias instruíam o uso de nomes semânticos em inglês (ex: `btn-save-auction`).
- **Realidade no Código:** Uso exclusivo de **Tailwind Utility Classes** (ex: `className="flex items-center gap-2"`) sobre componentes Shadcn/UI.
- **Regra Unificada (Adotada):** **Padrão Tailwind Utility-First.** Nomes de classes semânticas customizados são exceções raras e não a regra.

### 4.2 Sinalização de Campos Obrigatórios
- **Conflito:** `REGRAS_NEGOCIO_CONSOLIDADO.md` (RN-003) exige asterisco vermelho (`*`) em todos os campos obrigatórios.
- **Realidade no Código:** Implementação inconsistente. O formulário de leilões (`auction-form.tsx`) segue a regra, mas o de ativos (`asset-form-v2.tsx`) não.
- **Regra Unificada (Adotada):** **Asteriscos devem ser aplicados manualmente**, mas a automação via Design System ainda é parcial/ausente.

---

## 5. Regras Presentes na Documentação mas AUSENTES no Código
*Use esta lista para gerar casos de teste que validem funcionalidades prometidas mas não entregues.*

1. **Botão Validador de Regras (RN-003):** Documentação cita um botão que navega para o primeiro campo pendente do formulário. **Inexistente na maioria dos CRUDS.**
2. **Desabilitação de Submissão Invalida (RN-003):** Regra diz que o botão de salvar deve ficar desabilitado enquanto o formulário for inválido. **Inconsistente no código.**
3. **Cadeia de Validação Super Oportunidades (RN-024):** Exige 9 validações específicas de integridade referencial. O código atual faz apenas validações superficiais de status e datas.
4. **Imersonação Administrativa (RN-024 - Pós-venda):** Documentação planeja imersonação para dashboards de Arrematante e Vendedor. **Apenas imersonação de Advogado está funcional.**
5. **Soft Close Automático (RN-AD-005):** Descrição detalhada de extensão de tempo via lances de último segundo. Embora os campos existam, a infraestrutura de tempo real (Redis/WS) para disparar a extensão precisa ser testada (suspeita de falta de implementação do trigger real).

---

## 6. Conclusão e Recomendação
A documentação atual do BidExpert é, em muitos pontos, uma **especificação de intenção** mais do que um reflexo do estado atual.

**Recomendação para Testes:**
1. Gerar testes de fumaça (Smoke Tests) para validar o acesso direto ao Prisma.
2. Criar testes de integração que falhem propositalmente onde os GAPs dependem de modelos de banco ausentes.
3. Validar a UI contra a RN-003, tratando a ausência de asteriscos como falha de conformidade de design.

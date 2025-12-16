## 1. Leitura e alinhamento
- [ ] Validar `proposal.md` e aprovar escopo
- [ ] Revisar `REGRAS_NEGOCIO_CONSOLIDADO.md` (RN-001 a RN-015 e anexos) para aderência

## 2. Modelagem de dados (Prisma)
- [ ] Adicionar `property_matricula` e `property_registration_number` em `judicial_processes`
- [ ] Adicionar enum `occupation_status` + campos `occupation_notes`, `occupation_last_verified`, `occupation_updated_by` em `assets`
- [ ] Adicionar enum `action_type`, `action_description`, `action_cnj_code` em `judicial_processes`
- [ ] Criar tabela `lot_risks` com relacionamentos e índices
- [ ] Rodar `prisma generate` e ajustar seeds se necessário

## 3. Admin (forms e validação)
- [ ] Judicial Process edit: dropdown tipo de ação + descrição + CNJ code; matrícula visível
- [ ] Assets edit: campos ocupação (status, notas, data, user) com validação zod/react-hook-form
- [ ] Lot risks: CRUD simples (list/add/edit) na página do lote ou seção dedicada
- [ ] Garantir `data-ai-id` e padrões RN-013/RN-014

## 4. Frontend público (Lot Details)
- [ ] Seção Propriedades mostra badge "Matrícula do Imóvel" ou fallback
- [ ] Badge de Ocupação com cor/status + tooltip última verificação + aviso se OCCUPIED
- [ ] Badge/label de Tipo de Ação + filtro de categoria (?actionType=)
- [ ] Nova seção "Riscos Identificados" com cards, alerta para CRITICO, detalhes expandíveis
- [ ] Adicionar `data-ai-id` nos elementos críticos

## 5. APIs/Services
- [ ] Expandir DTOs/queries para servir matrícula, ocupação, tipo de ação
- [ ] Expor endpoint/listagem de riscos do lote (leitura) e admin CRUD (criação/edição)
- [ ] Respeitar multi-tenant e isolamento

## 6. Testes e qualidade
- [ ] Vitest + React Testing Library para novas seções
- [ ] Visual regression (Vitest UI + Playwright provider) para LotDetails com badges/alertas
- [ ] E2E Playwright: fluxo de leitura de lote com filtros de tipo de ação e exibição de riscos
- [ ] npm run typecheck

## 7. Documentação
- [ ] Atualizar `REGRAS_NEGOCIO_CONSOLIDADO.md` com novos campos/fluxos
- [ ] Registrar notas no `IMPLEMENTATION_SUMMARY.md` se aplicável

# Change: Pro Safety Pack (matrícula, ocupação, ação judicial, riscos)

## Why
Profissionais não conseguem validar rapidamente segurança jurídica e operacional dos lotes: matrícula não aparece, ocupação é desconhecida, tipo de ação não é estruturado e não há quadro de riscos.

## What Changes
- Expor matrícula do imóvel no detalhe do lote e estruturar campo no judicial_process.
- Adicionar status/notas/data de ocupação em assets e exibir badge/tooltips no lote.
- Estruturar tipo de ação judicial (enum + descrição + CNJ code), com filtro/badge no frontend.
- Criar registro de riscos por lote com níveis e mitigação, visível em cards e admin CRUD.

## Impact
- Especificações: nova capacidade `lot-compliance-pro-safety`.
- Código afetado: prisma schema (judicial_processes, assets, lot_risks), admin forms (judicial process, assets, lots), UI de lote (detalhe, filtros), APIs de leitura (lots, risks).

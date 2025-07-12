-- Este script contém comandos ALTER TABLE para atualizar o schema existente.
-- A lógica de execução está no script `init-db.ts` para garantir que as colunas
-- sejam adicionadas apenas se ainda não existirem.

-- As alterações agora são aplicadas programaticamente em 'scripts/init-db.ts'
-- usando a função addColumnIfNotExists para segurança e idempotência.
-- Este arquivo é mantido para referência histórica, mas não é mais executado diretamente.

# Aplicar Schema no Prisma Cloud - Chunks SQL

## Ordem de AplicaÃ§Ã£o (IMPORTANTE!)

Execute os arquivos NA ORDEM NUMÃ‰RICA no console SQL do Prisma Cloud:

1. chunk_1_of_3.sql
2. chunk_2_of_3.sql
3. chunk_3_of_3.sql

## Como Aplicar

1. Acesse: https://console.prisma.io/cml8s7faa039r2afnzcyvi4ea/cml8s8xcs0361ytfoaaxl6qer/cml8s8xcs0362ytfo9x0u8sz0/studio

2. Clique no Ã­cone "Query" (SQL) no topo da pÃ¡gina

3. Para cada chunk:
   - Abra o arquivo .sql
   - Copie TODO o conteÃºdo (Ctrl+A â†’ Ctrl+C)
   - Cole no console SQL (Ctrl+V)
   - Clique em "Run" ou pressione Ctrl+Enter
   - Aguarde confirmaÃ§Ã£o de sucesso
   - PrÃ³ximo chunk

## ValidaÃ§Ã£o

ApÃ³s aplicar todos os chunks, execute no console SQL:

`sql
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
`

Resultado esperado: ~100 tabelas

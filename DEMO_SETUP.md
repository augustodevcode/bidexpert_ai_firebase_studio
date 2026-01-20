# Configuração do Ambiente Demo

Para habilitar o ambiente Demo (acessível via `demo.bidexpert.com.br`), siga estes passos:

1.  **Criação do Banco de Dados**:
    *   Crie um banco de dados MySQL chamado `bidexpert_demo`.
    *   Garanta que o usuário do banco (ex: `bidxprtmsqfire`) tenha permissões DDL e DML neste novo banco.

2.  **Configuração de Variáveis de Ambiente**:
    *   No arquivo `.env` (local) e nos Secrets do GitHub (CI/CD), adicione:
        ```env
        DATABASE_URL_DEMO="mysql://USER:PASSWORD@HOST:PORT/bidexpert_demo"
        ```

3.  **Inicialização**:
    *   O deploy automático via GitHub Actions (`deploy-demo.yml`) irá executar as migrações e o seed.
    *   Para rodar manualmente:
        ```bash
        # Definir a variável na sessão
        export DATABASE_URL_DEMO="..."
        
        # Enviar Schema
        npx prisma db push --schema=prisma/schema.prisma
        
        # Popular Dados
        npx tsx scripts/seed-demo.ts
        ```

4.  **Funcionamento**:
    *   O sistema utiliza a biblioteca `next/headers` no `src/lib/prisma.ts` para detectar o cabeçalho `x-tenant-subdomain` (inserido pelo middleware).
    *   Se o subdomínio for `demo`, todas as queries do Prisma serão redirecionadas automaticamente para a base Demo.

# Firebase Studio

Este é um NextJS starter em Firebase Studio.

Para começar, dê uma olhada em `src/app/page.tsx`.

---

## Configuração do Banco de Dados (Opcional)

Por padrão, o aplicativo usa dados de exemplo em memória (`SAMPLE_DATA`) e não requer configuração adicional. Para usar um banco de dados **MySQL** ou **PostgreSQL**, siga estas etapas:

### 1. Crie um arquivo `.env.local`

Na raiz do seu projeto, crie um arquivo chamado `.env.local`. Este arquivo armazenará suas credenciais de banco de dados com segurança e não será enviado para o controle de versão.

### 2. Adicione sua String de Conexão

Adicione a variável de ambiente apropriada ao seu arquivo `.env.local`. Você pode obter a string de conexão do painel de controle do seu provedor de banco de dados (por exemplo, Neon, Supabase, PlanetScale, AWS RDS) ou construí-la se estiver executando o banco de dados localmente.

**Formato das Strings:**
- **MySQL:** `mysql://[USUARIO]:[SENHA]@[HOST]:[PORTA]/[NOME_DO_BANCO]`
- **PostgreSQL:** `postgresql://[USUARIO]:[SENHA]@[HOST]:[PORTA]/[NOME_DO_BANCO]`

**Exemplo para MySQL:**
```
MYSQL_CONNECTION_STRING="mysql://root:sua_senha_secreta@localhost:3306/bidexpert_db"
```

**Exemplo para PostgreSQL:**
```
POSTGRES_CONNECTION_STRING="postgresql://postgres:sua_senha_secreta@localhost:5432/bidexpert_db"
```

### 3. Execute os Scripts de Configuração

Depois de configurar sua string de conexão, execute os seguintes scripts no terminal para preparar seu banco de dados. Certifique-se de substituir `[db]` por `mysql` ou `postgres`.

1.  **Inicializar o Esquema (Obrigatório):** Cria todas as tabelas necessárias.
    ```bash
    # Para MySQL
    npm run db:init:mysql

    # Para PostgreSQL
    npm run db:init:postgres
    ```

2.  **Configurar Usuário Admin (Recomendado):** Cria um usuário administrador padrão para você acessar o painel de admin.
    ```bash
    # Para MySQL
    npm run db:setup-admin:mysql

    # Para PostgreSQL
    npm run db:setup-admin:postgres
    ```
    
3.  **Popular com Dados de Exemplo (Opcional):** Preenche o banco de dados com dados de exemplo para facilitar o desenvolvimento.
    ```bash
    # Para MySQL
    npm run db:seed:mysql

    # Para PostgreSQL
    npm run db:seed:postgres
    ```

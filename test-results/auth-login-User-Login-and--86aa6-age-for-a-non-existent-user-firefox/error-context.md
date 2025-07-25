# Page snapshot

```yaml
- button "Open Next.js Dev Tools":
  - img
- alert
- img
- text: "Configuração de Desenvolvimento Selecione a fonte de dados para esta sessão. As opções de banco de dados só funcionarão se as strings de conexão correspondentes estiverem definidas no arquivo `.env.local`."
- radiogroup:
  - radio "Dados de Exemplo (Rápido, sem persistência)" [checked]:
    - img
  - text: Dados de Exemplo (Rápido, sem persistência)
  - radio "Firestore (Requer credenciais)"
  - text: Firestore (Requer credenciais)
  - radio "MySQL (Requer string de conexão)"
  - text: MySQL (Requer string de conexão)
  - radio "PostgreSQL (Requer string de conexão)"
  - text: PostgreSQL (Requer string de conexão)
- button "Aplicar e Recarregar":
  - img
  - text: Aplicar e Recarregar
```
# Guia de Integração Multi-Tenant (CRM -> BidExpert)

Este documento detalha a arquitetura multi-tenant da plataforma **BidExpert (Data Plane)** e como o **BidExpertCRM (Control Plane)** deve interagir com ela para provisionar e configurar novos inquilinos (Tenants).

## 1. Conceito e Arquitetura

A solução adota uma arquitetura de **SaaS Isolado Logicamente**, dividida em dois planos principais:

*   **Control Plane (BidExpertCRM)**: Responsável pela gestão comercial, planos, faturamento e ciclo de vida dos clientes. É a "fonte da verdade" sobre quem pode usar o sistema.
*   **Data Plane (BidExpert App)**: A aplicação de leilões em si. Onde os dados dos leilões, lotes e usuários finais residem.

### Isolamento de Tenant
No **Data Plane**, o isolamento é feito via **Tenant ID** nas tabelas do banco de dados (coluna `tenantId`).
*   **Resolução de Tenant**: O sistema identifica o tenant atual através do **Subdomínio** (ex: `leiloeiro-x.bidexpert.com.br`) ou cabeçalhos HTTP específicos em chamadas de API.
*   **Segurança**: O middleware da aplicação garante que dados de um tenant nunca vazem para outro.

## 2. Jornada de um Novo Tenant

O ciclo de vida de provisionamento de um novo cliente segue o seguinte fluxo:

1.  **Venda/Cadastro no CRM**: O operador cadastra o novo cliente no BidExpertCRM.
2.  **Provisionamento (API Create)**: O CRM chama a API do BidExpert para criar o registro do Tenant e o Usuário Administrador inicial.
3.  **Configuração (API Setup)**: (Opcional/Imediato) O CRM envia as configurações iniciais (marca, cores, preferências) para o BidExpert.
4.  **Ativação**: O sistema BidExpert está pronto. O administrador recebe as credenciais (ou link de definição de senha) e pode logar em `seu-subdominio.bidexpert.com.br`.

## 3. Autenticação das APIs de Integração

A comunicação entre o CRM e o BidExpert é protegida por uma **Chave de API (Service-to-Service)**.

*   **Header Obrigatório**: `Authorization`
*   **Formato**: `Bearer <TENANT_API_KEY>`
*   **Onde obter**: A chave `TENANT_API_KEY` deve ser configurada nas variáveis de ambiente (`.env`) da aplicação BidExpert e compartilhada de forma segura com o CRM.

---

## 4. Referência de APIs

### 4.1. Criar Tenant e Administrador
Cria a estrutura lógica do inquilino e seu primeiro usuário com permissões de `ADMIN`.

*   **Endpoint**: `POST /api/v1/tenant/create`
*   **Content-Type**: `application/json`

#### Corpo da Requisição (Payload)
```json
{
  "name": "Leilões Silva & Souza",
  "subdomain": "silvaesouza",
  "adminUser": {
    "email": "admin@silvaesouza.com.br",
    "fullName": "Roberto Silva",
    "password": "senha_temporaria_segura" // Opcional. Se omitido, será gerada.
  }
}
```

*   `subdomain`: Deve conter apenas letras minúsculas, números e hífens. Será usado na URL (ex: `silvaesouza.bidexpert.com.br`).
*   `adminUser`: Se o e-mail já existir na plataforma (ex: um usuário que opera em múltiplos leilões), ele será vinculado ao novo tenant e ganhará permissão de Admin nele.

#### Resposta de Sucesso (201 Created)
```json
{
  "success": true,
  "message": "Tenant criado com sucesso.",
  "tenant": {
    "id": "123",
    "name": "Leilões Silva & Souza",
    "subdomain": "silvaesouza",
    "createdAt": "2024-03-20T10:00:00.000Z"
  }
}
```

---

### 4.2. Configurar Tenant (Setup)
Atualiza as configurações da plataforma para um tenant específico. Pode ser chamado a qualquer momento para sincronizar configurações alteradas no CRM.

*   **Endpoint**: `POST /api/v1/tenant`
*   **Content-Type**: `application/json`

#### Corpo da Requisição (Payload)
```json
{
  "tenantId": "123", // ID retornado na criação
  "settings": {
    "siteTitle": "Portal Silva & Souza",
    "siteTagline": "Os melhores leilões do Brasil",
    "logoUrl": "https://cdn.exemplo.com/logos/silva.png",
    
    // Configurações de Tema (Cores)
    "themes": {
      "light": {
        "primary": "#0055AA",
        "secondary": "#FF9900"
      }
    },
    
    // Configurações de Leilão
    "biddingSettings": {
      "instantBiddingEnabled": true,
      "defaultStageDurationDays": 7
    },
    
    // Configurações de Notificação
    "notificationSettings": {
      "notifyOnNewAuction": true,
      "notifyOnAuctionEndingSoon": true
    },
    
    // Gatilhos Mentais e Badges
    "mentalTriggerSettings": {
      "showHotBidBadge": true,
      "showExclusiveBadge": false
    },

    // Configurações Realtime e Blockchain
    "realtimeSettings": {
        "blockchainEnabled": false,
        "softCloseEnabled": true,
        "softCloseMinutes": 5
    }
  }
}
```
*Nota: Todos os campos dentro de `settings` são opcionais. Envie apenas o que deseja alterar.*

#### Resposta de Sucesso (200 OK)
```json
{
  "success": true,
  "message": "Configurações atualizadas com sucesso."
}
```

## 5. Erros Comuns

*   **401 Unauthorized**: Header `Authorization` ausente ou chave incorreta.
*   **400 Bad Request**: Dados inválidos (ex: subdomínio com caracteres especiais, e-mail inválido). O campo `errors` detalhará o problema.
*   **409 Conflict**: Subdomínio já está em uso por outro tenant.

## 6. Exemplo de Implementação (cURL)

**Criar Tenant:**
```bash
curl -X POST https://app.bidexpert.com.br/api/v1/tenant/create \
  -H "Authorization: Bearer SUA_CHAVE_SECRETA" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Novo Cliente Leilões",
    "subdomain": "novocliente",
    "adminUser": {
      "email": "contato@novocliente.com",
      "fullName": "Gerente Novo"
    }
  }'
```

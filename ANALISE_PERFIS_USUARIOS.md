# 📊 ANÁLISE COMPLETA DE PERFIS DE USUÁRIO - BIDEXPERT

**Data de Criação:** 18 de Dezembro de 2025  
**Versão:** 1.0  
**Status:** ✅ Documento Consolidado

---

## 📑 ÍNDICE

1. [Resumo Executivo](#resumo-executivo)
2. [Perfis Essenciais (Roles)](#perfis-essenciais-roles)
3. [Sistema de Permissões](#sistema-de-permissões)
4. [Matriz de Acesso por Perfil](#matriz-de-acesso-por-perfil)
5. [Cenários e BDDs por Perfil](#cenários-e-bdds-por-perfil)
6. [Área Pública vs Área Privada](#área-pública-vs-área-privada)
7. [Dashboards Específicos](#dashboards-específicos)
8. [Referências de Código](#referências-de-código)

---

## 🎯 RESUMO EXECUTIVO

O BidExpert é uma plataforma multi-tenant de leilões online com um sistema de permissões granular baseado em **Roles** (perfis) com **Permissions** (permissões) atribuídas.

### Arquitetura de Autenticação/Autorização
```
Usuário → Roles (N:N via UsersOnRoles) → Permissions (JSON Array no Role)
         ↓
       Tenants (N:N via UsersOnTenants) → Isolamento Multi-Tenant
```

### Perfis Essenciais Identificados
| # | Perfil (Role) | Nome Normalizado | Descrição |
|---|--------------|------------------|-----------|
| 1 | **ADMIN** | `admin` | Administrador do sistema com acesso total |
| 2 | **AUCTION_ANALYST** | `auction_analyst` | Analista de Leilões - gerencia cadastros de leilões, lotes, bens |
| 3 | **AUCTIONEER** | `auctioneer` | Leiloeiro - conduz e gerencia leilões atribuídos |
| 4 | **SELLER** | `seller` | Comitente/Vendedor - proprietário dos bens |
| 5 | **BIDDER** | `bidder` | Arrematante - participante que dá lances |
| 6 | **LAWYER** | `lawyer` | Advogado - acesso jurídico e processos |
| 7 | **USER** | `user` | Usuário básico (convidado autenticado) |
| 8 | **SELLER_ADMIN** | `seller_admin` | Administrador de Comitente |
| 9 | **AUCTIONEER_ADMIN** | `auctioneer_admin` | Administrador de Leiloeiro |

---

## 👥 PERFIS ESSENCIAIS (ROLES)

### 1. ADMIN (Administrador)
**Descrição:** Acesso total ao sistema, pode gerenciar todos os recursos.

**Permissão Master:** `manage_all`

**Características:**
- ✅ Acesso a todas as rotas `/admin/*`
- ✅ CRUD completo em todas as entidades
- ✅ Gerenciamento de usuários, roles e permissões
- ✅ Acesso a configurações da plataforma
- ✅ Visualização de logs de auditoria
- ✅ Estatísticas e relatórios completos
- ✅ Impersonação de outros usuários (Lawyer, Seller, Bidder dashboards)

**Usuários de Teste:**
- `admin@bidexpert.com.br` / `Admin@123`
- `admin@lordland.com` / `password123`

---

### 2. AUCTION_ANALYST (Analista de Leilões)
**Descrição:** Perfil intermediário entre Admin e Leiloeiro, responsável pela administração de dados operacionais da plataforma.

**Permissões Típicas:**
- `auctions:create/read/update/delete/publish` - CRUD completo de leilões
- `lots:create/read/update/delete` - CRUD completo de lotes
- `assets:create/read/update/delete` - CRUD completo de bens/ativos
- `categories:create/read/update/delete` - CRUD de categorias
- `auctioneers:create/read/update/delete` - CRUD de leiloeiros
- `sellers:create/read/update/delete` - CRUD de comitentes
- `judicial_processes:create/read/update/delete` - CRUD de processos judiciais
- `states:read`, `cities:read` - Consulta de localidades
- `media:upload/read/update/delete` - Gestão de mídia
- `view_reports` - Ver relatórios

**Características:**
- ✅ Acesso ao painel admin para gestão de dados
- ✅ Cadastro e edição de leilões, lotes e bens
- ✅ Cadastro de leiloeiros e comitentes
- ✅ Cadastro de processos judiciais
- ✅ Gestão de categorias e subcategorias
- ✅ Upload e gerenciamento de mídia
- ❌ Não pode gerenciar usuários ou roles
- ❌ Não pode alterar configurações do sistema
- ❌ Não conduz leilões ao vivo (isso é do leiloeiro)

**Usuários de Teste:**
- `analista@lordland.com` / `password123`

---

### 3. AUCTIONEER (Leiloeiro)
**Descrição:** Profissional responsável por conduzir os leilões.

**Permissões Típicas:**
- `auctions:manage_assigned` - Gerenciar leilões atribuídos
- `lots:read` - Ver lotes
- `lots:update` - Editar lotes dos seus leilões
- `lots:finalize` - Finalizar e declarar vencedor
- `conduct_auctions` - Conduzir leilões no auditório virtual
- `view_reports` - Ver relatórios

**Características:**
- ✅ Acesso limitado ao painel admin (apenas leilões/lotes atribuídos)
- ✅ Condução de leilões ao vivo
- ✅ Declaração de vencedores
- ✅ Geração de documentos pós-leilão
- ❌ Não pode criar novos leilões (apenas gerenciar atribuídos)
- ❌ Não pode gerenciar usuários ou configurações

**Usuários de Teste:**
- `auctioneer@lordland.com` / `password123`
- `test.leiloeiro@bidexpert.com` / `Test@12345`

---

### 4. SELLER (Comitente/Vendedor)
**Descrição:** Proprietário dos bens a serem leiloados.

**Permissões Típicas:**
- `auctions:manage_own` - Gerenciar seus próprios leilões
- `lots:manage_own` - Gerenciar seus próprios lotes
- `direct_sales:manage_own` - Gerenciar vendas diretas
- `consignor_dashboard:view` - Ver painel do comitente
- `view_reports` - Ver relatórios

**Características:**
- ✅ Acesso ao `/consignor-dashboard/*`
- ✅ Visualização de seus leilões e lotes
- ✅ Acompanhamento de vendas
- ✅ Relatórios financeiros de suas vendas
- ❌ Não pode editar leilões de outros comitentes
- ❌ Acesso restrito ao painel admin

**Dashboard Específico:** `/consignor-dashboard`
- `/consignor-dashboard/overview` - Visão geral
- `/consignor-dashboard/auctions` - Seus leilões
- `/consignor-dashboard/lots` - Seus lotes
- `/consignor-dashboard/direct-sales` - Vendas diretas
- `/consignor-dashboard/financial` - Financeiro
- `/consignor-dashboard/reports` - Relatórios

**Usuários de Teste:**
- `seller@lordland.com` / `password123`

---

### 5. BIDDER (Arrematante)
**Descrição:** Participante que dá lances nos leilões.

**Permissões Típicas:**
- `view_auctions` - Ver leilões públicos
- `view_lots` - Ver lotes públicos
- `place_bids` - Fazer lances
- `direct_sales:place_proposal` - Fazer propostas em vendas diretas
- `direct_sales:buy_now` - Comprar agora
- `view_wins` - Ver arremates
- `manage_payments` - Gerenciar pagamentos
- `schedule_retrieval` - Agendar retirada

**Características:**
- ✅ Acesso ao `/dashboard/*` (Dashboard do Arrematante)
- ✅ Visualização de leilões e lotes públicos
- ✅ Habilitação em leilões (requer aprovação/documentos)
- ✅ Participação com lances (normais e automáticos/proxy)
- ✅ Visualização de arremates e pagamentos
- ✅ Favoritos e histórico pessoal
- ❌ Sem acesso ao painel admin
- ❌ Não pode editar leilões/lotes

**Dashboard Específico:** `/dashboard`
- `/dashboard/overview` - Visão geral
- `/dashboard/bids` - Meus lances
- `/dashboard/wins` - Arremates
- `/dashboard/favorites` - Favoritos
- `/dashboard/documents` - Documentos
- `/dashboard/notifications` - Notificações
- `/dashboard/history` - Histórico
- `/dashboard/reports` - Relatórios

**Usuários de Teste:**
- `bidder@lordland.com` / `password123`
- `user@bidexpert.com.br` / `User@123`

---

### 6. LAWYER (Advogado)
**Descrição:** Profissional jurídico com acesso a processos e documentação legal.

**Permissões Típicas:**
- `lawyer_dashboard:view` - Ver painel jurídico
- `lawyer_cases:view` - Ver casos/processos
- `lawyer_documents:manage` - Gerenciar documentos jurídicos

**Características:**
- ✅ Acesso ao `/lawyer/dashboard`
- ✅ Visualização de processos judiciais vinculados
- ✅ Gestão de documentação legal
- ✅ Acompanhamento de audiências
- ✅ Métricas específicas (casos ativos, audiências, documentos pendentes)
- ❌ Sem acesso a lances ou operações comerciais

**Dashboard Específico:** `/lawyer/dashboard`
- Métricas: Casos ativos, Audiências da semana, Documentos pendentes, Valor da carteira
- Lista de processos na carteira jurídica
- Agenda de audiências
- Documentos operacionais
- Card de monetização (tarefas prioritárias)

**Usuários de Teste:**
- `advogado@bidexpert.com.br` / `Test@12345`

---

### 7. USER (Usuário Básico)
**Descrição:** Usuário autenticado sem perfil específico.

**Características:**
- ✅ Acesso às áreas públicas
- ✅ Navegação em leilões e lotes
- ✅ Perfil básico
- ❌ Não pode dar lances (precisa de perfil BIDDER)
- ❌ Sem dashboard específico

---

## 🔐 SISTEMA DE PERMISSÕES

### Categorias de Permissões (Groups)

O sistema organiza 68+ permissões em 15 grupos:

#### 1. Categorias
| Permissão | Label | Descrição |
|-----------|-------|-----------|
| `categories:create` | Categorias: Criar | Criar novas categorias |
| `categories:read` | Categorias: Ver | Visualizar categorias |
| `categories:update` | Categorias: Editar | Editar categorias |
| `categories:delete` | Categorias: Excluir | Excluir categorias |

#### 2. Localidades (Estados e Cidades)
| Permissão | Label |
|-----------|-------|
| `states:create/read/update/delete` | CRUD de Estados |
| `cities:create/read/update/delete` | CRUD de Cidades |

#### 3. Leiloeiros
| Permissão | Label |
|-----------|-------|
| `auctioneers:create` | Leiloeiros: Criar |
| `auctioneers:read` | Leiloeiros: Ver |
| `auctioneers:update` | Leiloeiros: Editar |
| `auctioneers:delete` | Leiloeiros: Excluir |

#### 4. Comitentes (Sellers)
| Permissão | Label |
|-----------|-------|
| `sellers:create/read/update/delete` | CRUD de Comitentes |

#### 5. Leilões
| Permissão | Label | Descrição |
|-----------|-------|-----------|
| `auctions:create` | Leilões: Criar | Criar novos leilões |
| `auctions:read` | Leilões: Ver Todos | Ver todos os leilões |
| `auctions:update` | Leilões: Editar Todos | Editar qualquer leilão |
| `auctions:delete` | Leilões: Excluir Todos | Excluir qualquer leilão |
| `auctions:publish` | Leilões: Publicar | Publicar leilões |
| `auctions:manage_own` | Leilões: Gerenciar Próprios (Comitente) | Apenas seus leilões |
| `auctions:manage_assigned` | Leilões: Gerenciar Atribuídos (Leiloeiro) | Leilões atribuídos |

#### 6. Lotes
| Permissão | Label |
|-----------|-------|
| `lots:create` | Lotes: Criar |
| `lots:read` | Lotes: Ver Todos |
| `lots:update` | Lotes: Editar Todos |
| `lots:delete` | Lotes: Excluir Todos |
| `lots:manage_own` | Lotes: Gerenciar Próprios (Comitente) |
| `lots:finalize` | Lotes: Finalizar e Declarar Vencedor |

#### 7. Biblioteca de Mídia
| Permissão | Label |
|-----------|-------|
| `media:upload` | Mídia: Fazer Upload |
| `media:read` | Mídia: Ver Biblioteca |
| `media:update` | Mídia: Editar Metadados |
| `media:delete` | Mídia: Excluir |

#### 8. Usuários e Perfis
| Permissão | Label |
|-----------|-------|
| `users:create/read/update/delete` | CRUD de Usuários |
| `users:assign_roles` | Usuários: Atribuir Perfis |
| `users:manage_habilitation` | Usuários: Gerenciar Habilitação |
| `roles:create/read/update/delete` | CRUD de Perfis |

#### 9. Configurações
| Permissão | Label |
|-----------|-------|
| `settings:read` | Configurações: Ver |
| `settings:update` | Configurações: Editar |

#### 10. Documentos Pós-Leilão
| Permissão | Label |
|-----------|-------|
| `documents:generate_report` | Documentos: Gerar Laudo de Avaliação |
| `documents:generate_certificate` | Documentos: Gerar Certificado de Leilão |
| `documents:generate_term` | Documentos: Gerar Auto de Arrematação |

#### 11. Usuário Final (Público)
| Permissão | Label |
|-----------|-------|
| `view_auctions` | Público: Ver Leilões |
| `view_lots` | Público: Ver Lotes |
| `place_bids` | Público: Fazer Lances |

#### 12. Venda Direta
| Permissão | Label |
|-----------|-------|
| `direct_sales:manage_own` | Venda Direta: Gerenciar Próprias |
| `direct_sales:place_proposal` | Venda Direta: Fazer Propostas |
| `direct_sales:buy_now` | Venda Direta: Comprar Agora |

#### 13. Arrematante
| Permissão | Label |
|-----------|-------|
| `view_wins` | Arrematante: Ver Arremates |
| `manage_payments` | Arrematante: Gerenciar Pagamentos |
| `schedule_retrieval` | Arrematante: Agendar Retirada |

#### 14. Comitente (Dashboard)
| Permissão | Label |
|-----------|-------|
| `consignor_dashboard:view` | Comitente: Ver Painel |
| `view_reports` | Comitente: Ver Relatórios |

#### 15. Leiloeiro (Auditório)
| Permissão | Label |
|-----------|-------|
| `conduct_auctions` | Leiloeiro: Conduzir Leilões (Auditório) |

#### 16. Financeiro
| Permissão | Label |
|-----------|-------|
| `financial:view` | Financeiro: Ver Painel |
| `financial:manage` | Financeiro: Gerenciar Pagamentos |

#### 17. Advogado (Portal Jurídico)
| Permissão | Label |
|-----------|-------|
| `lawyer_dashboard:view` | Advogado: Ver Painel |
| `lawyer_cases:view` | Advogado: Ver Casos |
| `lawyer_documents:manage` | Advogado: Gerenciar Documentos |

#### 18. Geral / Admin
| Permissão | Label |
|-----------|-------|
| `manage_all` | Acesso Total (Administrador) |

#### 19. Tenant Admin
| Permissão | Label |
|-----------|-------|
| `manage_tenant_users` | Admin Tenant: Gerenciar Usuários do Tenant |
| `manage_tenant_auctions` | Admin Tenant: Gerenciar Leilões do Tenant |

---

## 📋 MATRIZ DE ACESSO POR PERFIL

### Legenda
- ✅ Permitido
- ⚠️ Parcial (apenas próprios recursos)
- ❌ Negado

| Recurso/Ação | ADMIN | AUCTIONEER | SELLER | BIDDER | LAWYER | USER |
|--------------|-------|------------|--------|--------|--------|------|
| **ÁREA PÚBLICA** | | | | | | |
| Ver Home/Landing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver Leilões Públicos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver Lotes Públicos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver Vendas Diretas | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Busca/Pesquisa | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver Detalhes do Lote | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| FAQ/Suporte Público | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | | | | | | |
| **AUTENTICAÇÃO** | | | | | | |
| Login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Registro | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Recuperar Senha | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editar Perfil | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | | | | | | |
| **LANCES/PARTICIPAÇÃO** | | | | | | |
| Habilitar-se em Leilão | ✅ | ⚠️ | ⚠️ | ✅ | ❌ | ❌ |
| Dar Lances | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Lance Automático (Proxy) | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Ver Meus Lances | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| | | | | | | |
| **ADMIN - LEILÕES** | | | | | | |
| Ver Todos Leilões | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| Criar Leilão | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Editar Qualquer Leilão | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| Excluir Leilão | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Publicar Leilão | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| | | | | | | |
| **ADMIN - LOTES** | | | | | | |
| Ver Todos Lotes | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| Criar Lote | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| Editar Qualquer Lote | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| Excluir Lote | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Finalizar/Declarar Vencedor | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| | | | | | | |
| **ADMIN - CONFIGURAÇÕES** | | | | | | |
| Ver Configurações | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Editar Configurações | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gerenciar Usuários | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gerenciar Roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver Logs de Auditoria | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| | | | | | | |
| **DASHBOARDS** | | | | | | |
| Admin Dashboard | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| Consignor Dashboard | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Bidder Dashboard | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Lawyer Dashboard | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| | | | | | | |
| **IMPERSONAÇÃO** | | | | | | |
| Impersonar Advogado | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Impersonar Comitente | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Impersonar Arrematante | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🎬 CENÁRIOS E BDDS POR PERFIL

### CENÁRIOS DO ADMIN

```gherkin
Feature: Administração do Sistema
  Como um administrador do sistema
  Eu quero gerenciar todos os recursos da plataforma
  Para manter o funcionamento adequado do sistema

  Scenario: Admin acessa painel administrativo
    Given que estou logado como admin@bidexpert.com.br
    When eu acesso "/admin/dashboard"
    Then devo ver o dashboard administrativo
    And devo ver menu lateral com todas as opções

  Scenario: Admin visualiza todos os logs de auditoria
    Given que estou logado como administrador
    And tenho permissão "manage_all"
    When eu acesso "/api/audit?page=1&pageSize=20"
    Then devo ver logs de múltiplos usuários
    And os campos sensíveis devem estar filtrados como [REDACTED]

  Scenario: Admin impersona advogado
    Given que estou logado como administrador
    When eu acesso "/lawyer/dashboard"
    Then devo ver o seletor de impersonação
    And devo poder visualizar o painel como qualquer advogado

  Scenario: Admin gerencia configurações globais
    Given que estou na página "/admin/settings"
    When eu altero as configurações
    And clico em "Salvar"
    Then as configurações devem ser persistidas
    And um toast de sucesso deve aparecer

  Scenario: Admin cria novo leilão completo
    Given que estou em "/admin/auctions/new"
    When preencho todos os campos obrigatórios
    And associo leiloeiro e comitente
    And defino as praças
    And clico em "Salvar"
    Then o leilão deve ser criado com sucesso

  Scenario: Admin gerencia permissões de usuário
    Given que estou em "/admin/users"
    When seleciono um usuário
    And modifico seus perfis/roles
    Then as permissões devem ser atualizadas
    And o usuário deve ter acesso conforme novo perfil
```

### CENÁRIOS DO LEILOEIRO

```gherkin
Feature: Gestão de Leilões pelo Leiloeiro
  Como um leiloeiro certificado
  Eu quero gerenciar meus leilões atribuídos
  Para conduzir os leilões adequadamente

  Scenario: Leiloeiro visualiza apenas leilões atribuídos
    Given que estou logado como leiloeiro
    When eu acesso "/admin/auctions"
    Then devo ver apenas leilões onde sou o leiloeiro responsável
    And não devo ver leilões de outros leiloeiros

  Scenario: Leiloeiro conduz leilão ao vivo
    Given que existe um leilão ao vivo atribuído a mim
    When eu acesso o auditório virtual
    Then devo ter controle da sessão de lances
    And devo poder declarar o vencedor

  Scenario: Leiloeiro finaliza lote
    Given que um lote tem lance vencedor
    When eu clico em "Finalizar Lote"
    Then o lote deve ser marcado como vendido
    And o vencedor deve ser registrado
    And uma notificação deve ser enviada ao arrematante

  Scenario: Leiloeiro não pode criar novos leilões
    Given que estou logado como leiloeiro
    When eu tento acessar "/admin/auctions/new"
    Then devo ver mensagem de acesso negado
    Ou ser redirecionado para página permitida

  Scenario: Leiloeiro gera documentos pós-leilão
    Given que um leilão foi encerrado
    And eu sou o leiloeiro responsável
    When acesso a área de documentos
    Then devo poder gerar Auto de Arrematação
    And devo poder gerar Certificado de Leilão
```

### CENÁRIOS DO COMITENTE (SELLER)

```gherkin
Feature: Dashboard do Comitente
  Como um comitente/vendedor
  Eu quero acompanhar meus leilões e vendas
  Para monitorar o desempenho dos meus bens

  Scenario: Comitente acessa seu dashboard
    Given que estou logado como comitente
    When eu acesso "/consignor-dashboard"
    Then devo ver a visão geral das minhas vendas
    And devo ver resumo de leilões ativos

  Scenario: Comitente visualiza seus leilões
    Given que estou no consignor dashboard
    When acesso a seção "Leilões"
    Then devo ver apenas leilões onde sou o comitente
    And não devo ver leilões de outros comitentes

  Scenario: Comitente acompanha financeiro
    Given que tenho vendas concluídas
    When acesso "/consignor-dashboard/financial"
    Then devo ver valores de vendas
    And devo ver comissões e repasses

  Scenario: Comitente gerencia venda direta
    Given que tenho permissão "direct_sales:manage_own"
    When acesso "/consignor-dashboard/direct-sales"
    Then devo poder criar novas vendas diretas
    And devo poder gerenciar propostas recebidas

  Scenario: Comitente não acessa painel admin completo
    Given que estou logado como comitente
    When eu tento acessar "/admin/users"
    Then devo ver mensagem de acesso negado
```

### CENÁRIOS DO ARREMATANTE (BIDDER)

```gherkin
Feature: Participação em Leilões como Arrematante
  Como um arrematante verificado
  Eu quero participar de leilões
  Para arrematar bens de meu interesse

  Scenario: Arrematante visualiza leilões públicos
    Given que estou na homepage
    When navego pelos leilões
    Then devo ver leilões com status "ABERTO_PARA_LANCES"
    And não devo ver leilões em "RASCUNHO" ou "EM_PREPARACAO"

  Scenario: Arrematante se habilita em leilão
    Given que encontrei um leilão de interesse
    And não estou habilitado
    When clico em "Habilitar-me"
    Then devo ver formulário de habilitação
    And devo poder enviar documentos necessários

  Scenario: Arrematante dá lance normal
    Given que estou habilitado no leilão
    And o lote está "ABERTO_PARA_LANCES"
    And o lance mínimo é R$ 10.000
    When eu dou um lance de R$ 12.000
    Then o lance deve ser registrado
    And devo ver confirmação de sucesso
    And o lance deve aparecer no histórico

  Scenario: Arrematante configura lance automático (proxy)
    Given que estou habilitado no leilão
    When eu defino lance máximo de R$ 50.000
    And outro usuário dá lance de R$ 40.000
    Then o sistema deve dar um contra-lance automaticamente
    E eu devo continuar como maior lance

  Scenario: Arrematante é notificado quando superado
    Given que tenho o maior lance em um lote
    When outro usuário dá um lance maior
    Then devo receber uma notificação
    And a notificação deve conter link para o lote

  Scenario: Arrematante visualiza seus arremates
    Given que ganhei um lote
    When acesso "/dashboard/wins"
    Then devo ver o lote arrematado
    And devo ver opções de pagamento
    And devo ver status de retirada

  Scenario: Arrematante gerencia pagamentos
    Given que tenho arremates pendentes de pagamento
    When acesso "/dashboard/wins"
    Then devo ver parcelas e datas de vencimento
    And devo poder efetuar pagamentos

  Scenario: Arrematante adiciona favoritos
    Given que visualizo um lote
    When clico no botão de favoritar
    Then o lote deve ser salvo em meus favoritos
    And devo poder vê-lo em "/dashboard/favorites"
```

### CENÁRIOS DO ADVOGADO (LAWYER)

```gherkin
Feature: Portal do Advogado
  Como um advogado cadastrado
  Eu quero acompanhar processos judiciais
  Para gerenciar minha carteira de casos

  Scenario: Advogado acessa seu dashboard
    Given que estou logado como advogado@bidexpert.com.br
    When a página "/lawyer/dashboard" carrega
    Then devo ver o título "Painel Jurídico"
    And devo ver métricas principais

  Scenario: Advogado visualiza métricas
    Given que estou no painel jurídico
    Then devo ver:
      | Métrica | testId |
      | Casos Ativos | lawyer-metric-active-cases |
      | Audiências da Semana | lawyer-metric-hearings-week |
      | Documentos Pendentes | lawyer-metric-documents-pending |
      | Valor da Carteira | lawyer-metric-portfolio-value |

  Scenario: Advogado lista processos
    Given que tenho processos na carteira
    When visualizo a lista de casos
    Then devo ver o número do processo
    And devo ver informações do tribunal e vara

  Scenario: Advogado visualiza audiências
    Given que tenho audiências agendadas
    When visualizo o card de audiências
    Then devo ver datas e horários
    And devo ver locais das audiências

  Scenario: Advogado gerencia documentos
    Given que tenho documentos pendentes
    When acesso a seção de documentos
    Then devo ver lista de documentos
    And devo ver status de cada documento

  Scenario: Advogado não vê seletor de impersonação
    Given que estou logado como advogado (não admin)
    When acesso "/lawyer/dashboard"
    Then o seletor de impersonação NÃO deve estar visível
```

### CENÁRIOS DE USUÁRIO NÃO AUTENTICADO

```gherkin
Feature: Acesso Público à Plataforma
  Como um visitante não autenticado
  Eu quero navegar pela plataforma
  Para conhecer os leilões disponíveis

  Scenario: Visitante visualiza homepage
    Given que não estou logado
    When acesso a homepage
    Then devo ver leilões em destaque
    And devo ver lotes encerrando em breve
    And devo ver categorias principais

  Scenario: Visitante busca leilões
    Given que estou na página de pesquisa
    When busco por "imóveis"
    Then devo ver resultados filtrados
    And devo ver contagem de resultados por aba

  Scenario: Visitante tenta dar lance
    Given que não estou logado
    When tento dar lance em um lote
    Then devo ser redirecionado para login
    Ou devo ver modal solicitando autenticação

  Scenario: Visitante não acessa API de auditoria
    Given que não estou autenticado
    When faço requisição para "/api/audit"
    Then devo receber status 401 Unauthorized

  Scenario: Visitante acessa suporte
    Given que estou em qualquer página pública
    Then devo ver botão flutuante de suporte
    When clico no botão
    Then devo ver opções: FAQ, Chat AI, Reportar Issue
```

---

## 🌐 ÁREA PÚBLICA VS ÁREA PRIVADA

### ROTAS PÚBLICAS (Sem Autenticação)

| Rota | Descrição | Componente |
|------|-----------|------------|
| `/` | Homepage | `page.tsx` |
| `/search` | Busca/Pesquisa | `search/page.tsx` |
| `/auctions` | Lista de Leilões | `auctions/page.tsx` |
| `/auctions/[slug]` | Detalhes do Leilão | `auctions/[slug]/page.tsx` |
| `/lots/[publicId]` | Detalhes do Lote | `lots/[publicId]/page.tsx` |
| `/direct-sales` | Vendas Diretas | `direct-sales/page.tsx` |
| `/category/[slug]` | Lotes por Categoria | `category/[slug]/page.tsx` |
| `/sellers/[slug]` | Página do Comitente | `sellers/[slug]/page.tsx` |
| `/auctioneers/[slug]` | Página do Leiloeiro | `auctioneers/[slug]/page.tsx` |
| `/map-search` | Busca no Mapa | `map-search/page.tsx` |
| `/faq` | Perguntas Frequentes | `faq/page.tsx` |
| `/about` | Sobre | `about/page.tsx` |
| `/contact` | Contato | `contact/page.tsx` |
| `/terms` | Termos de Uso | `terms/page.tsx` |
| `/privacy` | Política de Privacidade | `privacy/page.tsx` |
| `/auth/login` | Login | `auth/login/page.tsx` |
| `/auth/register` | Registro | `auth/register/page.tsx` |
| `/auth/forgot-password` | Recuperar Senha | `auth/forgot-password/page.tsx` |

### ROTAS PRIVADAS (Autenticação Obrigatória)

#### Admin Panel (`/admin/*`)
Requer: Role com permissões admin

| Rota | Permissão Mínima |
|------|------------------|
| `/admin/dashboard` | `manage_all` |
| `/admin/auctions` | `auctions:read` |
| `/admin/lots` | `lots:read` |
| `/admin/assets` | `assets:read` |
| `/admin/sellers` | `sellers:read` |
| `/admin/auctioneers` | `auctioneers:read` |
| `/admin/users` | `users:read` |
| `/admin/roles` | `roles:read` |
| `/admin/settings` | `settings:read` |
| `/admin/categories` | `categories:read` |
| `/admin/judicial-processes` | Específico |
| `/admin/habilitations` | `users:manage_habilitation` |
| `/admin/media` | `media:read` |
| `/admin/support-tickets` | `manage_all` |

#### Consignor Dashboard (`/consignor-dashboard/*`)
Requer: Role SELLER ou permissão `consignor_dashboard:view`

| Rota | Descrição |
|------|-----------|
| `/consignor-dashboard/overview` | Visão geral |
| `/consignor-dashboard/auctions` | Seus leilões |
| `/consignor-dashboard/lots` | Seus lotes |
| `/consignor-dashboard/direct-sales` | Vendas diretas |
| `/consignor-dashboard/financial` | Financeiro |
| `/consignor-dashboard/reports` | Relatórios |

#### Bidder Dashboard (`/dashboard/*`)
Requer: Role BIDDER ou permissões de arrematante

| Rota | Descrição |
|------|-----------|
| `/dashboard/overview` | Visão geral |
| `/dashboard/bids` | Meus lances |
| `/dashboard/wins` | Arremates |
| `/dashboard/favorites` | Favoritos |
| `/dashboard/documents` | Documentos |
| `/dashboard/notifications` | Notificações |
| `/dashboard/history` | Histórico |

#### Lawyer Dashboard (`/lawyer/*`)
Requer: Role LAWYER ou permissão `lawyer_dashboard:view`

| Rota | Descrição |
|------|-----------|
| `/lawyer/dashboard` | Painel Jurídico |

#### Profile (`/profile/*`)
Requer: Qualquer usuário autenticado

| Rota | Descrição |
|------|-----------|
| `/profile` | Meu perfil |
| `/profile/edit` | Editar perfil |

---

## 📊 DASHBOARDS ESPECÍFICOS

### Admin Dashboard
**Rota:** `/admin/dashboard`
**Acesso:** ADMIN

**Métricas:**
- Total de leilões ativos
- Total de lotes
- Total de usuários
- Valor em lances
- Leilões encerrando hoje
- Últimos registros

### Consignor Dashboard
**Rota:** `/consignor-dashboard`
**Acesso:** SELLER

**Métricas:**
- Leilões ativos do comitente
- Lotes em andamento
- Vendas concluídas
- Valor arrecadado
- Comissões a receber

**Seções:**
- Meus Leilões
- Meus Lotes
- Vendas Diretas
- Financeiro
- Relatórios

### Bidder Dashboard
**Rota:** `/dashboard`
**Acesso:** BIDDER

**Métricas:**
- Lances ativos
- Arremates pendentes
- Pagamentos a vencer
- Favoritos

**Seções:**
- `WonLotsSection` - Lotes arrematados
- `PaymentsSection` - Métodos de pagamento
- `DocumentsSection` - Documentos
- `NotificationsSection` - Notificações
- `HistorySection` - Histórico de participações
- `ProfileSection` - Perfil

### Lawyer Dashboard
**Rota:** `/lawyer/dashboard`
**Acesso:** LAWYER

**Métricas:**
- `lawyer-metric-active-cases` - Casos ativos
- `lawyer-metric-hearings-week` - Audiências da semana
- `lawyer-metric-documents-pending` - Documentos pendentes
- `lawyer-metric-portfolio-value` - Valor da carteira

**Seções:**
- `lawyer-cases-card` - Lista de processos
- `lawyer-hearings-card` - Agenda de audiências
- `lawyer-documents-card` - Documentos operacionais
- `lawyer-monetization-card` - Tarefas prioritárias

---

## 📁 REFERÊNCIAS DE CÓDIGO

### Arquivos de Permissões
- `src/lib/permissions.ts` - Funções: `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()`, `predefinedPermissions`
- `src/services/role.service.ts` - RoleService (CRUD de roles)
- `src/repositories/role.repository.ts` - RoleRepository
- `prisma/schema.prisma` - Modelos: `Role`, `UsersOnRoles`, `User`

### Arquivos de Seeds (Dados de Teste)
- `prisma/seed.ts` - Seed principal com roles e usuários
- `scripts/update-admin-permissions.ts` - Atualiza permissão `manage_all` do admin

### Testes E2E de Permissões
- `tests/e2e/audit/audit-permissions.spec.ts` - Testes de acesso à auditoria
- `tests/e2e/admin/lawyer-impersonation.spec.ts` - Testes de impersonação
- `tests/e2e/lawyer-dashboard.spec.ts` - Testes do painel do advogado

### BDDs (Features Gherkin)
- `tests/itsm/features/admin-tickets.feature` - Tickets de Admin
- `tests/itsm/features/support-system.feature` - Sistema de Suporte
- `tests/itsm/features/query-monitor.feature` - Monitor de Queries

### Regras de Negócio
- `context/REGRAS_NEGOCIO_CONSOLIDADO.md` - Documento oficial de regras

---

## 🚗 JORNADAS COMPLETAS POR PERFIL

Esta seção documenta a jornada técnica completa de cada perfil, incluindo:
- Páginas e rotas acessíveis
- Seções e componentes de cada página
- Botões e CTAs disponíveis
- Server Actions com parâmetros e retornos
- Services e todos os seus métodos
- Modelos de banco de dados (Prisma) com todos os campos

---

### JORNADA 1: ADMIN (Administrador)

#### Páginas e Rotas Acessíveis

| Rota | Página | Descrição |
|------|--------|-----------|
| `/admin/dashboard` | `page.tsx` | Dashboard administrativo principal |
| `/admin/auctions` | `page.tsx` | Lista de todos os leilões |
| `/admin/auctions/new` | `new/page.tsx` | Criar novo leilão |
| `/admin/auctions/[auctionId]` | `[auctionId]/page.tsx` | Detalhes/edição do leilão |
| `/admin/lots` | `page.tsx` | Lista de todos os lotes |
| `/admin/lots/new` | `new/page.tsx` | Criar novo lote |
| `/admin/lots/[lotId]` | `[lotId]/page.tsx` | Detalhes/edição do lote |
| `/admin/assets` | `page.tsx` | Lista de todos os ativos |
| `/admin/assets/new` | `new/page.tsx` | Criar novo ativo |
| `/admin/assets/[assetId]` | `[assetId]/page.tsx` | Detalhes/edição do ativo |
| `/admin/sellers` | `page.tsx` | Lista de comitentes |
| `/admin/auctioneers` | `page.tsx` | Lista de leiloeiros |
| `/admin/users` | `page.tsx` | Gerenciamento de usuários |
| `/admin/roles` | `page.tsx` | Gerenciamento de perfis |
| `/admin/settings` | `page.tsx` | Configurações da plataforma |
| `/admin/categories` | `page.tsx` | Gerenciamento de categorias |
| `/admin/judicial-processes` | `page.tsx` | Processos judiciais |
| `/admin/habilitations` | `page.tsx` | Habilitações de usuários |
| `/admin/media` | `page.tsx` | Biblioteca de mídia |
| `/admin/reports` | `page.tsx` | Relatórios |
| `/admin/support-tickets` | `page.tsx` | Tickets de suporte |
| `/admin/wizard` | `page.tsx` | Wizard de criação |

#### Actions de Leilões (`src/app/admin/auctions/actions.ts`)

| Action | Parâmetros | Retorno |
|--------|------------|---------|
| `getAuctions` | `isPublicCall: boolean = false, limit?: number` | `Promise<Auction[]>` |
| `getAuction` | `id: string, isPublicCall: boolean = false` | `Promise<Auction \| null>` |
| `getAuctionById` | `id: bigint, isPublicCall: boolean = false` | `Promise<Auction \| null>` |
| `getAuctionPreparationData` | `auctionIdentifier: string` | `Promise<AuctionPreparationData \| null>` |
| `createAuction` | `data: Partial<AuctionFormData>` | `Promise<{ success: boolean, message: string, auctionId?: string }>` |
| `updateAuction` | `id: string, data: Partial<AuctionFormData>` | `Promise<{ success: boolean, message: string }>` |
| `deleteAuction` | `id: string` | `Promise<{ success: boolean, message: string }>` |
| `updateAuctionTitle` | `id: string, newTitle: string` | `Promise<{ success: boolean; message: string; }>` |
| `updateAuctionImage` | `auctionId: string, mediaItemId: string, imageUrl: string` | `Promise<{ success: boolean; message: string; }>` |
| `updateAuctionFeaturedStatus` | `id: string, newStatus: boolean` | `Promise<{ success: boolean; message: string; }>` |
| `getAuctionsBySellerSlug` | `sellerSlugOrPublicId: string` | `Promise<Auction[]>` |
| `getAuctionsByAuctioneerSlug` | `auctioneerSlug: string` | `Promise<Auction[]>` |
| `getAuctionsByIds` | `ids: string[]` | `Promise<Auction[]>` |

#### Actions de Lotes (`src/app/admin/lots/actions.ts`)

| Action | Parâmetros | Retorno |
|--------|------------|---------|
| `getLots` | `filter?: { auctionId?: string; judicialProcessId?: string }, isPublicCall: boolean = false, limit?: number` | `Promise<Lot[]>` |
| `getLot` | `id: string, isPublicCall: boolean = false` | `Promise<Lot \| null>` |
| `createLot` | `data: Partial<LotFormData>` | `Promise<{ success: boolean; message: string; lotId?: string }>` |
| `updateLot` | `id: string, data: Partial<LotFormData>` | `Promise<{ success: boolean; message: string }>` |
| `deleteLot` | `id: string, auctionId?: string` | `Promise<{ success: boolean; message: string }>` |
| `getAssetsForLotting` | `filter?: { judicialProcessId?: string, sellerId?: string }` | `Promise<Asset[]>` |
| `getAssetsByIdsAction` | `ids: string[]` | `Promise<Asset[]>` |
| `getLotsByIds` | `ids: string[]` | `Promise<Lot[]>` |
| `finalizeLot` | `lotId: string` | `Promise<{ success: boolean; message: string }>` |
| `updateLotFeaturedStatus` | `id: string, isFeatured: boolean` | `Promise<{ success: boolean, message: string }>` |
| `updateLotTitle` | `id: string, title: string` | `Promise<{ success: boolean, message: string }>` |
| `updateLotImage` | `id: string, mediaItemId: string, imageUrl: string` | `Promise<{ success: boolean, message: string }>` |

#### Actions de Ativos (`src/app/admin/assets/actions.ts`)

| Action | Parâmetros | Retorno |
|--------|------------|---------|
| `getAssets` | `filter?: { judicialProcessId?: string, sellerId?: string, status?: string }` | `Promise<Asset[]>` |
| `getAsset` | `id: string` | `Promise<Asset \| null>` |
| `createAsset` | `data: AssetFormData` | `Promise<{ success: boolean; message: string; assetId?: string; }>` |
| `updateAsset` | `id: string, data: Partial<AssetFormData>` | `Promise<{ success: boolean; message: string; }>` |
| `deleteAsset` | `id: string` | `Promise<{ success: boolean; message: string; }>` |
| `getAssetsByIdsAction` | `ids: string[]` | `Promise<Asset[]>` |
| `getAssetsForLotting` | `filter?: { judicialProcessId?: string, sellerId?: string }` | `Promise<Asset[]>` |

#### Actions de Usuários (`src/app/admin/users/actions.ts`)

| Action | Parâmetros | Retorno |
|--------|------------|---------|
| `getUsersWithRoles` | - | `Promise<UserProfileWithPermissions[]>` |
| `getUserProfileData` | `userId: string` | `Promise<UserProfileWithPermissions \| null>` |
| `getAdminUserForDev` | - | `Promise<UserProfileWithPermissions \| null>` (apenas dev) |
| `createUser` | `data: UserCreationData` | `Promise<{ success: boolean; message: string; userId?: string; }>` |
| `updateUserProfile` | `userId: string, data: EditableUserProfileData` | `Promise<{success: boolean; message: string}>` |
| `updateUserRoles` | `userId: string, roleIds: string[]` | `Promise<{success: boolean; message: string}>` |
| `deleteUser` | `id: string` | `Promise<{ success: boolean; message: string; }>` |

#### AuctionService (`src/services/auction.service.ts`)

| Método | Parâmetros | Retorno | Descrição |
|--------|------------|---------|-----------|
| `validateAuctionIntegrity` | `auctionId: string` | `Promise<AuctionIntegrityValidation>` | Valida se leilão pode ser aberto (lotes com ativos, preços válidos) |
| `updateAuctionStatus` | `tenantId: string, auctionId: string, newStatus: AuctionStatus` | `Promise<{ success: boolean; message: string; validation?: AuctionIntegrityValidation }>` | Atualiza status com validação de integridade |
| `mapAuctionsWithDetails` | `auctions: any[]` | `Auction[]` | Mapeia dados brutos do Prisma para tipo Auction |
| `getAuctions` | `tenantId: string, limit?: number, isPublicCall = true` | `Promise<Auction[]>` | Busca todos leilões do tenant |
| `getAuctionById` | `tenantId: string \| undefined, id: string, isPublicCall = false` | `Promise<Auction \| null>` | Busca leilão por ID ou publicId |
| `getAuctionsByIds` | `tenantId: string, ids: string[]` | `Promise<Auction[]>` | Busca múltiplos leilões por IDs |
| `getAuctionsByAuctioneerSlug` | `tenantId: string, auctioneerSlug: string` | `Promise<Auction[]>` | Busca leilões por leiloeiro |
| `getAuctionsBySellerSlug` | `tenantId: string, sellerSlugOrPublicId: string` | `Promise<Auction[]>` | Busca leilões por comitente |
| `createAuction` | `tenantId: string, data: Partial<AuctionFormData>` | `Promise<{ success: boolean; message: string; auctionId?: string; }>` | Cria leilão com estágios (praças) |
| `updateAuction` | `tenantId: string, id: string, data: Partial<AuctionFormData>` | `Promise<{ success: boolean; message: string; }>` | Atualiza leilão e estágios |
| `deleteAuction` | `tenantId: string, id: string` | `Promise<{ success: boolean; message: string; }>` | Exclui leilão (apenas se não tiver lotes) |
| `deleteAllAuctions` | `tenantId: string` | `Promise<{ success: boolean; message: string; }>` | Exclui todos leilões do tenant |

#### LotService (`src/services/lot.service.ts`) - 33 Métodos

| Método | Parâmetros | Retorno |
|--------|------------|---------|
| `validateLotIntegrity` | `lotId: string` | `Promise<LotIntegrityValidation>` |
| `canModifyLot` | `lotId: string` | `Promise<{ allowed: boolean; reason?: string }>` |
| `updateLotStatus` | `lotId: string, newStatus: LotStatus` | `Promise<{ success: boolean; message: string }>` |
| `linkAssetsToLot` | `lotId: string, assetIds: string[], tenantId: string` | `Promise<{ success: boolean; message: string }>` |
| `unlinkAssetsFromLot` | `lotId: string, assetIds: string[]` | `Promise<{ success: boolean; message: string }>` |
| `resolveLotInternalId` | `idOrPublicId: string` | `Promise<bigint>` |
| `mapLotWithDetails` | `lot: any` | `Lot` |
| `findLotById` | `id: string, tenantId?: string` | `Promise<Lot \| null>` |
| `getLots` | `filter?, tenantId?, limit?, isPublicCall` | `Promise<Lot[]>` |
| `getLotById` | `id: string, tenantId?, isPublicCall` | `Promise<Lot \| null>` |
| `getLotDocuments` | `lotId: string` | `Promise<any[]>` |
| `getUserMaxBid` | `lotId: string, userId: string` | `Promise<UserLotMaxBid \| null>` |
| `getBidHistory` | `lotId: string` | `Promise<BidInfo[]>` |
| `placeBid` | `lotIdOrPublicId: string, userId: string, amount: number, bidderDisplay?: string` | `Promise<{ success: boolean; message: string; currentBid?: number }>` |
| `createLot` | `data: Partial<LotFormData>, tenantId: string` | `Promise<{ success: boolean; message: string; lotId?: string }>` |
| `getLotsByIds` | `ids: string[]` | `Promise<Lot[]>` |
| `updateLot` | `id: string, data: Partial<LotFormData>` | `Promise<{ success: boolean; message: string }>` |
| `deleteLot` | `id: string` | `Promise<{ success: boolean; message: string }>` |
| `finalizeLot` | `lotId: string, winnerId?: string, winningBidId?: string` | `Promise<{ success: boolean; message: string }>` |
| `placeMaxBid` | `lotId: string, userId: string, maxAmount: number` | `Promise<{ success: boolean; message: string }>` |
| `getLotDetailsForV2` | `lotIdOrPublicId: string` | `Promise<{ lot: Lot; auction: any; seller: SellerProfileInfo \| null; ... }>` |

---

### JORNADA 2: AUCTIONEER (Leiloeiro)

#### Páginas e Rotas Acessíveis

| Rota | Descrição | Restrição |
|------|-----------|-----------|
| `/admin/auctions` | Lista apenas leilões atribuídos | Filtrado por `auctioneerId` |
| `/admin/auctions/[auctionId]` | Edição de leilões atribuídos | Apenas seus leilões |
| `/admin/lots` | Lista de lotes dos seus leilões | Filtrado por leilão |
| `/admin/lots/[lotId]` | Edição de lotes | Apenas lotes dos seus leilões |

#### Actions Utilizadas

Utiliza as mesmas actions do ADMIN, mas com filtro implícito por `auctioneerId`:
- `getAuctions` (com filtro por leiloeiro)
- `getLots` (com filtro por leilão atribuído)
- `finalizeLot` - Pode declarar vencedor
- `updateLot` - Pode editar lotes

#### Modelo Auctioneer (`prisma/schema.prisma`)

```prisma
model Auctioneer {
  id                 BigInt    @id @default(autoincrement())
  publicId           String    @unique
  name               String
  slug               String    @unique
  description        String?   @db.Text
  registrationNumber String?
  logoUrl            String?   @db.Text
  logoMediaId        BigInt?
  dataAiHintLogo     String?
  website            String?   @db.Text
  email              String?
  phone              String?
  contactName        String?
  address            String?
  city               String?
  state              String?
  zipCode            String?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  tenantId           BigInt
  userId             BigInt?   @unique
  auctions           Auction[]
  tenant             Tenant    @relation(...)
  user               User?     @relation(...)
  lots               Lot[]
}
```

---

### JORNADA 3: SELLER (Comitente)

#### Páginas e Rotas Acessíveis

| Rota | Página | Descrição |
|------|--------|-----------|
| `/consignor-dashboard` | `page.tsx` | Dashboard principal do comitente |
| `/consignor-dashboard/overview` | `overview/page.tsx` | Visão geral |
| `/consignor-dashboard/auctions` | `auctions/page.tsx` | Seus leilões |
| `/consignor-dashboard/lots` | `lots/page.tsx` | Seus lotes |
| `/consignor-dashboard/direct-sales` | `direct-sales/page.tsx` | Vendas diretas |
| `/consignor-dashboard/financial` | `financial/page.tsx` | Financeiro |
| `/consignor-dashboard/reports` | `reports/page.tsx` | Relatórios |
| `/consignor-dashboard/settings` | `settings/page.tsx` | Configurações |

#### SellerService (`src/services/seller.service.ts`) - 19 Métodos

| Método | Parâmetros | Retorno |
|--------|------------|---------|
| `mapAuctionsWithDetails` | `auctions: any[]` | `Auction[]` |
| `getSellers` | `tenantId: string, limit?: number` | `Promise<SellerProfileInfo[]>` |
| `getSellerById` | `tenantId: string, id: string` | `Promise<SellerProfileInfo \| null>` |
| `findByName` | `tenantId: string, name: string` | `Promise<SellerProfileInfo \| null>` |
| `getSellerBySlug` | `tenantId: string, slugOrId: string` | `Promise<SellerProfileInfo \| null>` |
| `getLotsBySellerSlug` | `tenantId: string, sellerSlugOrId: string` | `Promise<Lot[]>` |
| `getAuctionsBySellerSlug` | `tenantId: string, sellerSlugOrPublicId: string` | `Promise<Auction[]>` |
| `findJudicialSeller` | - | `Promise<SellerProfileInfo \| null>` |
| `createSeller` | `tenantId: string, data: SellerFormData` | `Promise<{ success: boolean; message: string; sellerId?: string; }>` |
| `deleteMany` | `where: Prisma.SellerWhereInput` | `Promise<Prisma.BatchPayload>` |
| `updateSeller` | `tenantId: string, id: string, data: Partial<SellerFormData>` | `Promise<{ success: boolean; message: string }>` |
| `deleteSeller` | `tenantId: string, id: string` | `Promise<{ success: boolean; message: string; }>` |
| `deleteAllSellers` | `tenantId: string` | `Promise<{ success: boolean; message: string; }>` |
| `getSellerDashboardData` | `tenantId: string, sellerId: string` | `Promise<SellerDashboardData \| null>` |

#### Modelo Seller (`prisma/schema.prisma`)

```prisma
model Seller {
  id                BigInt            @id @default(autoincrement())
  publicId          String            @unique
  name              String            @unique
  description       String?           @db.Text
  logoUrl           String?           @db.Text
  logoMediaId       BigInt?
  dataAiHintLogo    String?
  website           String?           @db.Text
  email             String?           @db.Text
  phone             String?           @db.Text
  contactName       String?
  address           String?           @db.Text
  city              String?
  state             String?
  zipCode           String?
  slug              String            @unique
  isJudicial        Boolean           @default(false)
  judicialBranchId  BigInt?           @unique
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  tenantId          BigInt
  userId            BigInt?           @unique
  assets            Asset[]
  auctions          Auction[]
  directSaleOffers  DirectSaleOffer[]
  judicialProcesses JudicialProcess[]
  lots              Lot[]
  judicialBranch    JudicialBranch?   @relation(...)
  tenant            Tenant            @relation(...)
  user              User?             @relation(...)
}
```

---

### JORNADA 4: BIDDER (Arrematante)

#### Páginas e Rotas Acessíveis

| Rota | Página | Descrição |
|------|--------|-----------|
| `/dashboard` | `page.tsx` | Dashboard principal do arrematante |
| `/dashboard/overview` | `overview/page.tsx` | Visão geral |
| `/dashboard/bids` | `bids/page.tsx` | Meus lances |
| `/dashboard/wins` | `wins/page.tsx` | Arremates |
| `/dashboard/favorites` | `favorites/page.tsx` | Favoritos |
| `/dashboard/documents` | `documents/page.tsx` | Documentos |
| `/dashboard/notifications` | `notifications/page.tsx` | Notificações |
| `/dashboard/history` | `history/page.tsx` | Histórico |
| `/dashboard/reports` | `reports/page.tsx` | Relatórios |

#### BidderService (`src/services/bidder.service.ts`) - 20 Métodos

| Método | Parâmetros | Retorno |
|--------|------------|---------|
| `getOrCreateBidderProfile` | `userId: bigint` | `Promise<BidderProfile>` |
| `updateBidderProfile` | `userId: bigint, data: UpdateBidderProfileRequest` | `Promise<ApiResponse<BidderProfile>>` |
| `getBidderDashboardOverview` | `userId: bigint` | `Promise<BidderDashboardOverview>` |
| `getBidderWonLots` | `userId: bigint, options: { page?, limit?, filters?, sort? }` | `Promise<{ data: WonLot[]; total: number; ... }>` |
| `getBidderPaymentMethods` | `userId: bigint` | `Promise<PaymentMethod[]>` |
| `getBidderNotifications` | `userId: bigint, options: { page?, limit?, filters?, sort? }` | `Promise<{ data: BidderNotification[]; total: number; ... }>` |
| `getParticipationHistory` | `userId: bigint, options: { page?, limit?, filters?, sort? }` | `Promise<{ data: ParticipationHistory[]; total: number; ... }>` |
| `mapBidderProfile` | `profile: any` | `BidderProfile` |
| `mapWonLot` | `wonLot: any` | `WonLot` |
| `mapBidderNotification` | `notification: any` | `BidderNotification` |
| `updatePaymentMethod` | `methodId: string, data: any` | `Promise<ApiResponse<PaymentMethod>>` |
| `deletePaymentMethod` | `methodId: string` | `Promise<ApiResponse<null>>` |
| `getUserAuctionHabilitations` | `userId: bigint` | `Promise<any[]>` |
| `getUserActiveMaxBids` | `userId: bigint` | `Promise<any[]>` |
| `mapPaymentMethod` | `method: any` | `PaymentMethod` |
| `mapParticipationHistory` | `history: any` | `ParticipationHistory` |

#### Modelos Relacionados ao Bidder

**BidderProfile:**
```prisma
model BidderProfile {
  id                   BigInt                 @id @default(autoincrement())
  userId               BigInt                 @unique
  fullName             String?
  cpf                  String?                @unique
  phone                String?
  dateOfBirth          DateTime?
  address              String?
  city                 String?
  state                String?
  zipCode              String?
  documentStatus       BidderDocumentStatus   @default(PENDING)
  submittedDocuments   Json?
  emailNotifications   Boolean                @default(true)
  smsNotifications     Boolean                @default(false)
  isActive             Boolean                @default(true)
  createdAt            DateTime               @default(now())
  updatedAt            DateTime               @updatedAt
  tenantId             BigInt?
  notifications        BidderNotification[]
  tenant               Tenant?                @relation(...)
  user                 User                   @relation(...)
  participationHistory ParticipationHistory[]
  paymentMethods       PaymentMethod[]
  wonLots              WonLot[]
}
```

**Bid:**
```prisma
model Bid {
  id            BigInt   @id @default(autoincrement())
  lotId         BigInt
  auctionId     BigInt
  bidderId      BigInt
  amount        Decimal  @db.Decimal(15, 2)
  timestamp     DateTime @default(now())
  bidderDisplay String?
  tenantId      BigInt
  auction       Auction  @relation(...)
  bidder        User     @relation(...)
  lot           Lot      @relation(...)
  tenant        Tenant   @relation(...)
}
```

**UserLotMaxBid (Lance Automático/Proxy):**
```prisma
model UserLotMaxBid {
  id        BigInt    @id @default(autoincrement())
  userId    BigInt
  lotId     BigInt
  maxAmount Decimal   @db.Decimal(15, 2)
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  tenantId  BigInt
  updatedAt DateTime? @updatedAt
  lot       Lot       @relation(...)
  tenant    Tenant    @relation(...)
  user      User      @relation(...)
}
```

**WonLot:**
```prisma
model WonLot {
  id             BigInt         @id @default(autoincrement())
  bidderId       BigInt
  lotId          BigInt
  auctionId      BigInt
  title          String
  finalBid       Decimal        @db.Decimal(10, 2)
  wonAt          DateTime       @default(now())
  status         WonLotStatus   @default(WON)
  paymentStatus  PaymentStatus  @default(PENDENTE)
  totalAmount    Decimal        @db.Decimal(10, 2)
  paidAmount     Decimal        @default(0.00) @db.Decimal(10, 2)
  dueDate        DateTime?
  deliveryStatus DeliveryStatus @default(PENDING)
  trackingCode   String?
  invoiceUrl     String?
  receiptUrl     String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  tenantId       BigInt
  bidder         BidderProfile  @relation(...)
  tenant         Tenant         @relation(...)
}
```

**AuctionHabilitation:**
```prisma
model AuctionHabilitation {
  userId        BigInt
  auctionId     BigInt
  habilitatedAt DateTime @default(now())
  tenantId      BigInt
  auction       Auction  @relation(...)
  tenant        Tenant   @relation(...)
  user          User     @relation(...)
  @@id([userId, auctionId])
}
```

---

### JORNADA 5: LAWYER (Advogado)

#### Páginas e Rotas Acessíveis

| Rota | Página | Descrição |
|------|--------|-----------|
| `/lawyer/dashboard` | `page.tsx` | Painel jurídico principal |

#### Seções do Dashboard

| Seção | testId | Descrição |
|-------|--------|-----------|
| Métricas | `lawyer-metric-*` | Casos ativos, audiências, documentos, valor da carteira |
| Lista de Casos | `lawyer-cases-card` | Processos na carteira jurídica |
| Audiências | `lawyer-hearings-card` | Agenda de audiências próximas |
| Documentos | `lawyer-documents-card` | Documentos operacionais |
| Monetização | `lawyer-monetization-card` | Tarefas prioritárias |

#### LawyerDashboardService (`src/services/lawyer-dashboard.service.ts`)

| Método | Parâmetros | Retorno |
|--------|------------|---------|
| `toNumber` | `value: any` | `number` |
| `humanizeMonetization` | `model: LawyerMonetizationInfo['model']` | `LawyerMonetizationInfo` |
| `deriveCaseStatus` | `nextEventDate: Date \| null, auctionStatuses: string[], lotsCount: number` | `LawyerCaseStatus` |
| `buildTasksFromCases` | `cases: LawyerCaseSummary[]` | `LawyerTaskSummary[]` |
| `getOverview` | `userId: string` | `Promise<LawyerDashboardOverview>` |
| `parseUserId` | `rawId: string` | `bigint \| number` |

#### Modelo JudicialProcess (`prisma/schema.prisma`)

```prisma
model JudicialProcess {
  id                         BigInt            @id @default(autoincrement())
  publicId                   String            @unique
  processNumber              String
  isElectronic               Boolean           @default(true)
  createdAt                  DateTime?         @default(now())
  updatedAt                  DateTime?         @updatedAt
  tenantId                   BigInt
  courtId                    BigInt?
  districtId                 BigInt?
  branchId                   BigInt?
  sellerId                   BigInt?
  propertyMatricula          String?           @db.VarChar(50)
  propertyRegistrationNumber String?
  actionType                 JudicialActionType?
  actionDescription          String?
  actionCnjCode              String?           @db.VarChar(20)
  assets                     Asset[]
  auctions                   Auction[]
  parties                    JudicialParty[]
  branch                     JudicialBranch?   @relation(...)
  court                      Court?            @relation(...)
  district                   JudicialDistrict? @relation(...)
  seller                     Seller?           @relation(...)
  tenant                     Tenant            @relation(...)
  mediaItems                 MediaItem[]
  lots                       Lot[]             @relation("JudicialProcessToLot")
}
```

---

### JORNADA 6: USER/GUEST (Público)

#### Páginas e Rotas Acessíveis (Sem Autenticação)

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | `page.tsx` | Homepage com leilões em destaque |
| `/search` | `search/page.tsx` | Busca com abas (Leilões, Lotes, Vendas Diretas) |
| `/auctions` | `auctions/page.tsx` | Lista pública de leilões |
| `/auctions/[slug]` | `auctions/[slug]/page.tsx` | Detalhes do leilão |
| `/lots/[publicId]` | `lots/[publicId]/page.tsx` | Detalhes do lote (página V2) |
| `/direct-sales` | `direct-sales/page.tsx` | Lista de vendas diretas |
| `/category/[slug]` | `category/[slug]/page.tsx` | Lotes por categoria |
| `/sellers/[slug]` | `sellers/[slug]/page.tsx` | Página do comitente |
| `/auctioneers/[slug]` | `auctioneers/[slug]/page.tsx` | Página do leiloeiro |
| `/map-search` | `map-search/page.tsx` | Busca geolocalizada |
| `/faq` | `faq/page.tsx` | Perguntas frequentes |
| `/about` | `about/page.tsx` | Sobre a plataforma |
| `/contact` | `contact/page.tsx` | Contato |
| `/terms` | `terms/page.tsx` | Termos de uso |
| `/privacy` | `privacy/page.tsx` | Política de privacidade |
| `/auth/login` | `auth/login/page.tsx` | Login |
| `/auth/register` | `auth/register/page.tsx` | Registro |
| `/auth/forgot-password` | `auth/forgot-password/page.tsx` | Recuperar senha |

#### Regras de Visibilidade Pública

O `isPublicCall` nos services filtra automaticamente:
- **Leilões:** Exclui status `RASCUNHO`, `EM_PREPARACAO`
- **Lotes:** Exclui status `RASCUNHO`, `CANCELADO`, `RETIRADO`

---

## 🗄️ MODELOS DE BANCO DE DADOS PRINCIPAIS

### User (Usuário)

```prisma
model User {
  id                  BigInt                 @id @default(autoincrement())
  email               String                 @unique
  password            String?                @db.Text
  fullName            String?                @db.Text
  cpf                 String?                @db.Text
  rgNumber            String?                @db.Text
  rgIssuer            String?                @db.Text
  rgIssueDate         DateTime?
  dateOfBirth         DateTime?
  cellPhone           String?                @db.Text
  homePhone           String?                @db.Text
  gender              String?                @db.Text
  profession          String?                @db.Text
  nationality         String?                @db.Text
  maritalStatus       String?                @db.Text
  propertyRegime      String?                @db.Text
  spouseName          String?                @db.Text
  spouseCpf           String?                @db.Text
  zipCode             String?                @db.Text
  street              String?                @db.Text
  number              String?                @db.Text
  complement          String?                @db.Text
  neighborhood        String?                @db.Text
  city                String?                @db.Text
  state               String?                @db.Text
  avatarUrl           String?                @db.Text
  dataAiHint          String?                @db.Text
  habilitationStatus  UserHabilitationStatus @default(PENDING_DOCUMENTS)
  accountType         AccountType            @default(PHYSICAL)
  badges              Json?
  razaoSocial         String?                @db.Text
  cnpj                String?                @db.Text
  inscricaoEstadual   String?                @db.Text
  website             String?                @db.Text
  responsibleName     String?                @db.Text
  responsibleCpf      String?                @db.Text
  optInMarketing      Boolean?               @default(false)
  createdAt           DateTime               @default(now())
  updatedAt           DateTime               @updatedAt
  -- Relações --
  habilitations       AuctionHabilitation[]
  auctioneers         Auctioneer?
  bids                Bid[]
  lotsWon             Lot[]                  @relation("LotsWon")
  questions           LotQuestion[]
  createdMedia        MediaItem[]            @relation("UploadedBy")
  notifications       Notification[]
  createdReports      Report[]               @relation("CreatedBy")
  reviews             Review[]
  sellers             Seller?
  documents           UserDocument[]
  maxBids             UserLotMaxBid[]
  wins                UserWin[]
  roles               UsersOnRoles[]
  tenants             UsersOnTenants[]
  auditLogs           AuditLog[]
  bidderProfile       BidderProfile?
}
```

### Role (Perfil)

```prisma
model Role {
  id             BigInt         @id @default(autoincrement())
  name           String         @unique
  nameNormalized String         @unique
  description    String?
  permissions    Json?          -- Array de strings com permissões
  users          UsersOnRoles[]
}
```

### Lot (Lote)

```prisma
model Lot {
  id                       BigInt               @id @default(autoincrement())
  publicId                 String?              @unique
  auctionId                BigInt
  number                   String?
  title                    String
  description              String?              @db.Text
  slug                     String?
  price                    Decimal              @db.Decimal(15, 2)
  initialPrice             Decimal?             @db.Decimal(15, 2)
  secondInitialPrice       Decimal?             @db.Decimal(15, 2)
  bidIncrementStep         Decimal?             @db.Decimal(10, 2)
  status                   LotStatus            @default(EM_BREVE)
  bidsCount                Int?                 @default(0)
  views                    Int?                 @default(0)
  isFeatured               Boolean?             @default(false)
  isExclusive              Boolean?             @default(false)
  discountPercentage       Int?
  additionalTriggers       Json?
  imageUrl                 String?              @db.Text
  imageMediaId             BigInt?
  galleryImageUrls         Json?
  mediaItemIds             Json?
  stageDetails             Json?
  type                     String
  condition                String?
  dataAiHint               String?
  winnerId                 BigInt?
  winningBidTermUrl        String?
  allowInstallmentBids     Boolean?             @default(false)
  isRelisted               Boolean              @default(false)
  relistCount              Int                  @default(0)
  original_lot_id          BigInt?              @unique
  createdAt                DateTime             @default(now())
  updatedAt                DateTime             @updatedAt
  endDate                  DateTime?
  lotSpecificAuctionDate   DateTime?
  secondAuctionDate        DateTime?
  categoryId               BigInt?
  subcategoryId            BigInt?
  sellerId                 BigInt?
  auctioneerId             BigInt?
  cityId                   BigInt?
  stateId                  BigInt?
  cityName                 String?
  stateUf                  String?
  latitude                 Decimal?
  longitude                Decimal?
  mapAddress               String?
  tenantId                 BigInt
  depositGuaranteeAmount   Decimal?             @db.Decimal(15, 2)
  depositGuaranteeInfo     String?              @db.Text
  requiresDepositGuarantee Boolean?             @default(false)
  -- Relações --
  assets                   AssetsOnLots[]
  bids                     Bid[]
  auction                  Auction              @relation(...)
  auctioneer               Auctioneer?          @relation(...)
  category                 LotCategory?         @relation(...)
  city                     City?                @relation(...)
  originalLot              Lot?                 @relation("RelistedLot", ...)
  relistedLot              Lot?                 @relation("RelistedLot")
  seller                   Seller?              @relation(...)
  state                    State?               @relation(...)
  subcategory              Subcategory?         @relation(...)
  tenant                   Tenant               @relation(...)
  winner                   User?                @relation("LotsWon", ...)
  documents                LotDocument[]
  questions                LotQuestion[]
  lotPrices                LotStagePrice[]
  Notification             Notification[]
  reviews                  Review[]
  maxBids                  UserLotMaxBid[]
  wins                     UserWin?
  payments                 InstallmentPayment[] @relation("InstallmentPaymentToLot")
  judicialProcesses        JudicialProcess[]    @relation("JudicialProcessToLot")
  lotRisks                 LotRisk[]
}
```

### Auction (Leilão)

```prisma
model Auction {
  id                       BigInt                @id @default(autoincrement())
  publicId                 String?               @unique
  slug                     String?               @unique
  title                    String
  description              String?               @db.Text
  status                   AuctionStatus         @default(RASCUNHO)
  auctionDate              DateTime?
  endDate                  DateTime?
  totalLots                Int                   @default(0)
  visits                   Int                   @default(0)
  totalHabilitatedUsers    Int                   @default(0)
  initialOffer             Decimal?              @db.Decimal(15, 2)
  auctionType              AuctionType?
  auctionMethod            AuctionMethod?        @default(STANDARD)
  participation            AuctionParticipation? @default(ONLINE)
  onlineUrl                String?               @db.VarChar(500)
  address                  String?
  zipCode                  String?               @db.VarChar(10)
  latitude                 Decimal?              @db.Decimal(10, 8)
  longitude                Decimal?              @db.Decimal(11, 8)
  documentsUrl             String?               @db.VarChar(500)
  isFeaturedOnMarketplace  Boolean               @default(false)
  softCloseEnabled         Boolean?              @default(false)
  softCloseMinutes         Int?
  achievedRevenue          Decimal?              @db.Decimal(15, 2)
  evaluationReportUrl      String?               @db.VarChar(500)
  auctionCertificateUrl    String?               @db.VarChar(500)
  floorPrice               Decimal?              @db.Decimal(15, 2)
  decrementAmount          Decimal?              @db.Decimal(10, 2)
  decrementIntervalSeconds Int?
  sellingBranch            String?
  additionalTriggers       Json?
  createdAt                DateTime              @default(now())
  updatedAt                DateTime              @updatedAt
  tenantId                 BigInt
  auctioneerId             BigInt?
  sellerId                 BigInt?
  imageMediaId             BigInt?
  isRelisted               Boolean               @default(false)
  relistCount              Int                   @default(0)
  originalAuctionId        BigInt?               @unique
  cityId                   BigInt?
  stateId                  BigInt?
  judicialProcessId        BigInt?
  categoryId               BigInt?
  complement               String?               @db.VarChar(100)
  neighborhood             String?               @db.VarChar(100)
  number                   String?               @db.VarChar(20)
  street                   String?               @db.VarChar(255)
  -- Relações --
  auctioneer               Auctioneer?           @relation(...)
  category                 LotCategory?          @relation(...)
  cityRef                  City?                 @relation("CityAuctions", ...)
  judicialProcess          JudicialProcess?      @relation(...)
  originalAuction          Auction?              @relation("RelistedAuction", ...)
  relistedAuction          Auction?              @relation("RelistedAuction")
  seller                   Seller?               @relation(...)
  stateRef                 State?                @relation("StateAuctions", ...)
  tenant                   Tenant                @relation(...)
  habilitations            AuctionHabilitation[]
  stages                   AuctionStage[]
  bids                     Bid[]
  lots                     Lot[]
  LotQuestion              LotQuestion[]
  lotPrices                LotStagePrice[]
  notifications            Notification[]
  Review                   Review[]
  courts                   Court[]               @relation("AuctionToCourt")
  judicialBranches         JudicialBranch[]      @relation("AuctionToJudicialBranch")
  judicialDistricts        JudicialDistrict[]    @relation("AuctionToJudicialDistrict")
}
```

### Asset (Ativo)

```prisma
model Asset {
  id                         BigInt           @id @default(autoincrement())
  publicId                   String           @unique
  title                      String
  description                String?          @db.Text
  status                     AssetStatus      @default(DISPONIVEL)
  categoryId                 BigInt?
  subcategoryId              BigInt?
  judicialProcessId          BigInt?
  sellerId                   BigInt?
  evaluationValue            Decimal?         @db.Decimal(15, 2)
  imageUrl                   String?
  imageMediaId               BigInt?
  galleryImageUrls           Json?
  mediaItemIds               Json?
  dataAiHint                 String?
  locationCity               String?
  locationState              String?
  address                    String?
  latitude                   Decimal?
  longitude                  Decimal?
  createdAt                  DateTime         @default(now())
  updatedAt                  DateTime         @updatedAt
  tenantId                   BigInt
  -- Campos de Veículo --
  plate                      String?
  make                       String?
  model                      String?
  version                    String?
  year                       Int?
  modelYear                  Int?
  mileage                    Int?
  color                      String?
  fuelType                   String?
  transmissionType           String?
  bodyType                   String?
  vin                        String?          @unique
  renavam                    String?          @unique
  enginePower                String?
  numberOfDoors              Int?
  vehicleOptions             String?          @db.Text
  detranStatus               String?          @db.Text
  debts                      String?          @db.Text
  runningCondition           String?
  bodyCondition              String?
  tiresCondition             String?
  hasKey                     Boolean?
  -- Campos de Imóvel --
  propertyRegistrationNumber String?
  iptuNumber                 String?
  isOccupied                 Boolean?
  occupationStatus           OccupationStatus?
  occupationNotes            String?          @db.Text
  occupationLastVerified     DateTime?
  occupationUpdatedBy        BigInt?
  totalArea                  Decimal?
  builtArea                  Decimal?
  bedrooms                   Int?
  suites                     Int?
  bathrooms                  Int?
  parkingSpaces              Int?
  constructionType           String?
  finishes                   String?          @db.Text
  infrastructure             String?          @db.Text
  condoDetails               String?          @db.Text
  improvements               String?          @db.Text
  topography                 String?
  liensAndEncumbrances       String?          @db.Text
  propertyDebts              String?          @db.Text
  unregisteredRecords        String?          @db.Text
  hasHabiteSe                Boolean?
  zoningRestrictions         String?
  amenities                  Json?
  -- Campos Gerais --
  brand                      String?
  serialNumber               String?
  itemCondition              String?
  specifications             String?          @db.Text
  includedAccessories        String?          @db.Text
  batteryCondition           String?
  hasInvoice                 Boolean?
  hasWarranty                Boolean?
  repairHistory              String?          @db.Text
  -- Eletrodomésticos/Eletrônicos --
  applianceCapacity          String?
  voltage                    String?
  applianceType              String?
  additionalFunctions        String?
  -- Máquinas/Equipamentos --
  hoursUsed                  Int?
  engineType                 String?
  capacityOrPower            String?
  maintenanceHistory         String?          @db.Text
  installationLocation       String?
  compliesWithNR             String?
  operatingLicenses          String?
  -- Semoventes --
  breed                      String?
  age                        String?
  sex                        String?
  weight                     String?
  individualId               String?
  purpose                    String?
  sanitaryCondition          String?          @db.Text
  lineage                    String?
  isPregnant                 Boolean?
  specialSkills              String?
  gtaDocument                String?
  breedRegistryDocument      String?
  -- Móveis --
  furnitureType              String?
  material                   String?
  style                      String?
  dimensions                 String?
  pieceCount                 Int?
  -- Jóias --
  jewelryType                String?
  metal                      String?
  gemstones                  String?
  totalWeight                String?
  jewelrySize                String?
  authenticityCertificate    String?
  -- Obras de Arte --
  workType                   String?
  artist                     String?
  period                     String?
  technique                  String?
  provenance                 String?          @db.Text
  -- Embarcações --
  boatType                   String?
  boatLength                 String?
  hullMaterial               String?
  onboardEquipment           String?          @db.Text
  -- Mercadorias --
  productName                String?
  quantity                   String?
  packagingType              String?
  expirationDate             DateTime?
  storageConditions          String?
  -- Metais Preciosos --
  preciousMetalType          String?
  purity                     String?
  -- Madeira/Florestais --
  forestGoodsType            String?
  volumeOrQuantity           String?
  species                    String?
  dofNumber                  String?
  -- Relações --
  category                   LotCategory?     @relation(...)
  judicialProcess            JudicialProcess? @relation(...)
  seller                     Seller?          @relation(...)
  subcategory                Subcategory?     @relation(...)
  tenant                     Tenant           @relation(...)
  occupationUpdatedByUser    User?            @relation("AssetOccupationUpdater", ...)
  gallery                    AssetMedia[]
  lots                       AssetsOnLots[]
}
```

---

## ✅ CONCLUSÃO

O BidExpert implementa um sistema robusto de controle de acesso baseado em:

1. **Roles (Perfis):** 8 perfis essenciais com responsabilidades bem definidas
2. **Permissions (Permissões):** 68+ permissões granulares organizadas em 19 grupos
3. **Multi-Tenancy:** Isolamento completo por tenant
4. **Dashboards Específicos:** 4 dashboards customizados por tipo de usuário
5. **Área Pública:** Acesso irrestrito a informações de marketing
6. **Área Privada:** Controle fino por permissão

**Próximos Passos Sugeridos:**
- [ ] Implementar auditoria de sessões de impersonação
- [ ] Completar APIs do Bidder Dashboard
- [ ] Adicionar testes E2E para todos os cenários BDD
- [ ] Documentar fluxos de elegibilidade para lances

---

**Documento gerado por:** Antigravity AI  
**Data:** 18/12/2025  
**Versão:** 1.0

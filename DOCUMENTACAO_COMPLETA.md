
# Documentação Completa da Aplicação - BidExpert

**Versão:** 1.0.0
**Data:** 28 de Outubro de 2025

---

## 1. Descrição Completa da Aplicação

### 1.1. O que é o BidExpert?

O BidExpert é uma plataforma de leilões online de nível empresarial, construída com uma arquitetura robusta e escalável (multi-tenant). Ela permite que diferentes leiloeiros (tenants) operem seus próprios ambientes de leilão de forma isolada e segura, enquanto oferece uma experiência de usuário unificada para arrematantes e visitantes no portal principal.

### 1.2. Problema Resolvido

O mercado de leilões, especialmente o judicial, é muitas vezes fragmentado, com sistemas legados e processos manuais. O BidExpert resolve isso centralizando a operação em uma plataforma moderna, que oferece:
-   **Para Leiloeiros:** Ferramentas completas para gerenciar todo o ciclo de vida de um leilão, desde o cadastro de bens até o pós-venda.
-   **Para Vendedores/Comitentes:** Um canal eficiente para liquidar ativos, com visibilidade e acesso a uma base ampla de compradores.
-   **Para Arrematantes:** Um portal único, seguro e confiável para encontrar, avaliar e dar lances em uma vasta gama de itens, com total transparência.

### 1.3. Público-Alvo

-   **Leiloeiros Oficiais e Empresas de Leilão:** Buscando modernizar suas operações.
-   **Comitentes (Vendedores):** Bancos, seguradoras, empresas em recuperação judicial, varas judiciais e pessoas físicas.
-   **Arrematantes:** Investidores e consumidores finais em busca de oportunidades em veículos, imóveis, maquinário, arte, etc.
-   **Administradores da Plataforma:** Equipe interna que gerencia a operação, configurações e suporte.

### 1.4. Objetivos do Sistema

-   **Eficiência Operacional:** Automatizar e simplificar o processo de criação e gerenciamento de leilões.
-   **Escalabilidade:** Suportar múltiplos leiloeiros (tenants) simultaneamente com total isolamento de dados.
-   **Transparência e Segurança:** Garantir a integridade dos lances e a clareza das regras para todos os participantes.
-   **Engajamento:** Oferecer uma experiência de usuário rica e interativa para maximizar a participação e os resultados dos leilões.

---

## 2. Requisitos Funcionais Detalhados

### Módulo de Administração e Multi-Tenant
-   RF-001: O sistema deve suportar múltiplos tenants, com dados isolados por `tenantId`.
-   RF-002: O sistema deve permitir a criação de usuários com diferentes perfis de acesso (Roles).
-   RF-003: Administradores devem poder gerenciar todas as entidades do sistema (Leilões, Lotes, Usuários, etc.).
-   RF-004: Administradores devem poder configurar os parâmetros gerais da plataforma (temas, modos de formulário, etc.).

### Módulo de Gestão de Leilões e Lotes
-   RF-005: Permitir a criação de leilões com diferentes modalidades (Judicial, Extrajudicial, etc.).
-   RF-006: Permitir a definição de múltiplas etapas (praças) para um leilão, com datas e lances iniciais distintos.
-   RF-007: Permitir o cadastro de Ativos (bens) com campos específicos por categoria.
-   RF-008: Permitir a criação de Lotes, agrupando um ou mais Ativos.
-   RF-009: Implementar um fluxo guiado (Wizard) para a criação de leilões, simplificando o processo.

### Módulo de Usuários e Habilitação
-   RF-010: Usuários devem poder se cadastrar como Pessoa Física ou Jurídica.
-   RF-011: Usuários devem poder enviar documentos para análise de habilitação.
-   RF-012: Administradores/Analistas devem poder aprovar ou rejeitar documentos.
-   RF-013: Apenas usuários com status "HABILITADO" podem dar lances.

### Módulo de Lances e Arremate
-   RF-014: Usuários habilitados devem poder dar lances em lotes abertos.
-   RF-015: O sistema deve validar lances (maior que o atual, incremento mínimo, etc.).
-   RF-016: O sistema deve suportar a funcionalidade de "Lance Automático" (lance máximo).
-   RF-017: Ao final do tempo, o lote deve ser marcado como "VENDIDO" para o maior lance ou "NÃO VENDIDO".
-   RF-018: O arrematante deve ser notificado e o item deve aparecer em seu painel "Meus Arremates".

### Módulo Financeiro e Pós-Venda
-   RF-019: O arrematante deve poder realizar o pagamento do lote arrematado.
-   RF-020: O sistema deve suportar pagamento à vista e **parcelado**.
-   RF-021: O sistema deve permitir a geração de documentos, como o "Termo de Arrematação".

### Módulo de Relatórios e Análise
-   RF-022: Administradores devem ter acesso a dashboards com KPIs de performance da plataforma.
-   RF-023: Comitentes devem ter acesso a relatórios de performance de seus próprios leilões e lotes.
-   RF-024: O sistema deve ter um painel de auditoria para identificar inconsistências de dados.

---

## 3. Instruções de Uso

### 3.1. Administrador da Plataforma
1.  **Acesso:** Acesse `seudominio.com/admin`.
2.  **Visão Geral:** O Dashboard inicial apresenta os KPIs globais.
3.  **Gerenciamento:** Utilize o menu lateral para navegar entre as seções (Leilões, Usuários, Comitentes, etc.) para realizar operações de CRUD.
4.  **Criação de Leilão:** Utilize o "Assistente de Leilão" (`/admin/wizard`) para um fluxo guiado e à prova de erros.
5.  **Análise:** Explore as páginas de "Análise" em cada seção para obter insights sobre o desempenho de leiloeiros, comitentes, categorias e mais.

### 3.2. Arrematante (Usuário Final)
1.  **Cadastro e Login:** Crie sua conta em `seudominio.com/auth/register` e faça o login.
2.  **Habilitação:** No seu painel (`/dashboard/documents`), envie os documentos necessários. Aguarde a aprovação para poder dar lances.
3.  **Navegação:** Explore leilões e lotes na página inicial, na busca ou por categorias.
4.  **Dar Lance:** Na página de um lote, insira seu lance no "Painel de Lances". Você também pode definir um lance máximo para que o sistema dê lances por você.
5.  **Pós-Arremate:** Se você ganhar um lote, ele aparecerá em "Meus Arremates" (`/dashboard/wins`), onde você poderá proceder com o pagamento.

### 3.3. Comitente (Vendedor)
1.  **Acesso:** Após o login, se você tiver o perfil de Comitente, terá acesso ao "Painel do Comitente" (`/consignor-dashboard/overview`).
2.  **Gerenciamento:** Você pode cadastrar novos Ativos e solicitar a criação de novos Leilões para seus itens.
3.  **Acompanhamento:** Visualize a performance de seus leilões e lotes na seção de "Relatórios".
4.  **Financeiro:** Acompanhe os valores a receber pelos lotes vendidos na seção "Financeiro".

---

## 4. Cenários BDD (Gherkin) Completos

### Feature: Gerenciamento de Usuários

**Scenario: Administrador cria um novo usuário com sucesso**
```gherkin
Given que o Administrador está logado e na página de "Gerenciar Usuários"
When ele clica no botão "Novo Usuário"
And ele preenche o formulário com nome "João Teste", email "joao@teste.com" e senha "senha123"
And ele atribui o perfil "Arrematante"
And ele clica em "Salvar Usuário"
Then o novo usuário "João Teste" deve ser criado no sistema
And o usuário "João Teste" deve aparecer na lista de usuários
```

### Feature: Habilitação de Usuário

**Scenario: Usuário envia documentos e é aprovado**
```gherkin
Given que o usuário "Maria" está logada e na página "Meus Documentos"
And o status da sua habilitação é "Documentos Pendentes"
When ela envia um arquivo válido para "CPF" e "Comprovante de Residência"
Then o status da sua habilitação deve mudar para "Em Análise"
And uma solicitação para "Maria" deve aparecer no painel de "Habilitações" do administrador

Given que o Administrador está na página de revisão de documentos de "Maria"
When ele aprova todos os documentos pendentes
Then o status de habilitação de "Maria" deve mudar para "HABILITADO"
And "Maria" deve receber o perfil "Arrematante" automaticamente
```

### Feature: Fluxo de Lances

**Scenario: Usuário habilitado dá um lance válido**
```gherkin
Given que o lote "Carro Antigo" está "ABERTO PARA LANCES" com lance atual de "R$ 10.000,00"
And o usuário "Carlos" está habilitado para o leilão deste lote
When "Carlos" acessa a página do lote "Carro Antigo"
And ele insere um lance de "R$ 10.500,00"
And ele clica no botão "Dar Lance"
Then seu lance deve ser aceito
And o lance atual do lote "Carro Antigo" deve ser "R$ 10.500,00"
And o nome "Carlos" deve aparecer como o maior licitante no histórico
```

### Feature: Assistente de Criação de Leilão (Wizard)

**Scenario: Admin cria um leilão judicial completo usando o wizard**
```gherkin
Given que o Administrador está na página do "Assistente de Criação de Leilão"
When ele seleciona a modalidade "Judicial" e avança
And ele seleciona o processo "00123-2024" que já tem ativos cadastrados
And ele avança para a etapa de "Dados do Leilão"
And ele preenche o título "Leilão Judicial da Vara Cível" e seleciona um leiloeiro
And ele avança para a etapa de "Loteamento"
And ele seleciona os ativos "Veículo A" e "Terreno B"
And ele clica em "Agrupar em Lote Único"
And ele define o título do lote como "Lote 001 - Veículo e Terreno" e lance inicial de "R$ 75.000,00"
And ele salva o lote e avança para "Revisão"
When ele revisa todos os dados e clica em "Publicar Leilão"
Then o leilão "Leilão Judicial da Vara Cível" deve ser criado com status "Em Breve"
And um novo lote "Lote 001 - Veículo e Terreno" deve ser criado e associado a este leilão
And os ativos "Veículo A" e "Terreno B" devem ter seu status atualizado para "LOTEADO"
```

### Feature: Pagamento Parcelado

**Scenario: Arrematante escolhe pagar um lote arrematado de forma parcelada**
```gherkin
Given que o usuário "Ana" arrematou o lote "Joia Rara" por "R$ 12.000,00"
And o status do pagamento deste arremate é "PENDENTE"
When "Ana" acessa a página de checkout para o lote "Joia Rara"
And ela seleciona a opção de pagamento "Boleto Parcelado"
And ela escolhe "10" parcelas no seletor
And ela confirma a operação
Then 10 registros de "InstallmentPayment" devem ser criados para este arremate
And o status de pagamento do arremate de "Ana" deve ser atualizado para "PROCESSANDO"
And "Ana" deve ser redirecionada para a página de sucesso ou "Meus Arremates" com uma mensagem de confirmação
```

### Feature: Refatoração de `PlatformSettings`

**Scenario: Admin altera o modo de edição dos formulários CRUD**
```gherkin
Given que o Administrador está logado e na página de "Configurações Gerais" (`/admin/settings/general`)
And o modo de edição atual está configurado como "modal"
When ele seleciona a opção "Painel Lateral (Sheet)"
And ele clica em "Salvar Alterações"
And ele navega para a página de listagem de "Comitentes"
And ele clica no botão "Novo Comitente"
Then um painel lateral (Sheet) deve abrir a partir da direita da tela com o formulário de criação
And a URL da página não deve mudar
```

### Feature: Tour Guiado

**Scenario: Novo administrador acessa o painel de ativos pela primeira vez**
```gherkin
Given que um novo Administrador está logado
When ele navega para a página "Gerenciar Ativos" (`/admin/assets`) pela primeira vez
Then um pop-up do tour guiado deve aparecer com o Passo 1, destacando a tabela de ativos
When ele clica em "Próximo"
Then o pop-up deve se mover para o Passo 2, destacando a barra de busca e filtros
When ele clica em "Próximo"
Then o pop-up deve se mover para o Passo 3, destacando o botão "Novo Ativo"
When ele clica em "Concluir Tour"
Then o pop-up do tour deve desaparecer
And o tour não deve aparecer novamente em visitas futuras a esta página
```

# Cenários de Teste da Plataforma

**Versão:** 1.5
**Data:** 16 de Novembro de 2025

---

## Módulo 0: Administração e Segurança

### Feature: Impersonation de Usuário

**Contexto:** Administradores precisam da capacidade de visualizar a plataforma exatamente como um usuário específico a vê, para solucionar problemas e oferecer suporte.

---

#### Cenário 0.1: Início de Sessão de Impersonation por Administrador (Sucesso)

-   **Dado** que o usuário "Admin" está logado e possui o perfil `SUPER_ADMIN`.
-   **E** ele está na página de detalhes do usuário "Advogado Teste".
-   **Quando** ele clica no botão "Impersonate User".
-   **Então** ele é redirecionado para o dashboard do "Advogado Teste".
-   **E** uma barra de notificação no topo da página exibe a mensagem "Você está vendo a plataforma como Advogado Teste. [Sair da Impersonation]".
-   **E** um evento de log de auditoria é criado com a ação `impersonation_started`, o `admin_id` do "Admin" e o `user_id` do "Advogado Teste".

---

#### Cenário 0.2: Tentativa de Impersonation por Usuário Não-Administrador (Falha)

-   **Dado** que o usuário "Arrematante Comum" está logado e não possui o perfil `SUPER_ADMIN`.
-   **Quando** ele tenta acessar a funcionalidade de impersonation (seja por URL direta ou por um elemento de UI que não deveria estar visível).
-   **Então** ele deve ser redirecionado para uma página de "Acesso Negado" (403 Forbidden).
-   **E** nenhuma sessão de impersonation deve ser iniciada.
-   **E** nenhum log de auditoria de impersonation deve ser criado.

---

#### Cenário 0.3: Ações Realizadas Durante a Impersonation

-   **Dado** que o "Admin" está em uma sessão de impersonation como "Advogado Teste".
-   **Quando** ele navega para a página de processos e adiciona uma nova anotação a um processo.
-   **Então** a anotação deve ser salva com sucesso.
-   **E** o autor da anotação deve ser registrado como "Advogado Teste".
-   **E** o log de auditoria da ação de "adicionar anotação" deve conter um campo `impersonated_by` com o `admin_id` do "Admin".

---

#### Cenário 0.4: Fim da Sessão de Impersonation

-   **Dado** que o "Admin" está em uma sessão de impersonation.
-   **Quando** ele clica no link "Sair da Impersonation" na barra de notificação.
-   **Então** ele é redirecionado de volta para sua própria sessão de administrador (por exemplo, para a página de onde iniciou a impersonation).
-   **E** a barra de notificação de impersonation desaparece.
-   **E** um evento de log de auditoria é criado com a ação `impersonation_ended`.

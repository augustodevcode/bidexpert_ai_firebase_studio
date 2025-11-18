# Regras de Negócio Consolidadas

**Versão:** 2.0
**Data:** 16 de Novembro de 2025
**Status:** ✅ ATIVO

---

## Módulo de Atualizações de Outubro

### Lawyer Dashboard Serialization
- **Descrição:** O painel do advogado agora serializa dados complexos para exibição, garantindo performance e consistência na apresentação de informações de processos e leilões.
- **Impacto:** Melhora a velocidade de carregamento do dashboard e a precisão dos dados exibidos.

### Admin Impersonation Service
- **Descrição:** Um novo serviço permite que administradores acessem a plataforma como se fossem outro usuário (advogado, arrematante, etc.) para fins de suporte e diagnóstico.
- **Segurança:** O serviço é estritamente controlado, com auditoria completa de todas as ações realizadas durante a sessão de impersonation.

### Playwright E2E Suite
- **Descrição:** A suíte de testes End-to-End foi migrada e expandida para o Playwright, cobrindo os principais fluxos da aplicação.
- **Cobertura:** Inclui testes para login, cadastro, criação de leilões, lances e o novo fluxo de impersonation.

---

## Novas Regras de Negócio

### RN-023: Regras de Impersonation Seguro
- **RN-023.1:** Apenas usuários com o perfil `SUPER_ADMIN` podem iniciar uma sessão de impersonation.
- **RN-023.2:** O início e o fim de cada sessão de impersonation devem ser registrados em um log de auditoria detalhado, incluindo o ID do administrador, o ID do usuário impersonado e o timestamp.
- **RN-023.3:** Todas as ações realizadas pelo administrador durante a sessão de impersonation devem ser atribuídas ao usuário impersonado, mas marcadas com um indicador `impersonated_by` no log de auditoria.
- **RN-023.4:** A sessão de impersonation deve expirar automaticamente após 60 minutos de inatividade.
- **RN-023.5:** Uma barra de notificação visualmente distinta deve ser exibida em todas as páginas para o administrador durante uma sessão de impersonation, indicando claramente que ele está atuando como outro usuário.

---

## Backlog de Itens de Acompanhamento

### Itens Concluídos
- ~~Implementação do serviço de impersonation de administrador.~~
- ~~Migração da suíte de testes para Playwright.~~
- ~~Serialização de dados no dashboard do advogado.~~

### Próximos Passos
- **[BACKLOG-001] Audit Trail para Impersonation:** Implementar a infraestrutura de log para registrar o início, o fim e as ações das sessões de impersonation, conforme a regra RN-023.
- **[BACKLOG-002] Otimização de Performance do Dashboard:** Investigar e otimizar as queries do dashboard do advogado para reduzir o tempo de carregamento em contas com grande volume de dados.
- **[BACKLOG-003] Estratégia de Invalidação de Cache:** Definir e implementar uma estratégia de invalidação de cache para os dados do dashboard, garantindo que as informações sejam sempre atualizadas após uma ação relevante (ex: novo lance, mudança de status do processo).

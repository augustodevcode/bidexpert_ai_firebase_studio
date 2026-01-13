---
trigger: always_on
---

Sempre após implementação ou correção, execute testes com a visão de todos os perfis cadastrados (Auction Analyst, Admin, Leiloeiro, Comitente, Advogado, Seller, etc.) cuja funcionalidade é acessível por esses perfis (testes regressivos);
Sempre abra o projeto no preview Simple Browser do Vscode e monitore o log.
Sempre após implementar ou corrigir algo, Open URL in Browser e teste o que foi feito;
Não deixe nenhum erro em Problems do VsCode (ESLint e Typescript e Prisma checks);

# Playwright testing guidelines
- Sempre abra o relatório de testes do Vitest UI no Simple Browser do Vscode para garantir que todos os testes passaram.
- Sempre utilize o Vitest UI com Playwright para implementar testes e2e conforme a estratégia de testes documentada nos arquivos .md de testes visuais ou a partir da implementação recém feita.
- Sempre utilize o Vitest UI com Playwright para implementar testes unitários conforme a estratégia de testes documentada nos arquivos .md de testes visuais ou a partir da implementação recém feita.
- Sempre utilize To open last HTML report run: npx playwright show-report
Nunca saia do padrão de design shadcn e tailsiwind css;
Sempre adicione em todos os elementos o className Data AI com o contexto do que o elemento faz;

# usuarios de testes
ao tentar logar verificar os usuários que estão nos arquivos de seed ou fazer select diretamente na base para saber o usuário, sua senha e seu perfil, pois lá podem estar os usuários que precisa para teste.
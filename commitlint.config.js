/**
 * @fileoverview Configuração do commitlint para enforcar Conventional Commits.
 * Garante que todas as mensagens de commit sigam o padrão:
 *   <tipo>(<escopo>): <descrição>
 * 
 * Tipos permitidos: feat, fix, docs, style, refactor, perf, test, chore, ci, revert, build
 * Exemplo: feat(auction): adiciona filtro por categoria
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Tipos permitidos
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nova funcionalidade
        'fix',      // Correção de bug
        'docs',     // Documentação
        'style',    // Formatação (sem mudança de lógica)
        'refactor', // Refatoração (sem mudança de comportamento)
        'perf',     // Melhoria de performance
        'test',     // Testes
        'chore',    // Manutenção geral
        'ci',       // CI/CD
        'revert',   // Reversão de commit
        'build',    // Build system
      ],
    ],
    // Tipo sempre em lowercase
    'type-case': [2, 'always', 'lower-case'],
    // Tipo não pode ser vazio
    'type-empty': [2, 'never'],
    // Descrição não pode ser vazia
    'subject-empty': [2, 'never'],
    // Descrição max 100 caracteres
    'subject-max-length': [2, 'always', 100],
    // Header max 120 caracteres
    'header-max-length': [2, 'always', 120],
    // Body max 200 caracteres por linha
    'body-max-line-length': [1, 'always', 200],
  },
};

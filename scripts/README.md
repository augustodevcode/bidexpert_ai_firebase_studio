# Diretrizes para Scripts de Seed e Utilitários

## Regras Principais

1. **Uso Obrigatório de Services e Actions**
   - NÃO use comandos Prisma diretamente para inserção de dados (`prisma.model.create`, `prisma.model.createMany`, etc)
   - SEMPRE use os serviços do codebase (`services/*.service.ts`) para manipulação de dados
   - Isso garante validação e consistência dos dados através da lógica de negócios implementada

2. **Estrutura dos Scripts**
   - Importe e instancie os serviços necessários no início do arquivo
   - Use o objeto `services` para agrupar todas as instâncias dos serviços
   - Mantenha uma estrutura clara de funções com responsabilidades bem definidas

3. **Gestão de Transações**
   - Use o `TransactionManager` para operações que precisam de consistência transacional
   - Evite transações aninhadas

4. **Logging e Validação**
   - Use o `seedLogger` para registrar o progresso das operações
   - Implemente validações usando o `SeedValidator` quando necessário

## Exemplo de Estrutura Correta

```typescript
// Imports dos serviços
import { UserService } from '../src/services/user.service';
import { RoleService } from '../src/services/role.service';

// Instanciação dos serviços
const services = {
    user: new UserService(),
    role: new RoleService(),
};

// Função principal
async function main() {
    // Use os serviços ao invés de prisma direto
    const user = await services.user.create({
        // ... dados do usuário
    });
}
```

## O que Evitar

```typescript
// ❌ NÃO FAÇA ISSO:
const user = await prisma.user.create({
    data: { ... }
});

// ✅ FAÇA ISSO:
const user = await services.user.create({
    // ... dados do usuário
});
```

## Motivos para Essas Regras

1. **Consistência de Dados**
   - Os serviços implementam validações e regras de negócio
   - Garante que os dados seguem o mesmo padrão da aplicação

2. **Manutenibilidade**
   - Mudanças nas regras de negócio são refletidas automaticamente
   - Evita duplicação de lógica

3. **Segurança**
   - Os serviços implementam verificações de segurança
   - Previne inserção de dados inconsistentes

4. **Testabilidade**
   - Facilita a criação de testes
   - Permite mock de serviços para testes isolados

## Links Úteis

- [Documentação dos Serviços](../src/services/README.md)
- [Guia de Testes](../tests/README.md)
- [Documentação do Prisma](https://www.prisma.io/docs)
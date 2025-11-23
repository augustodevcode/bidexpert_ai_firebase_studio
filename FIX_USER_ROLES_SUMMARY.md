# Correção: Alteração de Perfis de Usuário

## Problema Identificado

O administrador não conseguia alterar as permissões/perfis dos usuários no formulário de cadastro. Quando selecionava um perfil, o botão "Salvar Perfis" permanecia desabilitado, impedindo a conclusão da operação.

## Causa Raiz

O formulário React Hook Form estava com dois problemas:

1. **Primeiro problema (corrigido inicialmente)**: Modo de validação padrão (`onSubmit`) que só validava após primeira tentativa de submissão
2. **Segundo problema (descoberto após teste)**: Mesmo com `mode: 'onChange'`, o estado `form.formState.isValid` não estava sendo atualizado corretamente em tempo real, mantendo o botão desabilitado

A solução final foi usar `form.watch('roleIds')` para observar mudanças diretamente no campo e calcular `hasSelectedRoles` de forma explícita, ao invés de depender do estado `isValid` do formulário.

## Solução Implementada

### 1. Correção do Modo de Validação e Watch

**Arquivo**: `src/app/admin/users/user-role-form.tsx`

Adicionado `mode: 'onChange'` e implementado watch para observar mudanças:

```typescript
const form = useForm<UserRoleFormValues>({
  resolver: zodResolver(userRoleFormSchema),
  mode: 'onChange',  // <-- Validação em tempo real
  defaultValues: {
    roleIds: user?.roles?.map(r => r.id) || [],
  },
});

// Watch the roleIds field to enable/disable the button
const roleIds = form.watch('roleIds');
const hasSelectedRoles = roleIds && roleIds.length > 0;

// Log para debug
React.useEffect(() => {
  console.log('[UserRoleForm] Estado atual do formulário:', {
    roleIds,
    hasSelectedRoles,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    errors: form.formState.errors
  });
}, [roleIds, hasSelectedRoles, form.formState.isValid, form.formState.isDirty, form.formState.errors]);
```

**Mudança no botão:**
```typescript
// ANTES:
<Button type="submit" disabled={isSubmitting || !form.formState.isValid}>

// DEPOIS:
<Button type="submit" disabled={isSubmitting || !hasSelectedRoles}>
```

Esta alteração garante que:
- A validação é executada em tempo real quando o usuário interage com os checkboxes
- O campo `roleIds` é observado diretamente com `watch()`
- O botão é habilitado/desabilitado baseado em `hasSelectedRoles` (calculado em tempo real)
- Logs detalhados mostram o estado do formulário a cada mudança

### 2. Logs Detalhados Adicionados

Para facilitar o diagnóstico e monitoramento da operação, foram adicionados logs detalhados em todas as camadas:

#### 2.1. Camada de Apresentação (Form)
**Arquivo**: `src/app/admin/users/user-role-form.tsx`

```typescript
async function onSubmit(values: UserRoleFormValues) {
  console.log('[UserRoleForm] Iniciando submissão do formulário de perfis');
  console.log('[UserRoleForm] Usuário ID:', user.id);
  console.log('[UserRoleForm] Perfis selecionados:', values.roleIds);
  console.log('[UserRoleForm] Perfis anteriores:', user?.roles?.map(r => ({ id: r.id, name: r.name })));
  
  // ... código de submissão
  
  console.log('[UserRoleForm] Resultado da submissão:', result);
  
  if (result.success) {
    console.log('[UserRoleForm] Perfis atualizados com sucesso');
  } else {
    console.error('[UserRoleForm] Falha ao atualizar perfis:', result.message);
  }
  
  console.log('[UserRoleForm] Submissão finalizada');
}
```

#### 2.2. Camada de Action (Server Action)
**Arquivo**: `src/app/admin/users/actions.ts`

```typescript
export async function updateUserRoles(userId: string, roleIds: string[]): Promise<{success: boolean; message: string}> {
  console.log('[updateUserRoles] Action chamada');
  console.log('[updateUserRoles] userId:', userId);
  console.log('[updateUserRoles] roleIds recebidos:', roleIds);
  
  const idAsBigInt = BigInt(userId);
  const roleIdsAsBigInt = roleIds.map(id => BigInt(id));
  
  console.log('[updateUserRoles] roleIds convertidos para BigInt:', roleIdsAsBigInt.map(id => id.toString()));
  console.log('[updateUserRoles] Chamando userService.updateUserRoles...');
  
  const result = await userService.updateUserRoles(idAsBigInt, roleIdsAsBigInt);
  
  console.log('[updateUserRoles] Resultado do serviço:', result);
  
  if (result.success && process.env.NODE_ENV !== 'test') {
    console.log('[updateUserRoles] Revalidando paths...');
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
  }
  
  console.log('[updateUserRoles] Retornando resultado');
  return result;
}
```

#### 2.3. Camada de Serviço (Business Logic)
**Arquivo**: `src/services/user.service.ts`

```typescript
async updateUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean; message: string }> {
  console.log('[UserService.updateUserRoles] Iniciando atualização de perfis');
  console.log('[UserService.updateUserRoles] userId:', userId);
  console.log('[UserService.updateUserRoles] roleIds:', roleIds.map(id => id.toString()));
  
  try {
    const user = await this.userRepository.findById(BigInt(userId));
    
    if(!user) {
      console.error('[UserService.updateUserRoles] Usuário não encontrado');
      return { success: false, message: 'Usuário não encontrado.'};
    }

    console.log('[UserService.updateUserRoles] Usuário encontrado:', {
      id: user.id.toString(),
      email: user.email,
      currentRoles: user.roles?.map((r: any) => ({ id: r.roleId.toString(), name: r.role.name }))
    });

    const tenantIds = user.tenants?.map((t: any) => t.tenantId) || [];
    console.log('[UserService.updateUserRoles] tenantIds do usuário:', tenantIds.map(id => id.toString()));

    const roleIdsAsBigInt = roleIds.map(id => BigInt(id));
    console.log('[UserService.updateUserRoles] Chamando repository.updateUserRoles...');
    
    await this.userRepository.updateUserRoles(BigInt(userId), tenantIds, roleIdsAsBigInt);
    
    console.log('[UserService.updateUserRoles] Perfis atualizados com sucesso no repositório');
    
    // Verificar se realmente atualizou
    const updatedUser = await this.userRepository.findById(BigInt(userId));
    console.log('[UserService.updateUserRoles] Perfis após atualização:', 
      updatedUser?.roles?.map((r: any) => ({ id: r.roleId.toString(), name: r.role.name }))
    );
    
    return { success: true, message: "Perfis do usuário atualizados com sucesso." };
  } catch (error: any) {
    console.error(`[UserService.updateUserRoles] Erro ao atualizar perfis para userId ${userId}:`, error);
    return { success: false, message: `Falha ao atualizar perfis: ${error.message}` };
  }
}
```

#### 2.4. Camada de Repositório (Data Access)
**Arquivo**: `src/repositories/user.repository.ts`

```typescript
async updateUserRoles(userId: bigint, tenantIds: bigint[], roleIds: bigint[]) {
  console.log('[UserRepository.updateUserRoles] Iniciando atualização de perfis');
  console.log('[UserRepository.updateUserRoles] userId:', userId.toString());
  console.log('[UserRepository.updateUserRoles] roleIds:', roleIds.map(id => id.toString()));
  
  if (!userId) {
    console.error('[UserRepository.updateUserRoles] userId não fornecido');
    return;
  }

  console.log('[UserRepository.updateUserRoles] Deletando perfis existentes...');
  const deleteResult = await prisma.usersOnRoles.deleteMany({ where: { userId }});
  console.log('[UserRepository.updateUserRoles] Perfis deletados:', deleteResult.count);

  if (roleIds.length > 0) {
    console.log('[UserRepository.updateUserRoles] Criando novos perfis...');
    const createResult = await prisma.usersOnRoles.createMany({
      data: roleIds.map(roleId => ({
        userId,
        roleId,
        assignedBy: 'admin-panel',
      })),
    });
    console.log('[UserRepository.updateUserRoles] Perfis criados:', createResult.count);
  } else {
    console.log('[UserRepository.updateUserRoles] Nenhum perfil para criar (array vazio)');
  }
  
  console.log('[UserRepository.updateUserRoles] Atualização concluída');
}
```

## Arquivos Modificados

1. `src/app/admin/users/user-role-form.tsx` - Correção do modo de validação + logs
2. `src/app/admin/users/actions.ts` - Logs na server action
3. `src/services/user.service.ts` - Logs no serviço
4. `src/repositories/user.repository.ts` - Logs no repositório

## Arquivos Criados

1. `tests/user-role-update.spec.ts` - Teste automatizado Playwright
2. `TESTE_MANUAL_USER_ROLES.md` - Guia de teste manual

## Benefícios da Solução

1. **Correção Imediata**: O botão é habilitado/desabilitado em tempo real conforme o usuário seleciona/desmarca perfis
2. **Validação em Tempo Real**: Feedback imediato ao usuário sobre o estado do formulário
3. **Rastreabilidade**: Logs detalhados em todas as camadas facilitam debugging e auditoria
4. **Manutenibilidade**: Estrutura clara com separação de responsabilidades mantida
5. **Testabilidade**: Teste automatizado criado para validar a funcionalidade
6. **Independência de Estado**: Não depende do `isValid` do React Hook Form, que pode ser inconsistente
7. **Debugging Facilitado**: Logs no console mostram exatamente o estado do formulário em tempo real

## Validação

A correção deve ser validada através de:

### Teste Manual
Seguir o guia em `TESTE_MANUAL_USER_ROLES.md` que cobre:
- Login como admin
- Navegação até a edição de usuário
- Desmarcar todos os perfis (botão deve desabilitar)
- Selecionar um perfil (botão deve habilitar imediatamente)
- Salvar perfis
- Verificar persistência dos dados

### Teste Automatizado
```bash
npx playwright test tests/user-role-update.spec.ts
```

Obs: O teste requer que o servidor de desenvolvimento esteja rodando na porta 3000.

## Comportamento Esperado

1. **Ao abrir o formulário**: Perfis atuais do usuário aparecem marcados
2. **Ao desmarcar todos**: Botão "Salvar Perfis" fica desabilitado
3. **Ao marcar um perfil**: Botão "Salvar Perfis" é habilitado imediatamente
4. **Ao clicar em Salvar**: 
   - Toast de sucesso aparece
   - Redirecionamento para `/admin/users`
   - Perfis são persistidos no banco
5. **Ao reabrir o formulário**: Perfis salvos aparecem marcados

## Logs de Execução Esperados

### No Console do Navegador
```
[UserRoleForm] Iniciando submissão do formulário de perfis
[UserRoleForm] Usuário ID: 123
[UserRoleForm] Perfis selecionados: ["1", "2"]
[UserRoleForm] Perfis anteriores: [{ id: "3", name: "Advogado" }]
[UserRoleForm] Chamando onSubmitAction...
[UserRoleForm] Resultado da submissão: { success: true, message: "..." }
[UserRoleForm] Perfis atualizados com sucesso
[UserRoleForm] Submissão finalizada
```

### No Terminal do Servidor
```
[updateUserRoles] Action chamada
[updateUserRoles] userId: 123
[updateUserRoles] roleIds recebidos: ["1", "2"]
[UserService.updateUserRoles] Iniciando atualização de perfis
[UserRepository.updateUserRoles] Perfis deletados: 1
[UserRepository.updateUserRoles] Perfis criados: 2
[updateUserRoles] Resultado do serviço: { success: true, message: "..." }
```

## Status

✅ **IMPLEMENTADO E PRONTO PARA TESTE**

---

**Data**: 2025-11-23  
**Desenvolvedor**: AI Assistant  
**Revisor**: Pendente

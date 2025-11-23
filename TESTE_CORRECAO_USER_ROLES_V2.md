# Teste da Correção - Formulário de Perfis de Usuário

## Alterações Realizadas

### Problema Identificado
O botão "Salvar Perfis" ficava desabilitado mesmo quando perfis eram selecionados porque o React Hook Form não estava atualizando corretamente o estado `isValid`.

### Solução Aplicada
1. Mantido `mode: 'onChange'` para validação em tempo real
2. Adicionado `form.watch('roleIds')` para observar mudanças nos perfis selecionados
3. Criada variável `hasSelectedRoles` que verifica diretamente se há perfis selecionados
4. Mudado a condição do botão de `!form.formState.isValid` para `!hasSelectedRoles`
5. Adicionado log detalhado que mostra o estado do formulário em tempo real

## Código Modificado

```typescript
const form = useForm<UserRoleFormValues>({
  resolver: zodResolver(userRoleFormSchema),
  mode: 'onChange',
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

Botão alterado:
```typescript
<Button type="submit" disabled={isSubmitting || !hasSelectedRoles}>
  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
  Salvar Perfis
</Button>
```

## Como Testar

### 1. Abrir Console do Navegador
Pressione F12 para abrir o DevTools

### 2. Acessar a Página de Edição de Usuário
1. Login como admin (admin@bidexpert.com.br / admin123)
2. Ir para Admin → Usuários
3. Clicar em "Editar" em qualquer usuário
4. Rolar até a seção "Atribuir Perfis"

### 3. Observar Logs no Console
Você deve ver logs como:
```
[UserRoleForm] Estado atual do formulário: {
  roleIds: ["1", "2"],
  hasSelectedRoles: true,
  isValid: true,
  isDirty: false,
  errors: {}
}
```

### 4. Testar Interações

#### Teste A: Com perfis já selecionados
- **O que fazer**: Abrir formulário com usuário que já tem perfis
- **Resultado esperado**: Botão "Salvar Perfis" HABILITADO
- **Log esperado**: `hasSelectedRoles: true`

#### Teste B: Desmarcar todos os perfis
- **O que fazer**: Clicar e desmarcar todos os checkboxes
- **Resultado esperado**: Botão "Salvar Perfis" DESABILITADO
- **Log esperado**: `hasSelectedRoles: false`, `roleIds: []`

#### Teste C: Selecionar um perfil
- **O que fazer**: Clicar em qualquer checkbox para marcar
- **Resultado esperado**: Botão "Salvar Perfis" HABILITADO IMEDIATAMENTE
- **Log esperado**: `hasSelectedRoles: true`, `roleIds: ["X"]` onde X é o ID do perfil

#### Teste D: Selecionar múltiplos perfis
- **O que fazer**: Clicar em vários checkboxes
- **Resultado esperado**: Botão continua HABILITADO, array de roleIds aumenta
- **Log esperado**: `hasSelectedRoles: true`, `roleIds: ["1", "2", "3"]`

#### Teste E: Salvar as alterações
- **O que fazer**: Com perfis selecionados, clicar em "Salvar Perfis"
- **Resultado esperado**: 
  - Toast de sucesso aparece
  - Redirecionamento para /admin/users
  - Logs de submissão aparecem
- **Logs esperados**:
```
[UserRoleForm] Iniciando submissão do formulário de perfis
[UserRoleForm] Usuário ID: X
[UserRoleForm] Perfis selecionados: [...]
[UserRoleForm] Chamando onSubmitAction...
[updateUserRoles] Action chamada
[UserService.updateUserRoles] Iniciando atualização de perfis
[UserRepository.updateUserRoles] Perfis deletados: X
[UserRepository.updateUserRoles] Perfis criados: Y
[UserRoleForm] Perfis atualizados com sucesso
```

### 5. Verificar Persistência
1. Após salvar, voltar para a lista de usuários
2. Editar novamente o mesmo usuário
3. Verificar que os perfis selecionados estão marcados
4. **Resultado esperado**: Perfis salvos anteriormente aparecem marcados

## Checklist de Validação

- [ ] Console do navegador aberto (F12)
- [ ] Página de edição de usuário carregada
- [ ] Logs aparecem no console quando carrega a página
- [ ] Botão habilitado quando há perfis selecionados (estado inicial)
- [ ] Botão desabilita quando todos os perfis são desmarcados
- [ ] Botão habilita IMEDIATAMENTE ao selecionar um perfil
- [ ] Log mostra `hasSelectedRoles: true` quando perfil é selecionado
- [ ] Log mostra `hasSelectedRoles: false` quando nenhum perfil está selecionado
- [ ] Múltiplos perfis podem ser selecionados
- [ ] Perfis são salvos com sucesso (toast de sucesso)
- [ ] Redirecionamento ocorre após salvar
- [ ] Perfis persistem no banco (verificado ao reabrir o formulário)
- [ ] Logs detalhados aparecem no terminal do servidor

## Logs Esperados no Console do Navegador

### Ao carregar o formulário
```javascript
[UserRoleForm] Estado atual do formulário: {
  roleIds: ["1", "2"],  // IDs dos perfis atuais do usuário
  hasSelectedRoles: true,
  isValid: true,
  isDirty: false,
  errors: {}
}
```

### Ao desmarcar um perfil
```javascript
[UserRoleForm] Estado atual do formulário: {
  roleIds: ["1"],  // Um perfil foi removido
  hasSelectedRoles: true,  // Ainda tem perfis
  isValid: true,
  isDirty: true,
  errors: {}
}
```

### Ao desmarcar todos
```javascript
[UserRoleForm] Estado atual do formulário: {
  roleIds: [],  // Array vazio
  hasSelectedRoles: false,  // IMPORTANTE: false desabilita o botão
  isValid: false,
  isDirty: true,
  errors: { roleIds: { message: "Você deve selecionar pelo menos um perfil." } }
}
```

### Ao marcar um perfil novamente
```javascript
[UserRoleForm] Estado atual do formulário: {
  roleIds: ["3"],  // Novo perfil adicionado
  hasSelectedRoles: true,  // IMPORTANTE: true habilita o botão
  isValid: true,
  isDirty: true,
  errors: {}
}
```

## Troubleshooting

### Problema: Botão continua desabilitado
**Verificar**:
1. Abrir console e verificar se `hasSelectedRoles` é `true`
2. Verificar se há erros no console
3. Verificar se os logs aparecem quando interage com os checkboxes

### Problema: Logs não aparecem
**Verificar**:
1. Console está filtrado? (remover filtros)
2. Servidor em desenvolvimento está rodando?
3. Página foi recarregada após as alterações?

### Problema: Perfis não salvam
**Verificar**:
1. Logs no terminal do servidor
2. Mensagens de erro no toast
3. Console do navegador para erros JavaScript

## Resultado Esperado Final

✅ Botão "Salvar Perfis" habilita/desabilita corretamente baseado na seleção de perfis
✅ Logs detalhados facilitam o debugging
✅ Perfis são salvos e persistidos no banco de dados
✅ Feedback visual claro para o usuário (botão habilitado/desabilitado)

---

**Data**: 2025-11-23  
**Versão**: 2.0 (correção com watch)

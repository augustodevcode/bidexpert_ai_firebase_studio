# Teste Manual - Alteração de Perfis de Usuário

## Objetivo
Verificar se a correção implementada permite que o administrador altere os perfis dos usuários corretamente.

## Alterações Realizadas

### 1. Correção no Formulário (user-role-form.tsx)
- Adicionado `mode: 'onChange'` ao `useForm` para validação em tempo real
- Logs detalhados em todas as etapas do processo de submissão

### 2. Logs Adicionados na Action (actions.ts)
- Log de entrada com userId e roleIds
- Log da conversão para BigInt
- Log do resultado do serviço
- Log da revalidação de paths

### 3. Logs Adicionados no Service (user.service.ts)
- Log de início da operação
- Log do usuário encontrado com perfis atuais
- Log dos tenantIds do usuário
- Log antes de chamar o repository
- Log após atualização com verificação dos perfis salvos

### 4. Logs Adicionados no Repository (user.repository.ts)
- Log de início da operação
- Log da quantidade de perfis deletados
- Log da quantidade de perfis criados
- Log de conclusão da operação

## Passo a Passo para Teste Manual

### 1. Iniciar a Aplicação
```bash
npm run dev
```

Aguardar até que o servidor esteja rodando em `http://localhost:3000`

### 2. Fazer Login como Administrador
1. Acessar `http://localhost:3000/auth/signin`
2. Usar as credenciais:
   - Email: `admin@bidexpert.com.br`
   - Senha: `admin123`

### 3. Navegar para Lista de Usuários
1. No menu lateral, clicar em "Usuários" ou acessar `http://localhost:3000/admin/users`
2. Aguardar o carregamento da lista de usuários

### 4. Selecionar um Usuário para Teste
1. Escolher um usuário que NÃO seja o admin (por exemplo, "advogado@bidexpert.com.br")
2. Clicar no botão de ações (três pontinhos) na linha do usuário
3. Clicar em "Editar"

### 5. Testar Alteração de Perfis

#### Teste 1: Validar Botão Desabilitado
1. Rolar a página até a seção "Atribuir Perfis"
2. Desmarcar TODOS os checkboxes de perfis
3. **Verificar**: O botão "Salvar Perfis" deve estar DESABILITADO
4. **Resultado esperado**: ✅ Botão desabilitado quando nenhum perfil está selecionado

#### Teste 2: Habilitar Botão ao Selecionar Perfil
1. Selecionar um perfil (qualquer checkbox)
2. **Verificar**: O botão "Salvar Perfis" deve ser HABILITADO imediatamente
3. **Resultado esperado**: ✅ Botão habilitado assim que um perfil é selecionado

#### Teste 3: Salvar Perfis
1. Com pelo menos um perfil selecionado, clicar em "Salvar Perfis"
2. **Verificar**: Deve aparecer um toast de sucesso
3. **Verificar**: Deve redirecionar para `/admin/users`
4. **Resultado esperado**: ✅ Perfis salvos com sucesso

#### Teste 4: Verificar Persistência
1. Voltar para a lista de usuários
2. Editar novamente o mesmo usuário
3. Rolar até a seção "Atribuir Perfis"
4. **Verificar**: Os perfis selecionados anteriormente devem estar marcados
5. **Resultado esperado**: ✅ Perfis foram persistidos corretamente

## Logs Esperados no Console do Navegador

Durante o teste, você deve ver os seguintes logs no console do navegador (F12):

```
[UserRoleForm] Iniciando submissão do formulário de perfis
[UserRoleForm] Usuário ID: <ID_DO_USUARIO>
[UserRoleForm] Perfis selecionados: [<ARRAY_DE_IDS>]
[UserRoleForm] Perfis anteriores: [<PERFIS_ANTERIORES>]
[UserRoleForm] Chamando onSubmitAction...
[UserRoleForm] Resultado da submissão: { success: true, message: "..." }
[UserRoleForm] Perfis atualizados com sucesso
[UserRoleForm] Submissão finalizada
```

## Logs Esperados no Terminal do Servidor

No terminal onde o servidor está rodando, você deve ver:

```
[updateUserRoles] Action chamada
[updateUserRoles] userId: <ID>
[updateUserRoles] roleIds recebidos: [<IDS>]
[updateUserRoles] roleIds convertidos para BigInt: [<IDS>]
[updateUserRoles] Chamando userService.updateUserRoles...
[UserService.updateUserRoles] Iniciando atualização de perfis
[UserService.updateUserRoles] userId: <ID>
[UserService.updateUserRoles] roleIds: [<IDS>]
[UserService.updateUserRoles] Usuário encontrado: { id: '<ID>', email: '<EMAIL>', currentRoles: [...] }
[UserService.updateUserRoles] tenantIds do usuário: [<TENANT_IDS>]
[UserService.updateUserRoles] Chamando repository.updateUserRoles...
[UserRepository.updateUserRoles] Iniciando atualização de perfis
[UserRepository.updateUserRoles] userId: <ID>
[UserRepository.updateUserRoles] roleIds: [<IDS>]
[UserRepository.updateUserRoles] Deletando perfis existentes...
[UserRepository.updateUserRoles] Perfis deletados: <QUANTIDADE>
[UserRepository.updateUserRoles] Criando novos perfis...
[UserRepository.updateUserRoles] Perfis criados: <QUANTIDADE>
[UserRepository.updateUserRoles] Atualização concluída
[UserService.updateUserRoles] Perfis atualizados com sucesso no repositório
[UserService.updateUserRoles] Perfis após atualização: [<PERFIS_ATUALIZADOS>]
[updateUserRoles] Resultado do serviço: { success: true, message: '...' }
[updateUserRoles] Revalidando paths...
[updateUserRoles] Retornando resultado
```

## Checklist de Validação

- [ ] Servidor iniciado sem erros
- [ ] Login realizado com sucesso
- [ ] Lista de usuários carregada
- [ ] Formulário de edição aberto
- [ ] Botão "Salvar Perfis" desabilita quando nenhum perfil está selecionado
- [ ] Botão "Salvar Perfis" habilita imediatamente ao selecionar um perfil
- [ ] Botão "Salvar Perfis" permite múltiplos perfis selecionados
- [ ] Toast de sucesso exibido após salvar
- [ ] Redirecionamento para lista de usuários após salvar
- [ ] Perfis persistidos corretamente (verificado ao reabrir o formulário)
- [ ] Logs detalhados aparecem no console do navegador
- [ ] Logs detalhados aparecem no terminal do servidor
- [ ] Nenhum erro de JavaScript no console
- [ ] Nenhum erro no terminal do servidor

## Problemas Conhecidos e Soluções

### Problema: Botão ficava desabilitado ao selecionar perfil
**Solução**: Adicionado `mode: 'onChange'` ao `useForm` para validação em tempo real.

### Problema: Dificuldade em diagnosticar falhas
**Solução**: Adicionados logs detalhados em todas as camadas (Form, Action, Service, Repository).

## Conclusão

Após seguir todos os passos acima e verificar todos os itens do checklist, a funcionalidade de alteração de perfis de usuário está:

- ✅ **FUNCIONANDO CORRETAMENTE** - Se todos os testes passaram
- ❌ **COM PROBLEMAS** - Se algum teste falhou (anotar qual teste falhou e os logs obtidos)

---

**Data do Teste**: _______________  
**Testado por**: _______________  
**Resultado**: _______________  
**Observações**: _______________

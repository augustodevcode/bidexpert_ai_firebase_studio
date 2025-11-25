# 🚀 Guia Rápido - Sistema ITSM-AI

## Para Usuários

### Como Abrir um Ticket de Suporte

1. **Localize os Botões**: No canto inferior direito da tela, clique no botão de mensagem flutuante
2. **Escolha uma Opção**:
   - 🔵 **FAQ** - Para perguntas comuns
   - 🟣 **Chat AI** - Para dúvidas rápidas
   - 🟠 **Reportar Issue** - Para problemas técnicos

3. **Preencha o Formulário** (se escolher "Reportar Issue"):
   - Título: Descreva brevemente o problema
   - Categoria: Selecione o tipo (Técnico, Bug, Dúvida, etc.)
   - Prioridade: Escolha a urgência
   - Descrição: Detalhe o problema

4. **Envie**: Sua solicitação será criada e você receberá um número de ticket

### Usando o Chat AI

1. Clique no botão **Chat AI** (roxo)
2. Digite sua pergunta
3. Aguarde a resposta automática
4. Se não resolver, você pode abrir um ticket diretamente

## Para Administradores

### Acessar Painel de Tickets

1. Acesse `/admin/support-tickets`
2. Visualize todos os tickets abertos
3. Use os filtros para encontrar tickets específicos
4. Clique em "Ver Detalhes" para abrir um ticket

### Monitor de Queries

- **Localização**: Rodapé do painel admin
- **Expandir**: Clique em "Expandir" para ver detalhes
- **Indicadores**:
  - 🟢 Verde: Query rápida (< 500ms)
  - 🟡 Amarelo: Query moderada (500ms - 1s)
  - 🔴 Vermelho: Query lenta (> 1s)

### Estatísticas Disponíveis

- **Total**: Número total de queries registradas
- **Média**: Tempo médio de execução
- **Lentas**: Queries que demoram mais de 1 segundo
- **Falhas**: Queries que falharam

## Instalação

### 1. Executar Migration

```bash
# Via SQL direto
mysql -u username -p database_name < add_itsm_support_system.sql

# OU via Prisma
npx prisma db push
```

### 2. Gerar Prisma Client

```bash
npx prisma generate
```

### 3. Reiniciar Aplicação

```bash
npm run dev
```

## Verificação

### Confirme que está funcionando:

1. ✅ Botões flutuantes aparecem no canto inferior direito
2. ✅ Modal abre ao clicar nos botões
3. ✅ Chat responde mensagens
4. ✅ Formulário de ticket pode ser preenchido
5. ✅ Monitor de queries aparece no rodapé do admin
6. ✅ Página `/admin/support-tickets` carrega

## Atalhos Úteis

| Ação | Caminho |
|------|---------|
| Ver Tickets | `/admin/support-tickets` |
| Abrir Ticket | Botão flutuante → Reportar Issue |
| Usar Chat | Botão flutuante → Chat AI |
| Ver FAQs | Botão flutuante → FAQ |

## Troubleshooting Rápido

**Botões não aparecem?**
→ Verifique se está em uma página pública (não /admin ou /dashboard)

**Chat não responde?**
→ Verifique os logs do console (F12)

**Tickets não salvam?**
→ Execute a migration SQL

**Monitor não mostra queries?**
→ Execute algumas operações no sistema primeiro

---

✨ **Pronto para uso!** Se encontrar problemas, consulte o README completo.

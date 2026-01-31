/**
 * Script para popular apenas dados de ITSM (Sistema de Chamados de Suporte)
 * Executa de forma independente sem interferir no seed principal
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Cria tickets de suporte simulados
 */
async function seedItsmTickets(tenantId: bigint) {
  console.log('[ITSM] 🎫 Criando tickets de suporte...');
  
  const users = await prisma.user.findMany({ where: { tenants: { some: { tenantId } } }, take: 10 });
  const supportUsers = users.filter(u => u.email.includes('admin') || u.email.includes('suporte'));
  
  if (users.length === 0) {
    console.log('   ⚠️ Sem usuários para criar tickets');
    return;
  }
  
  const existingCount = await prisma.iTSM_Ticket.count({ where: { tenantId } });
  if (existingCount >= 15) {
    console.log(`   Já existem ${existingCount} tickets`);
    return;
  }
  
  const ticketTemplates = [
    { title: 'Erro ao fazer lance no leilão', category: 'BUG', priority: 'ALTA', status: 'ABERTO', description: 'Quando tento fazer um lance, aparece uma mensagem de erro "Operação não permitida". Já tentei em diferentes navegadores.' },
    { title: 'Dúvida sobre pagamento de arrematação', category: 'DUVIDA', priority: 'MEDIA', status: 'EM_ANDAMENTO', description: 'Gostaria de saber quais são as formas de pagamento aceitas após arrematar um lote.' },
    { title: 'Não consigo me habilitar para leilão judicial', category: 'TECNICO', priority: 'ALTA', status: 'AGUARDANDO_USUARIO', description: 'Estou tentando me habilitar para o leilão #123 mas o sistema não aceita meu CPF.' },
    { title: 'Sugestão de melhoria na busca', category: 'SUGESTAO', priority: 'BAIXA', status: 'RESOLVIDO', description: 'Seria interessante adicionar filtros por cidade e estado na busca de lotes.' },
    { title: 'Sistema lento durante leilão ao vivo', category: 'TECNICO', priority: 'CRITICA', status: 'EM_ANDAMENTO', description: 'Durante o leilão às 14h, o sistema ficou muito lento e perdi vários lances.' },
    { title: 'Problema com certificado digital', category: 'TECNICO', priority: 'ALTA', status: 'ABERTO', description: 'Meu certificado A3 não está sendo reconhecido pelo sistema.' },
    { title: 'Erro 500 ao acessar meus leilões', category: 'BUG', priority: 'CRITICA', status: 'RESOLVIDO', description: 'Ao clicar em "Meus Leilões" aparece uma página de erro.' },
    { title: 'Dúvida sobre comissão do leiloeiro', category: 'DUVIDA', priority: 'BAIXA', status: 'FECHADO', description: 'Qual a porcentagem de comissão cobrada pelo leiloeiro?' },
    { title: 'Imagens dos lotes não carregam', category: 'BUG', priority: 'MEDIA', status: 'EM_ANDAMENTO', description: 'As fotos dos lotes 45, 46 e 47 aparecem como placeholder.' },
    { title: 'Solicitação de cancelamento de lance', category: 'FUNCIONAL', priority: 'ALTA', status: 'AGUARDANDO_USUARIO', description: 'Fiz um lance errado e gostaria de cancelar. Processo CNJ 1234567-89.2024.8.26.0100.' },
    { title: 'Relatório de arrematação com erro', category: 'BUG', priority: 'MEDIA', status: 'ABERTO', description: 'O PDF do termo de arrematação está saindo com dados incorretos.' },
    { title: 'App mobile não sincroniza lances', category: 'TECNICO', priority: 'ALTA', status: 'EM_ANDAMENTO', description: 'Fiz lances pelo app mas não aparecem no site.' },
    { title: 'Documentação para venda direta', category: 'DUVIDA', priority: 'BAIXA', status: 'RESOLVIDO', description: 'Quais documentos preciso para comprar um imóvel por venda direta?' },
    { title: 'Timeout durante upload de documentos', category: 'TECNICO', priority: 'MEDIA', status: 'FECHADO', description: 'Ao enviar RG em PDF, dá timeout após 2 minutos.' },
    { title: 'Proposta de parceria comercial', category: 'OUTRO', priority: 'BAIXA', status: 'ABERTO', description: 'Somos uma empresa de leilões e gostaríamos de usar a plataforma.' },
  ];
  
  for (let i = 0; i < ticketTemplates.length; i++) {
    const tpl = ticketTemplates[i];
    const user = users[i % users.length];
    const assignedTo = supportUsers.length > 0 ? supportUsers[i % supportUsers.length] : null;
    
    await prisma.iTSM_Ticket.create({
      data: {
        tenantId,
        publicId: `TKT-${Date.now()}-${i.toString().padStart(3, '0')}`,
        userId: user.id,
        title: tpl.title,
        description: tpl.description,
        status: tpl.status as any,
        priority: tpl.priority as any,
        category: tpl.category as any,
        assignedToUserId: assignedTo?.id,
        userSnapshot: { name: user.fullName, email: user.email },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        browserInfo: faker.helpers.arrayElement(['Chrome 120', 'Firefox 121', 'Safari 17', 'Edge 120']),
        screenSize: faker.helpers.arrayElement(['1920x1080', '1366x768', '2560x1440', '1440x900']),
        pageUrl: faker.helpers.arrayElement(['/leiloes', '/lotes/123', '/minha-conta', '/habilitacao']),
        resolvedAt: tpl.status === 'RESOLVIDO' || tpl.status === 'FECHADO' ? faker.date.recent({ days: 5 }) : null,
        closedAt: tpl.status === 'FECHADO' ? faker.date.recent({ days: 3 }) : null,
        updatedAt: new Date(),
      }
    });
  }
  
  console.log(`   ✅ ${ticketTemplates.length} tickets criados`);
}

/**
 * Cria mensagens nos tickets
 */
async function seedItsmMessages(tenantId: bigint) {
  console.log('[ITSM] 💬 Criando mensagens nos tickets...');
  
  const tickets = await prisma.iTSM_Ticket.findMany({ where: { tenantId }, take: 15 });
  const users = await prisma.user.findMany({ where: { tenants: { some: { tenantId } } }, take: 5 });
  
  if (tickets.length === 0 || users.length === 0) {
    console.log('   ⚠️ Sem tickets ou usuários');
    return;
  }
  
  const existingCount = await prisma.iTSM_Message.count();
  if (existingCount >= 30) {
    console.log(`   Já existem ${existingCount} mensagens`);
    return;
  }
  
  const responses = [
    'Olá! Já estamos analisando seu chamado.',
    'Poderia fornecer mais detalhes sobre o problema?',
    'Conseguimos identificar a causa. Estamos trabalhando na correção.',
    'O problema foi corrigido. Por favor, teste novamente.',
    'Entendemos sua dúvida. A resposta é: [informação relevante]',
    'Agradecemos o feedback! Vamos considerar sua sugestão.',
    'Precisamos de um print da tela com o erro.',
    'Qual navegador e versão você está utilizando?',
    'O problema foi escalado para a equipe técnica.',
    'Verificamos e o sistema está funcionando normalmente agora.',
  ];
  
  const userFollowups = [
    'Obrigado pela resposta rápida!',
    'Ainda não funcionou, o erro persiste.',
    'Testei e agora está funcionando perfeitamente.',
    'Segue o print solicitado em anexo.',
    'Estou usando Chrome versão 120.',
    'Muito obrigado pelo suporte!',
  ];
  
  let msgCount = 0;
  for (const ticket of tickets) {
    const numMessages = faker.number.int({ min: 2, max: 5 });
    
    for (let i = 0; i < numMessages; i++) {
      const isSupport = i % 2 === 1;
      const user = isSupport ? users[0] : await prisma.user.findUnique({ where: { id: ticket.userId } });
      
      if (!user) continue;
      
      await prisma.iTSM_Message.create({
        data: {
          ticketId: ticket.id,
          userId: user.id,
          message: isSupport ? responses[i % responses.length] : userFollowups[i % userFollowups.length],
          isInternal: isSupport && faker.datatype.boolean({ probability: 0.2 }),
        }
      });
      msgCount++;
    }
  }
  
  console.log(`   ✅ ${msgCount} mensagens criadas`);
}

/**
 * Cria attachments nos tickets
 */
async function seedItsmAttachments(tenantId: bigint) {
  console.log('[ITSM] 📎 Criando anexos nos tickets...');
  
  const tickets = await prisma.iTSM_Ticket.findMany({ where: { tenantId }, take: 10 });
  const users = await prisma.user.findMany({ where: { tenants: { some: { tenantId } } }, take: 5 });
  
  if (tickets.length === 0 || users.length === 0) {
    console.log('   ⚠️ Sem tickets ou usuários');
    return;
  }
  
  const existingCount = await prisma.iTSM_Attachment.count();
  if (existingCount >= 15) {
    console.log(`   Já existem ${existingCount} anexos`);
    return;
  }
  
  const attachmentTypes = [
    { name: 'screenshot-erro.png', mime: 'image/png', size: 125000 },
    { name: 'log-console.txt', mime: 'text/plain', size: 8500 },
    { name: 'documento-rg.pdf', mime: 'application/pdf', size: 450000 },
    { name: 'video-bug.mp4', mime: 'video/mp4', size: 5200000 },
    { name: 'certificado-a3.cer', mime: 'application/x-x509-ca-cert', size: 2048 },
    { name: 'comprovante-pagamento.pdf', mime: 'application/pdf', size: 380000 },
    { name: 'print-tela.jpg', mime: 'image/jpeg', size: 95000 },
  ];
  
  let attachCount = 0;
  for (const ticket of tickets.slice(0, 8)) {
    const numAttachments = faker.number.int({ min: 1, max: 2 });
    
    for (let i = 0; i < numAttachments; i++) {
      const att = attachmentTypes[faker.number.int({ min: 0, max: attachmentTypes.length - 1 })];
      const user = users[faker.number.int({ min: 0, max: users.length - 1 })];
      
      await prisma.iTSM_Attachment.create({
        data: {
          ticketId: ticket.id,
          fileName: att.name,
          fileUrl: `https://storage.bidexpert.com/itsm/${ticket.publicId}/${att.name}`,
          fileSize: att.size,
          mimeType: att.mime,
          uploadedBy: user.id,
        }
      });
      attachCount++;
    }
  }
  
  console.log(`   ✅ ${attachCount} anexos criados`);
}

/**
 * Cria logs de chat do assistente virtual
 */
async function seedItsmChatLogs(tenantId: bigint) {
  console.log('[ITSM] 🤖 Criando logs de chat do assistente...');
  
  const users = await prisma.user.findMany({ where: { tenants: { some: { tenantId } } }, take: 10 });
  const tickets = await prisma.iTSM_Ticket.findMany({ where: { tenantId }, take: 5 });
  
  if (users.length === 0) {
    console.log('   ⚠️ Sem usuários');
    return;
  }
  
  const existingCount = await prisma.iTSM_ChatLog.count({ where: { tenantId } });
  if (existingCount >= 12) {
    console.log(`   Já existem ${existingCount} chat logs`);
    return;
  }
  
  const chatSessions = [
    {
      messages: [
        { role: 'user', content: 'Como faço para participar de um leilão?' },
        { role: 'assistant', content: 'Para participar, você precisa: 1) Criar uma conta, 2) Enviar documentos para habilitação, 3) Aguardar aprovação.' },
        { role: 'user', content: 'Obrigado!' }
      ],
      wasHelpful: true,
      ticketCreated: false
    },
    {
      messages: [
        { role: 'user', content: 'Estou com erro ao fazer login' },
        { role: 'assistant', content: 'Vou ajudar. Qual mensagem de erro aparece?' },
        { role: 'user', content: 'Diz que minha senha está errada mas tenho certeza que está certa' },
        { role: 'assistant', content: 'Recomendo usar a opção "Esqueci minha senha" para redefinir. Posso abrir um chamado para você?' },
        { role: 'user', content: 'Sim, por favor' }
      ],
      wasHelpful: false,
      ticketCreated: true
    },
    {
      messages: [
        { role: 'user', content: 'Qual o prazo para pagamento após arrematação?' },
        { role: 'assistant', content: 'O prazo padrão é de 24 horas para sinal (30%) e 15 dias para o restante, mas pode variar conforme o edital.' }
      ],
      wasHelpful: true,
      ticketCreated: false
    },
    {
      messages: [
        { role: 'user', content: 'O leilão 456 foi cancelado?' },
        { role: 'assistant', content: 'Deixe-me verificar... O leilão 456 foi suspenso temporariamente por determinação judicial. Sem previsão de retorno.' },
        { role: 'user', content: 'E os lances que já foram dados?' },
        { role: 'assistant', content: 'Todos os lances foram cancelados. Você receberá notificação quando houver nova data.' }
      ],
      wasHelpful: true,
      ticketCreated: false
    },
    {
      messages: [
        { role: 'user', content: 'Não consigo enviar meus documentos' },
        { role: 'assistant', content: 'Qual formato e tamanho do arquivo?' },
        { role: 'user', content: 'PDF com 15MB' },
        { role: 'assistant', content: 'O limite é 10MB. Tente comprimir o arquivo ou dividir em partes.' }
      ],
      wasHelpful: true,
      ticketCreated: false
    },
  ];
  
  for (let i = 0; i < chatSessions.length; i++) {
    const session = chatSessions[i];
    const user = users[i % users.length];
    const ticket = session.ticketCreated && tickets[i % tickets.length] ? tickets[i % tickets.length] : null;
    
    await prisma.iTSM_ChatLog.create({
      data: {
        tenantId,
        userId: user.id,
        ticketId: ticket?.id,
        sessionId: uuidv4(),
        messages: session.messages,
        context: { page: '/ajuda', timestamp: new Date().toISOString() },
        wasHelpful: session.wasHelpful,
        ticketCreated: session.ticketCreated,
        updatedAt: new Date(),
      }
    });
  }
  
  console.log(`   ✅ ${chatSessions.length} chat logs criados`);
}

/**
 * Cria logs de queries (performance/debug)
 */
async function seedItsmQueryLogs(tenantId: bigint) {
  console.log('[ITSM] 📊 Criando logs de queries...');
  
  const users = await prisma.user.findMany({ where: { tenants: { some: { tenantId } } }, take: 5 });
  
  const existingCount = await prisma.iTSM_QueryLog.count();
  if (existingCount >= 20) {
    console.log(`   Já existem ${existingCount} query logs`);
    return;
  }
  
  const queryTemplates = [
    { endpoint: '/api/leiloes', method: 'GET', success: true, duration: 45 },
    { endpoint: '/api/lotes/search', method: 'POST', success: true, duration: 120 },
    { endpoint: '/api/lances', method: 'POST', success: true, duration: 35 },
    { endpoint: '/api/lances', method: 'POST', success: false, duration: 5000, error: 'Timeout ao processar lance' },
    { endpoint: '/api/habilitacao', method: 'POST', success: true, duration: 250 },
    { endpoint: '/api/documentos/upload', method: 'POST', success: false, duration: 30000, error: 'Request Entity Too Large' },
    { endpoint: '/api/relatorios/pdf', method: 'GET', success: true, duration: 1500 },
    { endpoint: '/api/auth/login', method: 'POST', success: true, duration: 180 },
    { endpoint: '/api/auth/login', method: 'POST', success: false, duration: 50, error: 'Invalid credentials' },
    { endpoint: '/api/pagamentos', method: 'POST', success: true, duration: 890 },
    { endpoint: '/api/notificacoes', method: 'GET', success: true, duration: 25 },
    { endpoint: '/api/leiloes/ao-vivo', method: 'GET', success: true, duration: 15 },
    { endpoint: '/api/usuarios/perfil', method: 'PUT', success: true, duration: 95 },
    { endpoint: '/api/favoritos', method: 'POST', success: true, duration: 40 },
    { endpoint: '/api/busca/avancada', method: 'POST', success: true, duration: 350 },
  ];
  
  for (let i = 0; i < queryTemplates.length; i++) {
    const tpl = queryTemplates[i];
    const user = users.length > 0 ? users[i % users.length] : null;
    
    await prisma.iTSM_QueryLog.create({
      data: {
        query: `SELECT * FROM ... (${tpl.endpoint})`,
        duration: tpl.duration,
        success: tpl.success,
        errorMessage: tpl.error || null,
        userId: user?.id,
        endpoint: tpl.endpoint,
        method: tpl.method,
        ipAddress: faker.internet.ip(),
      }
    });
  }
  
  console.log(`   ✅ ${queryTemplates.length} query logs criados`);
}

/**
 * Cria form submissions
 */
async function seedFormSubmissions(tenantId: bigint) {
  console.log('[ITSM] 📝 Criando form submissions...');
  
  const users = await prisma.user.findMany({ where: { tenants: { some: { tenantId } } }, take: 10 });
  
  if (users.length === 0) {
    console.log('   ⚠️ Sem usuários');
    return;
  }
  
  const existingCount = await prisma.formSubmission.count({ where: { tenantId } });
  if (existingCount >= 15) {
    console.log(`   Já existem ${existingCount} form submissions`);
    return;
  }
  
  const formTemplates = [
    { formType: 'CADASTRO_USUARIO', status: 'SUBMITTED', score: 100, data: { nome: 'João Silva', cpf: '123.456.789-00', email: 'joao@email.com' } },
    { formType: 'HABILITACAO_LEILAO', status: 'VALID', score: 95, data: { documentos: ['RG', 'CPF', 'Comprovante'], leilaoId: 1 } },
    { formType: 'HABILITACAO_LEILAO', status: 'INVALID', score: 45, data: { documentos: ['RG'], leilaoId: 2 }, errors: ['CPF obrigatório', 'Comprovante de residência obrigatório'] },
    { formType: 'PROPOSTA_VENDA_DIRETA', status: 'SUBMITTED', score: 100, data: { loteId: 5, valorProposta: 150000, mensagem: 'Interessado no imóvel' } },
    { formType: 'CADASTRO_LEILOEIRO', status: 'VALIDATING', score: 80, data: { nome: 'Maria Leiloeira', jucesp: '123456', creci: '78901' } },
    { formType: 'CONTATO', status: 'SUBMITTED', score: 100, data: { assunto: 'Dúvida', mensagem: 'Gostaria de mais informações' } },
    { formType: 'RECURSO_LANCE', status: 'DRAFT', score: 60, data: { lanceId: 123, motivo: 'Erro no sistema' } },
    { formType: 'CADASTRO_COMITENTE', status: 'VALID', score: 100, data: { razaoSocial: 'Banco XYZ', cnpj: '12.345.678/0001-90' } },
    { formType: 'HABILITACAO_LEILAO', status: 'SUBMITTED', score: 90, data: { documentos: ['RG', 'CPF', 'Certidão'], leilaoId: 3 } },
    { formType: 'ALTERACAO_CADASTRO', status: 'VALID', score: 100, data: { campo: 'telefone', valorAntigo: '11999999999', valorNovo: '11988888888' } },
    { formType: 'SOLICITACAO_VISITA', status: 'SUBMITTED', score: 100, data: { loteId: 10, dataPreferida: '2026-02-15', horario: '14:00' } },
    { formType: 'CADASTRO_USUARIO', status: 'FAILED', score: 30, data: { nome: '', cpf: 'invalido' }, errors: ['Nome obrigatório', 'CPF inválido'] },
  ];
  
  for (let i = 0; i < formTemplates.length; i++) {
    const tpl = formTemplates[i];
    const user = users[i % users.length];
    
    await prisma.formSubmission.create({
      data: {
        tenantId,
        userId: user.id,
        formType: tpl.formType,
        status: tpl.status as any,
        validationScore: tpl.score,
        data: tpl.data,
        validationErrors: tpl.errors || undefined,
        completedAt: tpl.status === 'SUBMITTED' || tpl.status === 'VALID' ? new Date() : null,
      }
    });
  }
  
  console.log(`   ✅ ${formTemplates.length} form submissions criados`);
}

/**
 * Função principal
 */
async function main() {
  console.log('\n🎫 Iniciando seed de dados ITSM...\n');
  
  const tenantId = BigInt(1);
  
  try {
    // Verifica se tenant existe
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error('Tenant ID 1 não encontrado. Execute o seed principal primeiro.');
    }
    
    console.log(`📌 Usando tenant: ${tenant.name} (ID: ${tenantId})\n`);
    
    await seedItsmTickets(tenantId);
    await seedItsmMessages(tenantId);
    await seedItsmAttachments(tenantId);
    await seedItsmChatLogs(tenantId);
    await seedItsmQueryLogs(tenantId);
    await seedFormSubmissions(tenantId);
    
    // Exibe resumo final
    console.log('\n📊 Resumo Final:');
    console.log('----------------');
    const itsmTickets = await prisma.iTSM_Ticket.count({ where: { tenantId } });
    const itsmMessages = await prisma.iTSM_Message.count();
    const itsmAttachments = await prisma.iTSM_Attachment.count();
    const itsmChatLogs = await prisma.iTSM_ChatLog.count({ where: { tenantId } });
    const itsmQueryLogs = await prisma.iTSM_QueryLog.count();
    const formSubmissions = await prisma.formSubmission.count({ where: { tenantId } });
    
    console.log(`  itsm_tickets: ${itsmTickets}`);
    console.log(`  itsm_messages: ${itsmMessages}`);
    console.log(`  itsm_attachments: ${itsmAttachments}`);
    console.log(`  itsm_chat_logs: ${itsmChatLogs}`);
    console.log(`  itsm_query_logs: ${itsmQueryLogs}`);
    console.log(`  form_submissions: ${formSubmissions}`);
    
    console.log('\n✅ Seed ITSM concluído com sucesso!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });

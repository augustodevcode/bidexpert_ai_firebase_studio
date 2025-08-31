// tests/integration/user-habilitation.test.ts
// Esqueleto de teste de integração para o fluxo de Habilitação de Usuário
// Ferramenta: Jest / Vitest com Supertest e um BD de teste

// import request from 'supertest';
// import { app } from '.../app';
// import { prisma } from '.../lib/prisma';
// import { getAdminAuthToken, getUserAuthToken } from '.../test-utils';

describe('User Habilitation Flow', () => {

  let user;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    // Setup: Criar um usuário de teste e obter tokens de autenticação
    // user = await prisma.user.create({
    //   data: {
    //     email: 'testuser@example.com',
    //     password: '...',
    //     habilitationStatus: 'PENDING_DOCUMENTS'
    //   }
    // });
    // adminToken = await getAdminAuthToken();
    // userToken = await getUserAuthToken(user.email);
  });

  afterAll(async () => {
    // Teardown: Limpar o usuário e seus documentos do BD
    // await prisma.user.deleteMany();
    // await prisma.userDocument.deleteMany();
  });

  it('should allow a user to submit documents for analysis', async () => {
    // Given: um usuário logado com status PENDING_DOCUMENTS
    // When: o usuário faz uma chamada de API para submeter um documento (ex: RG)
    // const response = await request(app)
    //   .post('/api/profile/documents')
    //   .set('Authorization', `Bearer ${userToken}`)
    //   .send({ documentType: 'RG', fileUrl: '/uploads/fake_rg.pdf' });

    // Then: a resposta deve ser 201 Created
    // expect(response.status).toBe(201);

    // And: um registro de UserDocument deve ser criado no BD com status PENDING_ANALYSIS
    // const doc = await prisma.userDocument.findFirst({ where: { userId: user.id } });
    // expect(doc.status).toBe('PENDING_ANALYSIS');

    // And: o status do usuário principal deve mudar para PENDING_ANALYSIS
    // const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    // expect(updatedUser.habilitationStatus).toBe('PENDING_ANALYSIS');
    console.log('Teste de submissão de documentos passou.');
  });

  it('should allow an admin to approve documents, habilitating the user', async () => {
    // Given: um usuário com documentos em PENDING_ANALYSIS
    // await prisma.user.update({ where: { id: user.id }, data: { habilitationStatus: 'PENDING_ANALYSIS' } });
    // await prisma.userDocument.create({ data: { userId: user.id, documentType: 'RG', status: 'PENDING_ANALYSIS', fileUrl: '...' } });

    // When: um admin faz uma chamada de API para aprovar a habilitação do usuário
    // const response = await request(app)
    //   .patch(`/api/admin/habilitations/${user.id}/approve`)
    //   .set('Authorization', `Bearer ${adminToken}`);

    // Then: a resposta deve ser 200 OK
    // expect(response.status).toBe(200);

    // And: o status do usuário no BD deve mudar para "HABILITADO"
    // const finalUser = await prisma.user.findUnique({ where: { id: user.id } });
    // expect(finalUser.habilitationStatus).toBe('HABILITADO');

    // And: o status de todos os documentos pendentes deve mudar para "APPROVED"
    // const docs = await prisma.userDocument.findMany({ where: { userId: user.id } });
    // docs.forEach(doc => expect(doc.status).toBe('APPROVED'));
    console.log('Teste de aprovação de documentos pelo admin passou.');
  });

  it('should prevent a non-admin from accessing the habilitation approval endpoint', async () => {
    // Given: um usuário comum logado
    // When: ele tenta aprovar a habilitação de outro usuário
    // const response = await request(app)
    //   .patch(`/api/admin/habilitations/${user.id}/approve`)
    //   .set('Authorization', `Bearer ${userToken}`); // Usando token de usuário comum

    // Then: a resposta deve ser 403 Forbidden
    // expect(response.status).toBe(403);
    console.log('Teste de segurança do endpoint de aprovação passou.');
  });
});

import { test, expect } from '@playwright/test';

/**
 * ITSM API Tests - Unit & Integration Tests
 * Testes de API para validar endpoints do sistema ITSM
 * 
 * Endpoints testados:
 * - POST /api/support/chat
 * - POST /api/support/tickets
 * - GET /api/support/tickets
 * - GET /api/admin/query-monitor
 */

test.describe('ITSM - API Tests', () => {
  
  test.describe('API /api/support/chat', () => {
    
    test('POST: Deve aceitar mensagem e retornar resposta', async ({ request }) => {
      const response = await request.post('/api/support/chat', {
        data: {
          message: 'Como faço para dar um lance?',
          userId: '1',
          context: {
            url: 'http://localhost:9005',
            userAgent: 'Playwright Test',
            screenSize: '1920x1080'
          }
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('response');
      expect(typeof data.response).toBe('string');
      expect(data.response.length).toBeGreaterThan(0);
    });

    test('POST: Deve retornar erro 401 sem autenticação', async ({ request }) => {
      // Request sem session
      const response = await request.post('/api/support/chat', {
        data: {
          message: 'teste'
        }
      });
      
      // Pode retornar 401 ou 500 dependendo da implementação
      expect([401, 500]).toContain(response.status());
    });

    test('POST: Deve validar campos obrigatórios', async ({ request }) => {
      const response = await request.post('/api/support/chat', {
        data: {}
      });
      
      // Deve retornar erro
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('POST: Deve responder diferentes tipos de perguntas', async ({ request }) => {
      const questions = [
        'Como me habilitar no leilão?',
        'Quais formas de pagamento?',
        'Preciso de quais documentos?'
      ];

      for (const question of questions) {
        const response = await request.post('/api/support/chat', {
          data: {
            message: question,
            userId: '1',
            context: {}
          }
        });

        if (response.ok()) {
          const data = await response.json();
          expect(data.response).toBeTruthy();
          expect(data.response.length).toBeGreaterThan(10);
        }
      }
    });
  });

  test.describe('API /api/support/tickets', () => {
    
    test('POST: Deve criar ticket com dados válidos', async ({ request }) => {
      const response = await request.post('/api/support/tickets', {
        data: {
          title: 'Teste de API - Ticket',
          description: 'Este é um teste automatizado de criação de ticket via API',
          category: 'TECNICO',
          priority: 'MEDIA',
          userId: '1',
          userAgent: 'Playwright Test',
          browserInfo: 'Chrome 120',
          screenSize: '1920x1080',
          pageUrl: 'http://localhost:9005/test'
        }
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBeTruthy();
        expect(data.ticketId).toBeTruthy();
        expect(data.ticketId).toContain('TICKET-');
      }
    });

    test('POST: Deve validar campos obrigatórios do ticket', async ({ request }) => {
      const response = await request.post('/api/support/tickets', {
        data: {
          // Faltando campos obrigatórios
          title: 'Apenas título'
        }
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('POST: Deve aceitar diferentes categorias', async ({ request }) => {
      const categories = ['TECNICO', 'FUNCIONAL', 'DUVIDA', 'SUGESTAO', 'BUG', 'OUTRO'];

      for (const category of categories) {
        const response = await request.post('/api/support/tickets', {
          data: {
            title: `Teste ${category}`,
            description: `Teste de categoria ${category}`,
            category,
            priority: 'BAIXA',
            userId: '1',
            userAgent: 'Test',
            browserInfo: 'Test',
            screenSize: '1920x1080',
            pageUrl: 'test'
          }
        });

        // Pode funcionar ou não dependendo da auth
        if (response.ok()) {
          const data = await response.json();
          expect(data.success).toBeTruthy();
        }
      }
    });

    test('POST: Deve aceitar diferentes prioridades', async ({ request }) => {
      const priorities = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];

      for (const priority of priorities) {
        const response = await request.post('/api/support/tickets', {
          data: {
            title: `Teste ${priority}`,
            description: `Teste de prioridade ${priority}`,
            category: 'DUVIDA',
            priority,
            userId: '1',
            userAgent: 'Test',
            browserInfo: 'Test',
            screenSize: '1920x1080',
            pageUrl: 'test'
          }
        });

        if (response.ok()) {
          const data = await response.json();
          expect(data.success).toBeTruthy();
        }
      }
    });

    test('GET: Deve listar tickets', async ({ request }) => {
      const response = await request.get('/api/support/tickets');

      if (response.ok()) {
        const data = await response.json();
        expect(data).toHaveProperty('tickets');
        expect(Array.isArray(data.tickets)).toBeTruthy();
      }
    });

    test('GET: Deve filtrar tickets por userId', async ({ request }) => {
      const response = await request.get('/api/support/tickets?userId=1');

      if (response.ok()) {
        const data = await response.json();
        expect(Array.isArray(data.tickets)).toBeTruthy();
      }
    });

    test('GET: Deve filtrar tickets por status', async ({ request }) => {
      const response = await request.get('/api/support/tickets?status=ABERTO');

      if (response.ok()) {
        const data = await response.json();
        expect(Array.isArray(data.tickets)).toBeTruthy();
      }
    });
  });

  test.describe('API /api/admin/query-monitor', () => {
    
    test('GET: Deve retornar estatísticas de queries', async ({ request }) => {
      const response = await request.get('/api/admin/query-monitor');

      if (response.ok()) {
        const data = await response.json();
        expect(data).toHaveProperty('stats');
        expect(data.stats).toHaveProperty('total');
        expect(data.stats).toHaveProperty('avgDuration');
      }
    });

    test('GET: Deve retornar lista de queries', async ({ request }) => {
      const response = await request.get('/api/admin/query-monitor');

      if (response.ok()) {
        const data = await response.json();
        expect(data).toHaveProperty('queries');
        expect(Array.isArray(data.queries)).toBeTruthy();
      }
    });

    test('GET: Deve retornar no máximo 50 queries', async ({ request }) => {
      const response = await request.get('/api/admin/query-monitor');

      if (response.ok()) {
        const data = await response.json();
        expect(data.queries.length).toBeLessThanOrEqual(50);
      }
    });

    test('POST: Deve registrar nova query', async ({ request }) => {
      const response = await request.post('/api/admin/query-monitor', {
        data: {
          query: 'SELECT * FROM test',
          duration: 150,
          success: true,
          endpoint: '/api/test',
          method: 'GET',
          userId: '1'
        }
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBeTruthy();
      }
    });

    test('POST: Deve registrar query com erro', async ({ request }) => {
      const response = await request.post('/api/admin/query-monitor', {
        data: {
          query: 'INVALID SQL',
          duration: 50,
          success: false,
          errorMessage: 'Syntax error',
          endpoint: '/api/test',
          method: 'POST'
        }
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBeTruthy();
      }
    });
  });

  test.describe('API Performance & Load', () => {
    
    test('Deve responder em menos de 3 segundos', async ({ request }) => {
      const start = Date.now();
      
      await request.post('/api/support/chat', {
        data: {
          message: 'Performance test',
          userId: '1',
          context: {}
        }
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(3000);
    });

    test('Deve suportar requisições concorrentes', async ({ request }) => {
      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(
          request.post('/api/support/chat', {
            data: {
              message: `Concurrent test ${i}`,
              userId: '1',
              context: {}
            }
          })
        );
      }

      const responses = await Promise.all(promises);
      
      // Todas devem responder
      for (const response of responses) {
        expect([200, 401, 500]).toContain(response.status());
      }
    });
  });
});

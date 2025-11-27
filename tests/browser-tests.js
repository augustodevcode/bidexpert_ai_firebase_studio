// =============================================================================
// SCRIPT DE TESTES BIDEXPERT - EXECUTAR NO CONSOLE DO NAVEGADOR
// =============================================================================
// Como usar:
// 1. Abra o BidExpert no navegador (http://localhost:9005)
// 2. Faça login como admin@bidexpert.com / Test@12345
// 3. Abra o console do navegador (F12)
// 4. Copie e cole este script completo
// 5. Pressione Enter para executar
// =============================================================================

window.BidExpertTests = {
    // Configurações
    config: {
        baseURL: window.location.origin,
        timeout: 10000,
        testResults: []
    },

    // Utilitários
    utils: {
        log: function(message, type = 'info') {
            const colors = {
                info: '#2196F3',
                success: '#4CAF50',
                error: '#F44336',
                warning: '#FF9800'
            };
            console.log(`%c[${type.toUpperCase()}] ${message}`, `color: ${colors[type]}; font-weight: bold;`);
        },

        sleep: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        makeRequest: async function(url, options = {}) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options
                });
                return await response.json();
            } catch (error) {
                this.log(`Erro na requisição para ${url}: ${error.message}`, 'error');
                throw error;
            }
        },

        addResult: function(testName, passed, details = '') {
            this.config.testResults.push({
                test: testName,
                passed: passed,
                details: details,
                timestamp: new Date().toISOString()
            });
        }
    },

    // Testes de Multi-Tenant
    multiTenant: {
        async testTenantIsolation() {
            try {
                BidExpertTests.utils.log('Testando isolamento multi-tenant...', 'info');
                
                // Testar 1: Verificar se os dados do tenant atual são acessíveis
                const auctionsResponse = await BidExpertTests.utils.makeRequest('/api/auctions');
                
                if (auctionsResponse && Array.isArray(auctionsResponse)) {
                    BidExpertTests.utils.log(`✅ Encontrados ${auctionsResponse.length} leilões no tenant atual`, 'success');
                    BidExpertTests.utils.addResult('Tenant Data Access', true, `${auctionsResponse.length} leilões encontrados`);
                } else {
                    BidExpertTests.utils.log('❌ Falha ao acessar dados do tenant', 'error');
                    BidExpertTests.utils.addResult('Tenant Data Access', false, 'Sem resposta válida');
                }

                // Testar 2: Verificar se os dados têm tenantId
                if (auctionsResponse.length > 0) {
                    const hasTenantId = auctionsResponse.every(auction => auction.tenantId);
                    if (hasTenantId) {
                        BidExpertTests.utils.log('✅ Todos os leilões têm tenantId', 'success');
                        BidExpertTests.utils.addResult('TenantId Validation', true, 'Todos os leilões têm tenantId');
                    } else {
                        BidExpertTests.utils.log('❌ Leilões sem tenantId encontrados', 'error');
                        BidExpertTests.utils.addResult('TenantId Validation', false, 'Leilões sem tenantId');
                    }
                }

            } catch (error) {
                BidExpertTests.utils.log(`❌ Erro no teste de isolamento: ${error.message}`, 'error');
                BidExpertTests.utils.addResult('Tenant Isolation', false, error.message);
            }
        },

        async testUserDataAccess() {
            try {
                BidExpertTests.utils.log('Testando acesso a dados do usuário...', 'info');
                
                // Testar acesso aos dados do usuário logado
                const userResponse = await BidExpertTests.utils.makeRequest('/api/auth/me');
                
                if (userResponse && userResponse.email) {
                    BidExpertTests.utils.log(`✅ Usuário autenticado: ${userResponse.email}`, 'success');
                    BidExpertTests.utils.addResult('User Authentication', true, userResponse.email);
                    
                    // Verificar se o usuário tem tenantId
                    if (userResponse.tenantId) {
                        BidExpertTests.utils.log(`✅ Usuário pertence ao tenant: ${userResponse.tenantId}`, 'success');
                        BidExpertTests.utils.addResult('User Tenant', true, `Tenant ID: ${userResponse.tenantId}`);
                    } else {
                        BidExpertTests.utils.log('❌ Usuário sem tenantId', 'error');
                        BidExpertTests.utils.addResult('User Tenant', false, 'Usuário sem tenantId');
                    }
                } else {
                    BidExpertTests.utils.log('❌ Falha na autenticação', 'error');
                    BidExpertTests.utils.addResult('User Authentication', false, 'Sem dados do usuário');
                }

            } catch (error) {
                BidExpertTests.utils.log(`❌ Erro no teste de usuário: ${error.message}`, 'error');
                BidExpertTests.utils.addResult('User Data Access', false, error.message);
            }
        }
    },

    // Testes de CRUDs
    crud: {
        async testAuctionCRUD() {
            try {
                BidExpertTests.utils.log('Testando CRUD de Leilões...', 'info');
                
                // CREATE - Tentar criar um leilão de teste
                const testAuction = {
                    title: 'Leilão Teste Browser',
                    description: 'Leilão criado via testes browser',
                    auctionType: 'JUDICIAL',
                    status: 'RASCUNHO',
                    judicialProcessId: 1 // Assuming there's at least one process
                };

                const createResponse = await BidExpertTests.utils.makeRequest('/api/auctions', {
                    method: 'POST',
                    body: JSON.stringify(testAuction)
                });

                if (createResponse && createResponse.id) {
                    BidExpertTests.utils.log(`✅ Leilão criado: ID ${createResponse.id}`, 'success');
                    BidExpertTests.utils.addResult('Auction Create', true, `ID: ${createResponse.id}`);

                    // READ - Ler o leilão criado
                    const readResponse = await BidExpertTests.utils.makeRequest(`/api/auctions/${createResponse.id}`);
                    
                    if (readResponse && readResponse.id === createResponse.id) {
                        BidExpertTests.utils.log('✅ Leilão lido com sucesso', 'success');
                        BidExpertTests.utils.addResult('Auction Read', true, 'Dados lidos corretamente');
                    } else {
                        BidExpertTests.utils.log('❌ Falha ao ler leilão', 'error');
                        BidExpertTests.utils.addResult('Auction Read', false, 'Dados não correspondem');
                    }

                    // UPDATE - Atualizar o leilão
                    const updateData = { description: 'Descrição atualizada via teste' };
                    const updateResponse = await BidExpertTests.utils.makeRequest(`/api/auctions/${createResponse.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(updateData)
                    });

                    if (updateResponse && updateResponse.description === updateData.description) {
                        BidExpertTests.utils.log('✅ Leilão atualizado com sucesso', 'success');
                        BidExpertTests.utils.addResult('Auction Update', true, 'Descrição atualizada');
                    } else {
                        BidExpertTests.utils.log('❌ Falha ao atualizar leilão', 'error');
                        BidExpertTests.utils.addResult('Auction Update', false, 'Atualização falhou');
                    }

                    // DELETE - Remover o leilão de teste
                    const deleteResponse = await BidExpertTests.utils.makeRequest(`/api/auctions/${createResponse.id}`, {
                        method: 'DELETE'
                    });

                    if (deleteResponse && deleteResponse.success) {
                        BidExpertTests.utils.log('✅ Leilão removido com sucesso', 'success');
                        BidExpertTests.utils.addResult('Auction Delete', true, 'Leilão removido');
                    } else {
                        BidExpertTests.utils.log('❌ Falha ao remover leilão', 'error');
                        BidExpertTests.utils.addResult('Auction Delete', false, 'Remoção falhou');
                    }

                } else {
                    BidExpertTests.utils.log('❌ Falha ao criar leilão', 'error');
                    BidExpertTests.utils.addResult('Auction Create', false, 'Criação falhou');
                }

            } catch (error) {
                BidExpertTests.utils.log(`❌ Erro no CRUD de leilões: ${error.message}`, 'error');
                BidExpertTests.utils.addResult('Auction CRUD', false, error.message);
            }
        },

        async testLotCRUD() {
            try {
                BidExpertTests.utils.log('Testando CRUD de Lotes...', 'info');
                
                // Primeiro, obter um leilão existente
                const auctionsResponse = await BidExpertTests.utils.makeRequest('/api/auctions');
                if (!auctionsResponse || auctionsResponse.length === 0) {
                    BidExpertTests.utils.log('❌ Nenhum leilão encontrado para teste de lotes', 'error');
                    BidExpertTests.utils.addResult('Lot CRUD', false, 'Sem leilões disponíveis');
                    return;
                }

                const auctionId = auctionsResponse[0].id;

                // CREATE - Criar um lote de teste
                const testLot = {
                    title: 'Lote Teste Browser',
                    description: 'Lote criado via testes browser',
                    type: 'IMOVEL',
                    status: 'CADASTRO',
                    auctionId: auctionId,
                    evaluationValue: 100000,
                    initialPrice: 80000
                };

                const createResponse = await BidExpertTests.utils.makeRequest('/api/lots', {
                    method: 'POST',
                    body: JSON.stringify(testLot)
                });

                if (createResponse && createResponse.id) {
                    BidExpertTests.utils.log(`✅ Lote criado: ID ${createResponse.id}`, 'success');
                    BidExpertTests.utils.addResult('Lot Create', true, `ID: ${createResponse.id}`);

                    // READ - Ler o lote criado
                    const readResponse = await BidExpertTests.utils.makeRequest(`/api/lots/${createResponse.id}`);
                    
                    if (readResponse && readResponse.id === createResponse.id) {
                        BidExpertTests.utils.log('✅ Lote lido com sucesso', 'success');
                        BidExpertTests.utils.addResult('Lot Read', true, 'Dados lidos corretamente');
                    } else {
                        BidExpertTests.utils.log('❌ Falha ao ler lote', 'error');
                        BidExpertTests.utils.addResult('Lot Read', false, 'Dados não correspondem');
                    }

                    // UPDATE - Atualizar o lote
                    const updateData = { description: 'Descrição atualizada via teste' };
                    const updateResponse = await BidExpertTests.utils.makeRequest(`/api/lots/${createResponse.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(updateData)
                    });

                    if (updateResponse && updateResponse.description === updateData.description) {
                        BidExpertTests.utils.log('✅ Lote atualizado com sucesso', 'success');
                        BidExpertTests.utils.addResult('Lot Update', true, 'Descrição atualizada');
                    } else {
                        BidExpertTests.utils.log('❌ Falha ao atualizar lote', 'error');
                        BidExpertTests.utils.addResult('Lot Update', false, 'Atualização falhou');
                    }

                    // DELETE - Remover o lote de teste
                    const deleteResponse = await BidExpertTests.utils.makeRequest(`/api/lots/${createResponse.id}`, {
                        method: 'DELETE'
                    });

                    if (deleteResponse && deleteResponse.success) {
                        BidExpertTests.utils.log('✅ Lote removido com sucesso', 'success');
                        BidExpertTests.utils.addResult('Lot Delete', true, 'Lote removido');
                    } else {
                        BidExpertTests.utils.log('❌ Falha ao remover lote', 'error');
                        BidExpertTests.utils.addResult('Lot Delete', false, 'Remoção falhou');
                    }

                } else {
                    BidExpertTests.utils.log('❌ Falha ao criar lote', 'error');
                    BidExpertTests.utils.addResult('Lot Create', false, 'Criação falhou');
                }

            } catch (error) {
                BidExpertTests.utils.log(`❌ Erro no CRUD de lotes: ${error.message}`, 'error');
                BidExpertTests.utils.addResult('Lot CRUD', false, error.message);
            }
        }
    },

    // Testes de ITSM
    itsm: {
        async testTicketCreation() {
            try {
                BidExpertTests.utils.log('Testando criação de tickets ITSM...', 'info');
                
                // CREATE - Criar um ticket de teste
                const testTicket = {
                    title: 'Ticket Teste Browser',
                    description: 'Ticket criado via testes browser',
                    category: 'SUPPORT',
                    priority: 'MEDIUM',
                    status: 'OPEN'
                };

                const createResponse = await BidExpertTests.utils.makeRequest('/api/itsm/tickets', {
                    method: 'POST',
                    body: JSON.stringify(testTicket)
                });

                if (createResponse && createResponse.id) {
                    BidExpertTests.utils.log(`✅ Ticket criado: ID ${createResponse.id}`, 'success');
                    BidExpertTests.utils.addResult('ITSM Ticket Create', true, `ID: ${createResponse.id}`);

                    // READ - Ler o ticket criado
                    const readResponse = await BidExpertTests.utils.makeRequest(`/api/itsm/tickets/${createResponse.id}`);
                    
                    if (readResponse && readResponse.id === createResponse.id) {
                        BidExpertTests.utils.log('✅ Ticket lido com sucesso', 'success');
                        BidExpertTests.utils.addResult('ITSM Ticket Read', true, 'Dados lidos corretamente');
                    } else {
                        BidExpertTests.utils.log('❌ Falha ao ler ticket', 'error');
                        BidExpertTests.utils.addResult('ITSM Ticket Read', false, 'Dados não correspondem');
                    }

                    // UPDATE - Atualizar o ticket
                    const updateData = { status: 'IN_PROGRESS' };
                    const updateResponse = await BidExpertTests.utils.makeRequest(`/api/itsm/tickets/${createResponse.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(updateData)
                    });

                    if (updateResponse && updateResponse.status === updateData.status) {
                        BidExpertTests.utils.log('✅ Ticket atualizado com sucesso', 'success');
                        BidExpertTests.utils.addResult('ITSM Ticket Update', true, 'Status atualizado');
                    } else {
                        BidExpertTests.utils.log('❌ Falha ao atualizar ticket', 'error');
                        BidExpertTests.utils.addResult('ITSM Ticket Update', false, 'Atualização falhou');
                    }

                    // DELETE - Remover o ticket de teste
                    const deleteResponse = await BidExpertTests.utils.makeRequest(`/api/itsm/tickets/${createResponse.id}`, {
                        method: 'DELETE'
                    });

                    if (deleteResponse && deleteResponse.success) {
                        BidExpertTests.utils.log('✅ Ticket removido com sucesso', 'success');
                        BidExpertTests.utils.addResult('ITSM Ticket Delete', true, 'Ticket removido');
                    } else {
                        BidExpertTests.utils.log('❌ Falha ao remover ticket', 'error');
                        BidExpertTests.utils.addResult('ITSM Ticket Delete', false, 'Remoção falhou');
                    }

                } else {
                    BidExpertTests.utils.log('❌ Falha ao criar ticket', 'error');
                    BidExpertTests.utils.addResult('ITSM Ticket Create', false, 'Criação falhou');
                }

            } catch (error) {
                BidExpertTests.utils.log(`❌ Erro nos testes ITSM: ${error.message}`, 'error');
                BidExpertTests.utils.addResult('ITSM Ticket CRUD', false, error.message);
            }
        }
    },

    // Executor principal
    async runAllTests() {
        BidExpertTests.utils.log('🚀 Iniciando suíte de testes BidExpert via Browser', 'info');
        BidExpertTests.utils.log('=====================================', 'info');
        
        // Limpar resultados anteriores
        this.config.testResults = [];
        
        try {
            // Testes de Multi-Tenant
            await this.multiTenant.testTenantIsolation();
            await this.multiTenant.testUserDataAccess();
            
            // Testes de CRUD
            await this.crud.testAuctionCRUD();
            await this.crud.testLotCRUD();
            
            // Testes ITSM
            await this.itsm.testTicketCreation();
            
            // Exibir resumo final
            this.showResults();
            
        } catch (error) {
            BidExpertTests.utils.log(`❌ Erro geral na execução: ${error.message}`, 'error');
        }
    },

    showResults() {
        const results = this.config.testResults;
        const passed = results.filter(r => r.passed).length;
        const failed = results.filter(r => !r.passed).length;
        const total = results.length;
        
        BidExpertTests.utils.log('=====================================', 'info');
        BidExpertTests.utils.log('📊 RESUMO FINAL DOS TESTES', 'info');
        BidExpertTests.utils.log('=====================================', 'info');
        BidExpertTests.utils.log(`📈 Total: ${total} testes`, 'info');
        BidExpertTests.utils.log(`✅ Passou: ${passed}`, passed === total ? 'success' : 'info');
        BidExpertTests.utils.log(`❌ Falhou: ${failed}`, failed > 0 ? 'error' : 'info');
        BidExpertTests.utils.log(`📊 Taxa de sucesso: ${Math.round((passed / total) * 100)}%`, 'info');
        BidExpertTests.utils.log('=====================================', 'info');
        
        // Detalhes dos testes
        results.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            const color = result.passed ? '#4CAF50' : '#F44336';
            console.log(`%c${status} ${result.test}: ${result.details}`, `color: ${color}; font-weight: bold;`);
        });
        
        // Salvar resultados no localStorage
        localStorage.setItem('bidexpert-test-results', JSON.stringify({
            timestamp: new Date().toISOString(),
            results: results,
            summary: { total, passed, failed, successRate: Math.round((passed / total) * 100) }
        }));
        
        BidExpertTests.utils.log('💾 Resultados salvos no localStorage (bidexpert-test-results)', 'info');
    }
};

// Auto-execução
BidExpertTests.utils.log('🎯 Script de testes BidExpert carregado!', 'success');
BidExpertTests.utils.log('Execute: BidExpertTests.runAllTests() para iniciar todos os testes', 'info');
BidExpertTests.utils.log('Ou execute testes individuais:', 'info');
BidExpertTests.utils.log('  - BidExpertTests.multiTenant.testTenantIsolation()', 'info');
BidExpertTests.utils.log('  - BidExpertTests.crud.testAuctionCRUD()', 'info');
BidExpertTests.utils.log('  - BidExpertTests.itsm.testTicketCreation()', 'info');

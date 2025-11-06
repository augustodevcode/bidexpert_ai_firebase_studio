 1. Usar apenas `actions` e `services`: Nenhuma chamada direta ao Prisma ou DML SQL será usada.
   2. Criar cenários realistas: Os dados serão interligados para refletir os fluxos descritos nos arquivos REGRAS_NEGOCIO_CONSOLIDADO.md e TESTING_SCENARIOS.md.
   3. Cobrir todo o escopo: Vou criar um conjunto de dados rico, com foco especial em leilões judiciais, loteamentos, lances, arremates e pagamentos.
4. obrigatoriamente o id do tenant lordland precisa ser 1 e todas as fks que referenciam a pk da tabela tanant precisam usar esse número 1 como fk. 

  O script executará as seguintes etapas em ordem:
   1. Limpeza do banco de dados.
   2. Criação do Tenant e Configurações da Plataforma.
   3. Criação de Usuários com diferentes perfis (Admin, Leiloeiro, Comitente, Arrematante).
   4. Criação das entidades judiciais e de localização (Tribunais, Comarcas, Varas, etc.).
   5. Criação de Comitentes e Leiloeiros, vinculando-os aos usuários e entidades judiciais.
   6. Criação de Categorias e Subcategorias de lotes.
   7. Criação de Processos Judiciais e Ativos (Bens) de diversos tipos.
   8. Criação de Leilões (judiciais e extrajudiciais) com suas Etapas.
   9. Criação de Lotes, associando-os aos leilões e vinculando os ativos.
   10. Simulação de Habilitação de usuários e Lances (normais e máximos).
   11. Simulação de Arremates e geração de Pagamentos Parcelados.
   12. Criação de dados adicionais como Perguntas, Avaliações e Notificações.
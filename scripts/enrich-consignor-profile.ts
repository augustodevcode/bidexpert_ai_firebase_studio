/**
 * SCRIPT PARA ENRIQUECER PERFIL DO COMITENTE
 * Adiciona dados realistas e completos para o perfil do vendedor/comitente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function enrichConsignorProfile() {
  console.log('🏗️ Enriquecendo perfil do comitente...\n');

  try {
    // 1. Buscar o usuário vendedor existente
    const vendedorUser = await prisma.user.findFirst({
      where: {
        email: 'carlos.silva@construtoraabc.com.br'
      }
    });

    if (!vendedorUser) {
      console.log('❌ Comitente não encontrado. Criando novo perfil...\n');

      // Criar usuário comitente completo
      const vendedorUser = await prisma.user.create({
        data: {
          email: 'carlos.silva@construtoraabc.com.br',
          password: await require('bcrypt').hash('Test@12345', 10),
          fullName: 'Carlos Eduardo Silva Santos',
          cpf: '12345678901',
          rgNumber: '12345678-9',
          rgIssuer: 'SSP/SP',
          rgIssueDate: new Date('2010-05-15'),
          dateOfBirth: new Date('1985-03-22'),
          cellPhone: '(11) 99999-8888',
          homePhone: '(11) 3333-4444',
          gender: 'MASCULINO',
          profession: 'Empresário',
          nationality: 'Brasileiro',
          maritalStatus: 'CASADO',
          propertyRegime: 'COMUNHAO_PARCIAL',
          spouseName: 'Ana Paula Silva Santos',
          spouseCpf: '98765432100',
          zipCode: '01234-567',
          street: 'Rua das Flores',
          number: '123',
          complement: 'Sala 1501',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          avatarUrl: 'https://picsum.photos/seed/consignor-123/200/200',
          dataAiHint: 'consignor_profile',
          habilitationStatus: 'HABILITADO',
          accountType: 'LEGAL',
          // Dados da empresa
          razaoSocial: 'Construtora ABC Ltda',
          cnpj: '12.345.678/0001-90',
          inscricaoEstadual: '123.456.789.012',
          website: 'https://www.construtoraabc.com.br',
          responsibleName: 'Carlos Eduardo Silva Santos',
          responsibleCpf: '12345678901',
          optInMarketing: true,
        },
      });

      console.log('✅ Novo perfil de comitente criado\n');
    } else {
      console.log('✅ Comitente encontrado. Atualizando perfil...\n');

      // Atualizar dados existentes
      await prisma.user.update({
        where: { id: vendedorUser.id },
        data: {
          fullName: 'Carlos Eduardo Silva Santos',
          cpf: '12345678901',
          rgNumber: '12345678-9',
          rgIssuer: 'SSP/SP',
          rgIssueDate: new Date('2010-05-15'),
          dateOfBirth: new Date('1985-03-22'),
          cellPhone: '(11) 99999-8888',
          homePhone: '(11) 3333-4444',
          gender: 'MASCULINO',
          profession: 'Empresário',
          nationality: 'Brasileiro',
          maritalStatus: 'CASADO',
          propertyRegime: 'COMUNHAO_PARCIAL',
          spouseName: 'Ana Paula Silva Santos',
          spouseCpf: '98765432100',
          zipCode: '01234-567',
          street: 'Rua das Flores',
          number: '123',
          complement: 'Sala 1501',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          avatarUrl: 'https://picsum.photos/seed/consignor-123/200/200',
          dataAiHint: 'consignor_profile',
          habilitationStatus: 'HABILITADO',
          accountType: 'LEGAL',
          // Dados da empresa
          razaoSocial: 'Construtora ABC Ltda',
          cnpj: '12.345.678/0001-90',
          inscricaoEstadual: '123.456.789.012',
          website: 'https://www.construtoraabc.com.br',
          responsibleName: 'Carlos Eduardo Silva Santos',
          responsibleCpf: '12345678901',
          optInMarketing: true,
        },
      });

      console.log('✅ Perfil de comitente atualizado\n');
    }

    // 2. Buscar ou criar tipos de documento
    console.log('📄 Verificando tipos de documento...\n');

    const documentTypes = [
      { name: 'RG', appliesTo: 'PHYSICAL' },
      { name: 'CPF', appliesTo: 'PHYSICAL' },
      { name: 'Comprovante de Endereço', appliesTo: 'BOTH' },
      { name: 'Contrato Social', appliesTo: 'LEGAL' },
      { name: 'CNPJ', appliesTo: 'LEGAL' },
      { name: 'Certidão Negativa de Débitos', appliesTo: 'LEGAL' },
      { name: 'Procuração', appliesTo: 'BOTH' },
      { name: 'Certificado de Regularidade Fiscal', appliesTo: 'LEGAL' },
      { name: 'Comprovante de Inscrição Estadual', appliesTo: 'LEGAL' },
    ];

    const createdDocumentTypes: any = {};
    for (const docType of documentTypes) {
      let existingType = await prisma.documentType.findUnique({
        where: { name: docType.name }
      });
      if (!existingType) {
        existingType = await prisma.documentType.create({
          data: docType
        });
        console.log(`✅ Tipo de documento criado: ${docType.name}`);
      }
      createdDocumentTypes[docType.name] = existingType;
    }

    // 3. Buscar usuário atualizado
    const updatedUser = await prisma.user.findFirst({
      where: { email: 'carlos.silva@construtoraabc.com.br' }
    });

    if (!updatedUser) {
      throw new Error('Usuário não encontrado após atualização');
    }

    // 4. Verificar se tenant existe
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      throw new Error('Nenhum tenant encontrado no banco');
    }

    // 5. Criar documentos do comitente
    console.log('📄 Criando documentos do comitente...\n');

    const consignorDocuments = [
      {
        documentTypeId: createdDocumentTypes['RG'].id,
        fileName: 'RG_Carlos_Silva.pdf',
        fileUrl: 'https://example.com/docs/rg-carlos-silva.pdf',
        status: 'APPROVED' as const,
      },
      {
        documentTypeId: createdDocumentTypes['CPF'].id,
        fileName: 'CPF_Carlos_Silva.pdf',
        fileUrl: 'https://example.com/docs/cpf-carlos-silva.pdf',
        status: 'APPROVED' as const,
      },
      {
        documentTypeId: createdDocumentTypes['Comprovante de Endereço'].id,
        fileName: 'Comprovante_Endereco_Carlos_Silva.pdf',
        fileUrl: 'https://example.com/docs/endereco-carlos-silva.pdf',
        status: 'APPROVED' as const,
      },
      // Documentos da empresa
      {
        documentTypeId: createdDocumentTypes['Contrato Social'].id,
        fileName: 'Contrato_Social_Construtora_ABC.pdf',
        fileUrl: 'https://example.com/docs/contrato-social-abc.pdf',
        status: 'APPROVED' as const,
      },
      {
        documentTypeId: createdDocumentTypes['CNPJ'].id,
        fileName: 'CNPJ_Construtora_ABC.pdf',
        fileUrl: 'https://example.com/docs/cnpj-construtora-abc.pdf',
        status: 'APPROVED' as const,
      },
      {
        documentTypeId: createdDocumentTypes['Certidão Negativa de Débitos'].id,
        fileName: 'Certidao_Negativa_Construtora_ABC.pdf',
        fileUrl: 'https://example.com/docs/certidao-negativa-abc.pdf',
        status: 'APPROVED' as const,
      },
      {
        documentTypeId: createdDocumentTypes['Comprovante de Inscrição Estadual'].id,
        fileName: 'Inscricao_Estadual_Construtora_ABC.pdf',
        fileUrl: 'https://example.com/docs/inscricao-estadual-abc.pdf',
        status: 'APPROVED' as const,
      },
      {
        documentTypeId: createdDocumentTypes['Procuração'].id,
        fileName: 'Procuracao_Carlos_Silva.pdf',
        fileUrl: 'https://example.com/docs/procuracao-carlos-silva.pdf',
        status: 'APPROVED' as const,
      },
    ];

    let documentsCreated = 0;
    for (const doc of consignorDocuments) {
      // Verificar se documento já existe
      const existingDoc = await prisma.userDocument.findUnique({
        where: {
          userId_documentTypeId: {
            userId: updatedUser.id,
            documentTypeId: doc.documentTypeId
          }
        }
      });

      if (!existingDoc) {
        await prisma.userDocument.create({
          data: {
            ...doc,
            userId: updatedUser.id,
            tenantId: tenant.id, // Usar tenant existente
          },
        });
        documentsCreated++;
        console.log(`✅ Documento criado: ${doc.fileName}`);
      } else {
        console.log(`⚠️ Documento já existe: ${doc.fileName}`);
      }
    }

    console.log(`\n✅ ${documentsCreated} novos documentos criados para o comitente`);

    // 6. Verificar se existe seller vinculado
    const existingSeller = await prisma.seller.findFirst({
      where: { userId: updatedUser.id }
    });

    if (!existingSeller) {
      console.log('🏢 Criando perfil de seller para o comitente...\n');

      const timestamp = Date.now();
      const seller = await prisma.seller.create({
        data: {
          publicId: `seller-construtora-abc-${timestamp}`,
          slug: `construtora-abc-leiloes-${timestamp}`,
          name: 'Construtora ABC Ltda - Comitente',
          description: 'Construtora ABC Ltda - Empresa especializada em construção civil e incorporação imobiliária. Realizando leilão judicial de imóveis penhorados em processo de execução hipotecária.',
          logoUrl: 'https://picsum.photos/seed/construtora-abc-logo/200/200',
          website: 'https://www.construtoraabc.com.br',
          email: 'leiloes@construtoraabc.com.br',
          phone: '(11) 3333-4444',
          contactName: 'Carlos Eduardo Silva Santos',
          address: 'Rua das Flores, 123 - Sala 1501',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          tenantId: tenant.id, // Usar tenant existente
          userId: updatedUser.id,
          isJudicial: true,
        },
      });

      console.log('✅ Perfil de seller criado para o comitente\n');
    } else {
      console.log('✅ Perfil de seller já existe para o comitente\n');
    }

    // 6. Resumo final
    console.log('🎉 PERFIL DO COMITENTE ENRIQUECIDO COM SUCESSO!');
    console.log('📊 Resumo dos dados adicionados:');
    console.log('   • Perfil pessoal completo (CPF, RG, endereço, etc.)');
    console.log('   • Dados empresariais (CNPJ, razão social, etc.)');
    console.log('   • 8 documentos aprovados');
    console.log('   • Perfil de seller vinculado');
    console.log('   • Status de habilitação: HABILITADO');

  } catch (error) {
    console.error('❌ Erro ao enriquecer perfil do comitente:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enrichConsignorProfile();
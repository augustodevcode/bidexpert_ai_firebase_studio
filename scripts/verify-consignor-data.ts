/**
 * SCRIPT PARA VERIFICAR DADOS DO COMITENTE
 * Verifica se o perfil do comitente foi enriquecido corretamente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyConsignorData() {
  console.log('🔍 Verificando dados do comitente...\n');

  try {
    // 1. Buscar usuário comitente
    const user = await prisma.user.findFirst({
      where: { email: 'carlos.silva@construtoraabc.com.br' },
      include: {
        documents: {
          include: {
            documentType: true
          }
        },
        sellers: true
      }
    });

    if (!user) {
      console.log('❌ Comitente não encontrado!');
      return;
    }

    console.log('👤 DADOS DO COMITENTE:');
    console.log(`   Nome: ${user.fullName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   CPF: ${user.cpf}`);
    console.log(`   RG: ${user.rgNumber} - ${user.rgIssuer}`);
    console.log(`   Empresa: ${user.razaoSocial}`);
    console.log(`   CNPJ: ${user.cnpj}`);
    console.log(`   Status: ${user.habilitationStatus}`);
    console.log(`   Tipo: ${user.accountType}`);
    console.log('');

    // 2. Documentos
    console.log('📄 DOCUMENTOS:');
    if (user.documents.length === 0) {
      console.log('   Nenhum documento encontrado');
    } else {
      user.documents.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.documentType.name} - ${doc.status} (${doc.fileName})`);
      });
    }
    console.log('');

    // 3. Seller
    console.log('🏢 PERFIL SELLER:');
    const seller = await prisma.seller.findFirst({
      where: { userId: user.id }
    });

    if (!seller) {
      console.log('   Nenhum perfil seller encontrado');
    } else {
      console.log(`   Nome: ${seller.name}`);
      console.log(`   Slug: ${seller.slug}`);
      console.log(`   Email: ${seller.email}`);
      console.log(`   Judicial: ${seller.isJudicial ? 'Sim' : 'Não'}`);
      console.log(`   Descrição: ${seller.description?.substring(0, 100)}...`);
    }

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyConsignorData();
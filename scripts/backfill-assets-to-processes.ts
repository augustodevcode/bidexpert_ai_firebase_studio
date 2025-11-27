/**
 * Script para adicionar assets a TODOS os processos sem bens vinculados
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏛️  Vinculando assets a processos sem bens...\n');

  // Helper: Gerar dados realistas de assets
  const assetTypes = {
    IMOVEL: [
      { title: 'Sala Comercial', description: 'Sala comercial bem localizada, com infraestrutura completa' },
      { title: 'Apartamento Residencial', description: 'Apartamento de 2 quartos, com garagem e área de lazer' },
      { title: 'Casa Térrea', description: 'Casa térrea com 3 quartos, quintal e churrasqueira' },
      { title: 'Galpão Industrial', description: 'Galpão com pé direito alto, ideal para logística e armazenagem' },
      { title: 'Terreno Urbano', description: 'Terreno plano em área urbana, pronto para construção' },
      { title: 'Sobrado Residencial', description: 'Sobrado com 4 quartos e 2 vagas de garagem' },
      { title: 'Loja Comercial', description: 'Loja em área movimentada, com vitrine frontal' },
    ],
    VEICULO: [
      { title: 'Automóvel Sedan', description: 'Veículo sedan em bom estado de conservação' },
      { title: 'Caminhonete Pick-up', description: 'Caminhonete para trabalho e transporte de cargas' },
      { title: 'Motocicleta', description: 'Motocicleta em excelente estado, baixa quilometragem' },
      { title: 'Van de Passageiros', description: 'Van para transporte de passageiros' },
      { title: 'Caminhão Baú', description: 'Caminhão baú para transporte de mercadorias' },
    ],
    MAQUINARIO: [
      { title: 'Torno Mecânico', description: 'Torno mecânico industrial em perfeito funcionamento' },
      { title: 'Empilhadeira', description: 'Empilhadeira elétrica, capacidade 2 toneladas' },
      { title: 'Fresadora CNC', description: 'Fresadora CNC de alta precisão' },
      { title: 'Prensa Hidráulica', description: 'Prensa hidráulica industrial' },
    ],
    MOBILIARIO: [
      { title: 'Conjunto de Mesas e Cadeiras', description: 'Mobiliário de escritório em bom estado' },
      { title: 'Equipamentos de TI', description: 'Computadores, monitores e periféricos' },
      { title: 'Estantes e Armários', description: 'Mobiliário para armazenamento' },
    ],
  };

  const statusOptions: ('DISPONIVEL' | 'CADASTRO' | 'LOTEADO')[] = ['DISPONIVEL', 'CADASTRO', 'LOTEADO'];

  // 1. Buscar processos sem assets (apenas com tenantId válido)
  const processosSemAssets = await prisma.judicialProcess.findMany({
    where: {
      assets: {
        none: {},
      },
    },
    select: {
      id: true,
      processNumber: true,
      sellerId: true,
      tenantId: true,
    },
  });
  
  // Filtrar apenas processos com tenantId válido
  const processosValidos = processosSemAssets.filter(p => p.tenantId !== null);

  console.log(`📊 Encontrados ${processosSemAssets.length} processos sem assets`);
  console.log(`   Processos válidos (com tenantId): ${processosValidos.length}\n`);

  if (processosValidos.length === 0) {
    console.log('✅ Todos os processos válidos já possuem assets vinculados!\n');
    return;
  }

  let totalAssetsCreated = 0;
  const timestamp = Date.now();

  // 2. Criar assets para cada processo
  for (const processo of processosValidos) {
    // Cada processo terá 1-3 assets
    const assetCount = 1 + Math.floor(Math.random() * 3);
    const availableTypes = Object.keys(assetTypes) as (keyof typeof assetTypes)[];
    
    for (let i = 0; i < assetCount; i++) {
      const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      const assetTemplates = assetTypes[type];
      const template = assetTemplates[Math.floor(Math.random() * assetTemplates.length)];
      
      try {
        await prisma.asset.create({
          data: {
            publicId: `asset-backfill-${timestamp}-${processo.id}-${i}`,
            title: template.title,
            description: `${template.description}. Bem vinculado ao processo judicial ${processo.processNumber}`,
            status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
            judicialProcessId: processo.id,
            sellerId: processo.sellerId || undefined,
            evaluationValue: new Prisma.Decimal((30000 + Math.random() * 400000).toFixed(2)),
            tenantId: processo.tenantId,
            dataAiHint: type,
          },
        });
        
        totalAssetsCreated++;
      } catch (error) {
        console.log(`⚠️  Erro ao criar asset para processo ${processo.processNumber}: ${(error as any).message}`);
      }
    }
    
    if (totalAssetsCreated % 10 === 0) {
      console.log(`   Progresso: ${totalAssetsCreated} assets criados...`);
    }
  }

  console.log(`\n✅ Total de assets criados: ${totalAssetsCreated}`);
  console.log(`   Para: ${processosValidos.length} processos\n`);

  // 3. Verificar resultado
  const processosSemAssetsAgora = await prisma.judicialProcess.count({
    where: {
      assets: {
        none: {},
      },
    },
  });

  const totalProcessos = await prisma.judicialProcess.count();
  const totalAssets = await prisma.asset.count();

  console.log('\n📊 RESULTADO FINAL:');
  console.log(`   • Total de Processos: ${totalProcessos}`);
  console.log(`   • Total de Assets: ${totalAssets}`);
  console.log(`   • Processos sem assets: ${processosSemAssetsAgora}`);
  console.log(`   • Cobertura: ${(((totalProcessos - processosSemAssetsAgora) / totalProcessos) * 100).toFixed(1)}%\n`);

  if (processosSemAssetsAgora === 0) {
    console.log('🎉 SUCESSO! Todos os processos agora possuem bens vinculados!\n');
  } else {
    console.log(`⚠️  Ainda existem ${processosSemAssetsAgora} processos sem assets.\n`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

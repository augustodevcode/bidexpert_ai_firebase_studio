/**
 * Script to create Maringá city in Paraná state
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating Maringá city...');
  
  // Find Paraná state
  const estadoPR = await prisma.state.findFirst({
    where: { uf: 'PR' }
  });
  
  if (!estadoPR) {
    console.error('Estado Paraná não encontrado!');
    console.log('Criando estado Paraná...');
    const newState = await prisma.state.create({
      data: {
        name: 'Paraná',
        uf: 'PR',
        slug: 'parana'
      }
    });
    console.log('Estado Paraná criado:', newState);
  }
  
  const state = await prisma.state.findFirst({
    where: { uf: 'PR' }
  });
  
  if (!state) {
    throw new Error('Failed to create/find Paraná state');
  }
  
  // Check if city already exists
  const existingCity = await prisma.city.findFirst({
    where: {
      name: 'Maringá',
      stateId: state.id
    }
  });
  
  if (existingCity) {
    console.log('Cidade Maringá já existe:', existingCity);
    return existingCity;
  }
  
  // Create Maringá
  const maringa = await prisma.city.create({
    data: {
      name: 'Maringá',
      stateId: state.id,
      ibgeCode: '4115200'
    }
  });
  
  console.log('Cidade Maringá criada com sucesso:', maringa);
  return maringa;
}

main()
  .catch(e => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

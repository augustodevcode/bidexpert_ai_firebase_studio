import { PrismaClient, AssetStatus } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Configuração do Faker
faker.seed(123);

// Dados de exemplo
const vehicleMakes = ['Toyota', 'Volkswagen', 'Fiat', 'Chevrolet', 'Hyundai'];
const vehicleModels = ['Corolla', 'Gol', 'Uno', 'Onix', 'HB20'];
const propertyTypes = ['Casa', 'Apartamento', 'Sobrado', 'Terreno', 'Sala Comercial'];

// Gerar um veículo simples
function generateVehicle() {
  const make = faker.helpers.arrayElement(vehicleMakes);
  const model = faker.helpers.arrayElement(vehicleModels);
  const year = faker.number.int({ min: 2015, max: 2023 });
  
  return {
    title: `${make} ${model} ${year}`,
    description: `${make} ${model} ${year}, ${faker.vehicle.color()}, ${faker.number.int({ min: 10000, max: 100000 })} km`,
    type: 'VEHICLE',
    plate: `${faker.string.alpha(3).toUpperCase()}${faker.number.int({ min: 1000, max: 9999 })}`,
    make,
    model,
    year,
    color: faker.vehicle.color(),
    mileage: faker.number.int({ min: 1000, max: 100000 }),
    fuelType: faker.helpers.arrayElement(['GASOLINA', 'ETANOL', 'FLEX', 'DIESEL', 'ELETRICO']),
    transmissionType: faker.helpers.arrayElement(['MANUAL', 'AUTOMATICO', 'AUTOMATIZADO', 'CVT']),
  };
}

// Gerar um imóvel simples
function generateProperty() {
  const type = faker.helpers.arrayElement(propertyTypes);
  const city = faker.location.city();
  
  return {
    title: `${type} em ${city}`,
    description: `${type} em ${city} com ${faker.number.int({ min: 1, max: 5 })} quartos e ${faker.number.int({ min: 1, max: 4 })} banheiros`,
    type: 'PROPERTY',
    bedrooms: faker.number.int({ min: 1, max: 5 }),
    bathrooms: faker.number.int({ min: 1, max: 4 }),
    area: faker.number.int({ min: 50, max: 500 }),
    hasGarage: faker.datatype.boolean(),
  };
}

async function seedMinimal() {
  console.log('🚀 Iniciando seed mínimo...');
  
  try {
    // Verifica se já existem ativos
    const existingAssets = await prisma.asset.count();
    if (existingAssets > 0) {
      console.log(`✅ Já existem ${existingAssets} ativos no banco de dados.`);
      return;
    }

    // Obtém o primeiro tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      throw new Error('Nenhum tenant encontrado. É necessário ter pelo menos um tenant para criar ativos.');
    }

    // Obtém a primeira categoria
    const category = await prisma.lotCategory.findFirst();
    if (!category) {
      throw new Error('Nenhuma categoria encontrada. É necessário ter pelo menos uma categoria para criar ativos.');
    }

    // Cria 5 ativos de exemplo (3 veículos e 2 imóveis)
    console.log('\nCriando ativos de exemplo...');
    
    // 3 veículos
    for (let i = 0; i < 3; i++) {
      const vehicle = generateVehicle();
      await prisma.asset.create({
        data: {
          publicId: `VEH-${uuidv4()}`,
          title: vehicle.title,
          description: vehicle.description,
          status: 'DISPONIVEL',
          imageUrl: `https://picsum.photos/seed/vehicle-${i}/800/600`,
          // Campos específicos de veículo
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          mileage: vehicle.mileage,
          fuelType: vehicle.fuelType,
          transmissionType: vehicle.transmissionType,
          plate: vehicle.plate,
          tenantId: tenant.id,
          categoryId: category.id,
        },
      });
      console.log(`✅ Veículo criado: ${vehicle.title}`);
    }

    // 2 imóveis
    for (let i = 0; i < 2; i++) {
      const property = generateProperty();
      await prisma.asset.create({
        data: {
          publicId: `PROP-${uuidv4()}`,
          title: property.title,
          description: property.description,
          status: 'DISPONIVEL',
          imageUrl: `https://picsum.photos/seed/property-${i}/800/600`,
          // Campos específicos de imóvel
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          totalArea: new Decimal(property.area),
          builtArea: new Decimal(property.area * 0.9), // 90% de área construída
          // hasGarage não está definido no modelo
          tenantId: tenant.id,
          categoryId: category.id,
        },
      });
      console.log(`✅ Imóvel criado: ${property.title}`);
    }

    console.log('\n✨ Seed mínimo concluído com sucesso!');
    console.log('✅ Total de ativos criados: 5 (3 veículos e 2 imóveis)');
    
  } catch (error) {
    console.error('❌ Erro durante o seed mínimo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executa o seed
seedMinimal()
  .then(() => {
    console.log('✅ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro durante o processo:', error);
    process.exit(1);
  });

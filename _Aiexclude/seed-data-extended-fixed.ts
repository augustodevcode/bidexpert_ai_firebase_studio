import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Configuração do Faker
faker.seed(123);

// Tipos de veículos
const vehicleMakes = [
  'Fiat', 'Volkswagen', 'Chevrolet', 'Hyundai', 'Toyota',
  'Jeep', 'Renault', 'Honda', 'Nissan', 'Ford'
];

const vehicleModels = [
  'Uno', 'Gol', 'Onix', 'HB20', 'Corolla',
  'Compass', 'Kwid', 'Civic', 'Kicks', 'Ranger'
];

// Tipos de imóveis
const propertyTypes = [
  'Casa', 'Apartamento', 'Sobrado', 'Cobertura', 'Terreno',
  'Sala Comercial', 'Galpão', 'Fazenda', 'Sítio', 'Chácara'
];

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
  };
}

// Função principal
async function main() {
  console.log('🚀 Iniciando seed de dados estendidos...');
  
  try {
    // 1. Limpar dados existentes
    console.log('🧹 Limpando dados existentes...');
    await prisma.asset.deleteMany({});
    
    // 2. Criar veículos
    console.log('🚗 Criando veículos...');
    const vehicles = [];
    for (let i = 0; i < 5; i++) {
      const vehicle = await prisma.asset.create({
        data: generateVehicle(),
      });
      vehicles.push(vehicle);
      console.log(`   ✅ Veículo criado: ${vehicle.title}`);
    }
    
    // 3. Criar imóveis
    console.log('🏠 Criando imóveis...');
    const properties = [];
    for (let i = 0; i < 5; i++) {
      const property = await prisma.asset.create({
        data: generateProperty(),
      });
      properties.push(property);
      console.log(`   ✅ Imóvel criado: ${property.title}`);
    }
    
    console.log('✨ Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

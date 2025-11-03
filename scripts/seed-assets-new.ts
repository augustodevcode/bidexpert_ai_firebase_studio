import { PrismaClient, Prisma, AssetStatus } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Configuração do Faker
faker.seed(123);

// Tipos de veículos para gerar dados realistas
const vehicleTypes = [
  { make: 'Toyota', models: ['Corolla', 'Hilux', 'RAV4', 'SW4'] },
  { make: 'Volkswagen', models: ['Gol', 'Polo', 'T-Cross', 'Nivus'] },
  { make: 'Fiat', models: ['Uno', 'Mobi', 'Argo', 'Pulse'] },
  { make: 'Chevrolet', models: ['Onix', 'Tracker', 'S10', 'Onix Plus'] },
  { make: 'Hyundai', models: ['HB20', 'Creta', 'HB20S', 'Tucson'] },
];

// Cores de veículos
const colors = [
  'Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho',
  'Azul', 'Verde', 'Amarelo', 'Laranja', 'Marrom'
];

// Tipos de combustível
const fuelTypes = ['Gasolina', 'Álcool', 'Flex', 'Diesel', 'Híbrido', 'Elétrico'];

// Tipos de transmissão
const transmissionTypes = ['Manual', 'Automático', 'Automático Sequencial', 'CVT'];

// Tipos de carroceria
const bodyTypes = [
  'Sedan', 'Hatch', 'SUV', 'Picape', 'Utilitário',
  'Esportivo', 'Minivan', 'Van', 'Cupê', 'Conversível'
];

// Gerar um veículo aleatório
function generateRandomVehicle() {
  const vehicleType = faker.helpers.arrayElement(vehicleTypes);
  const model = faker.helpers.arrayElement(vehicleType.models);
  const year = faker.number.int({ min: 2010, max: 2023 });
  
  return {
    plate: `${faker.string.alpha(3).toUpperCase()}${faker.number.int({ min: 1000, max: 9999 })}`,
    make: vehicleType.make,
    model,
    version: faker.helpers.arrayElement(['Basic', 'Comfort', 'Sport', 'Premium']),
    year,
    modelYear: year,
    mileage: faker.number.int({ min: 0, max: 100000 }),
    color: faker.helpers.arrayElement(colors),
    fuelType: faker.helpers.arrayElement(fuelTypes),
    transmissionType: faker.helpers.arrayElement(transmissionTypes),
    bodyType: faker.helpers.arrayElement(bodyTypes),
    vin: faker.vehicle.vin(),
    renavam: faker.string.numeric(11),
    enginePower: `${faker.number.int({ min: 80, max: 500 })}cv`,
    numberOfDoors: faker.helpers.arrayElement([2, 4]),
    vehicleOptions: faker.helpers.arrayElements([
      'Ar Condicionado', 'Direção Hidráulica', 'Vidros Elétricos', 'Trava Elétrica',
      'Airbag', 'ABS', 'Alarme', 'Som', 'Sensor de Estacionamento', 'Câmera de Ré'
    ], { min: 3, max: 10 }).join(', '),
    runningCondition: faker.helpers.arrayElement(['Excelente', 'Bom', 'Regular', 'Ruim']),
    bodyCondition: faker.helpers.arrayElement(['Excelente', 'Bom', 'Regular', 'Ruim']),
    tiresCondition: faker.helpers.arrayElement(['Novo', 'Bom', 'Regular', 'Precisa trocar']),
    hasKey: faker.datatype.boolean(),
  };
}

// Gerar um imóvel aleatório
function generateRandomProperty() {
  const propertyTypes = [
    'Casa', 'Apartamento', 'Sobrado', 'Cobertura', 'Terreno', 'Sala Comercial', 'Galpão'
  ];
  
  const propertyType = faker.helpers.arrayElement(propertyTypes);
  const totalArea = new Decimal(faker.number.float({ min: 50, max: 1000, multipleOf: 0.01 }));
  const builtArea = new Decimal(faker.number.float({ 
    min: 25, 
    max: 900, 
    multipleOf: 0.01 
  }));

  return {
    propertyRegistrationNumber: `R${faker.string.numeric(9)}`,
    iptuNumber: `IPTU${faker.string.numeric(10)}`,
    isOccupied: faker.datatype.boolean(),
    totalArea,
    builtArea,
    bedrooms: faker.number.int({ min: 1, max: 6 }),
    suites: faker.number.int({ min: 0, max: 3 }),
    bathrooms: faker.number.int({ min: 1, max: 4 }),
    parkingSpaces: faker.number.int({ min: 0, max: 4 }),
    constructionType: faker.helpers.arrayElement(['Alvenaria', 'Madeira', 'Mista', 'Pré-moldada']),
    finishes: faker.helpers.arrayElements([
      'Piso cerâmico', 'Porcelanato', 'Piso laminado', 'Pintura látex',
      'Revestimento em gesso', 'Marmoraria', 'Cozinha planejada', 'Armários embutidos'
    ], { min: 3, max: 8 }).join(', '),
    infrastructure: faker.helpers.arrayElements([
      'Rede de água', 'Rede de esgoto', 'Rede elétrica', 'Rede de gás',
      'Rede de telefonia', 'Internet', 'TV a cabo', 'Coleta de lixo'
    ], { min: 3, max: 8 }).join(', '),
    condoDetails: faker.datatype.boolean() ? `Condomínio ${faker.company.name()}` : null,
    improvements: faker.helpers.arrayElements([
      'Piscina', 'Churrasqueira', 'Área de lazer', 'Salão de festas',
      'Quadra esportiva', 'Playground', 'Academia', 'Jardim', 'Varanda gourmet'
    ], { min: 1, max: 5 }).join(', '),
    topography: faker.helpers.arrayElement(['Plano', 'Leve declive', 'Aclive', 'Irregular']),
    hasHabiteSe: faker.datatype.boolean(),
    zoningRestrictions: faker.datatype.boolean() ? 'Zona residencial' : null,
  };
}

// Gerar um ativo aleatório
function generateRandomAsset(index: number) {
  // Removido para controlar a geração de veículos/imóveis no loop principal
  const title = isVehicle 
    ? `${faker.vehicle.manufacturer()} ${faker.vehicle.model()}`
    : faker.helpers.arrayElement([
        `Casa em ${faker.location.city()}`,
        `Apartamento em ${faker.location.city()}`,
        `Terreno em ${faker.location.city()}`,
        `Sala Comercial em ${faker.location.city()}`
      ]);
  
  const description = isVehicle
    ? `${title}, ${faker.vehicle.color()}, ${faker.number.int({ min: 2015, max: 2023 })}/${faker.number.int({ min: 2015, max: 2023 })}, ${faker.number.int({ min: 10000, max: 100000 })} km`
    : faker.lorem.paragraphs(2);
  
  const baseAsset = {
    publicId: `AST-${uuidv4()}`,
    title: title,
    description: description,
    status: 'DISPONIVEL' as const,
    imageUrl: `https://picsum.photos/seed/asset-${index}/800/600`,
    galleryImageUrls: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, (_, i) => 
      `https://picsum.photos/seed/asset-gallery-${index}-${i}/800/600`
    ),
    locationCity: faker.location.city(),
    locationState: faker.location.state({ abbreviated: true }),
    address: `${faker.location.streetAddress()}, ${faker.location.city()} - ${faker.location.state({ abbreviated: true })}`,
    latitude: faker.location.latitude().toString(),
    longitude: faker.location.longitude().toString(),
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent(),
  };

  return baseAsset;
}

async function seedAssets() {
  console.log('🚀 Iniciando seed de Ativos...');
  
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

    // Obtém as categorias disponíveis
    const categories = await prisma.lotCategory.findMany();
    if (categories.length === 0) {
      throw new Error('Nenhuma categoria encontrada. É necessário ter pelo menos uma categoria para criar ativos.');
    }

    // Cria 5 ativos de exemplo para validação
    const assetCount = 5;
    
    for (let i = 0; i < assetCount; i++) {
      const category = faker.helpers.arrayElement(categories);
      
      // Busca subcategorias da categoria atual (se houver)
      let subcategory = null;
      if (category.hasSubcategories) {
        const subcategories = await prisma.subcategory.findMany({
          where: { 
            parentCategoryId: category.id 
          },
          take: 10
        });
        if (subcategories.length > 0) {
          subcategory = faker.helpers.arrayElement(subcategories);
        }
      }
      
      // Gera os dados do ativo - alterna entre veículos e imóveis
      const isVehicle = i % 2 === 0; // Alterna entre true (veículo) e false (imóvel)
      const assetData = isVehicle ? 
        { ...generateRandomAsset(i), ...generateRandomVehicle() } : 
        { ...generateRandomAsset(i), ...generateRandomProperty() };
      
      // Cria o objeto base com campos comuns
      const assetToCreate: any = {
        publicId: assetData.publicId,
        title: assetData.title,
        description: assetData.description,
        status: 'DISPONIVEL',
        imageUrl: assetData.imageUrl,
        galleryImageUrls: assetData.galleryImageUrls,
        locationCity: assetData.locationCity,
        locationState: assetData.locationState,
        address: assetData.address,
        latitude: assetData.latitude,
        longitude: assetData.longitude,
        createdAt: assetData.createdAt,
        updatedAt: assetData.updatedAt,
        tenantId: tenant.id,
        categoryId: category.id,
        subcategoryId: subcategory?.id,
      };
      
      // Adiciona campos específicos de veículo ou imóvel
      if (isVehicle) {
        const vehicleData = assetData as any;
        assetToCreate.plate = vehicleData.plate;
        assetToCreate.make = vehicleData.make;
        assetToCreate.model = vehicleData.model;
        assetToCreate.version = vehicleData.version;
        assetToCreate.year = vehicleData.year;
        assetToCreate.modelYear = vehicleData.modelYear;
        assetToCreate.mileage = vehicleData.mileage;
        assetToCreate.color = vehicleData.color;
        assetToCreate.fuelType = vehicleData.fuelType;
        assetToCreate.transmissionType = vehicleData.transmissionType;
        assetToCreate.bodyType = vehicleData.bodyType;
        assetToCreate.vin = vehicleData.vin;
        assetToCreate.renavam = vehicleData.renavam;
        assetToCreate.enginePower = vehicleData.enginePower;
        assetToCreate.numberOfDoors = vehicleData.numberOfDoors;
        assetToCreate.vehicleOptions = vehicleData.vehicleOptions;
        assetToCreate.runningCondition = vehicleData.runningCondition;
        assetToCreate.bodyCondition = vehicleData.bodyCondition;
        assetToCreate.tiresCondition = vehicleData.tiresCondition;
        assetToCreate.hasKey = vehicleData.hasKey;
      } else {
        const propertyData = assetData as any;
        assetToCreate.propertyRegistrationNumber = propertyData.propertyRegistrationNumber;
        assetToCreate.iptuNumber = propertyData.iptuNumber;
        assetToCreate.isOccupied = propertyData.isOccupied;
        assetToCreate.totalArea = propertyData.totalArea;
        assetToCreate.builtArea = propertyData.builtArea;
        assetToCreate.bedrooms = propertyData.bedrooms;
        assetToCreate.suites = propertyData.suites;
        assetToCreate.bathrooms = propertyData.bathrooms;
        assetToCreate.parkingSpaces = propertyData.parkingSpaces;
        assetToCreate.constructionType = propertyData.constructionType;
        assetToCreate.finishes = propertyData.finishes;
        assetToCreate.infrastructure = propertyData.infrastructure;
        assetToCreate.condoDetails = propertyData.condoDetails;
        assetToCreate.improvements = propertyData.improvements;
        assetToCreate.topography = propertyData.topography;
        assetToCreate.hasHabiteSe = propertyData.hasHabiteSe;
        assetToCreate.zoningRestrictions = propertyData.zoningRestrictions;
      }
      
      // Insere o ativo no banco de dados
      try {
        await prisma.asset.create({
          data: assetToCreate,
        });
        
        if ((i + 1) % 5 === 0 || i === assetCount - 1) {
          console.log(`✅ ${i + 1}/${assetCount} ativos criados`);
        }
      } catch (error) {
        console.error(`❌ Erro ao criar ativo ${i + 1}:`, error);
      }
    }

    console.log(`\n✨ Seed de Ativos concluído com sucesso!`);
    console.log(`✅ Total de ativos criados: ${assetCount}`);
    
  } catch (error) {
    console.error('❌ Erro durante o seed de Ativos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executa o seed
seedAssets()
  .then(() => {
    console.log('✅ Seed de Ativos concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro durante o seed de Ativos:', error);
    process.exit(1);
  });

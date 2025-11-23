// src/app/admin/assets/asset-form-schema.ts
/**
 * @fileoverview Define o schema de validação (usando Zod) para o formulário
 * de criação e edição de Assets (ativos). Este schema suporta todos os campos
 * específicos definidos no modelo Prisma, com validação dinâmica por categoria.
 */
import * as z from 'zod';
import type { Asset } from '@/types';

const assetStatusValues: [Asset['status'], ...Asset['status'][]] = [
  'CADASTRO', 'DISPONIVEL', 'LOTEADO', 'VENDIDO', 'REMOVIDO', 'INATIVADO'
];

const optionalUrlSchema = z.string().url({ message: "URL inválida." }).or(z.literal('')).optional().nullable();
const optionalString = z.string().optional().nullable();
const optionalNumber = z.coerce.number().optional().nullable();
const optionalBoolean = z.boolean().optional().nullable();
const optionalDate = z.coerce.date().optional().nullable();

// Schema base com campos comuns a todos os ativos
export const baseAssetFormSchema = z.object({
  // Campos obrigatórios
  title: z.string().min(5, "O título do bem deve ter pelo menos 5 caracteres.").max(200, "O título do bem não pode exceder 200 caracteres."),
  status: z.enum(assetStatusValues),
  categoryId: z.string().min(1, "A categoria é obrigatória."),
  sellerId: z.string().min(1, "O comitente/vendedor é obrigatório."),
  
  // Campos opcionais comuns
  description: z.string().max(5000).optional().nullable(),
  subcategoryId: optionalString,
  judicialProcessId: optionalString,
  evaluationValue: z.coerce.number().positive("O valor de avaliação deve ser positivo.").optional().nullable(),
  
  // Mídia
  imageUrl: optionalUrlSchema,
  imageMediaId: optionalString,
  galleryImageUrls: z.array(z.string().url()).optional().nullable(),
  mediaItemIds: z.array(z.string()).optional().nullable(),
  dataAiHint: z.string().max(50).optional().nullable(),
  
  // Localização
  address: optionalString,
  locationCity: optionalString,
  locationState: optionalString,
  latitude: optionalNumber,
  longitude: optionalNumber,
  
  // Campos de endereço (para o componente AddressGroup)
  street: optionalString,
  number: optionalString,
  complement: optionalString,
  neighborhood: optionalString,
  cityId: optionalString,
  stateId: optionalString,
  zipCode: z.string().max(10).optional().nullable(),
});

// Campos específicos para VEÍCULOS
export const vehicleFieldsSchema = z.object({
  plate: optionalString,
  make: optionalString,
  model: optionalString,
  version: optionalString,
  year: optionalNumber,
  modelYear: optionalNumber,
  mileage: optionalNumber,
  color: optionalString,
  fuelType: optionalString,
  transmissionType: optionalString,
  bodyType: optionalString,
  vin: optionalString,
  renavam: optionalString,
  enginePower: optionalString,
  numberOfDoors: optionalNumber,
  vehicleOptions: optionalString,
  detranStatus: optionalString,
  debts: optionalString,
  runningCondition: optionalString,
  bodyCondition: optionalString,
  tiresCondition: optionalString,
  hasKey: optionalBoolean,
});

// Campos específicos para IMÓVEIS
export const propertyFieldsSchema = z.object({
  propertyRegistrationNumber: optionalString,
  iptuNumber: optionalString,
  isOccupied: optionalBoolean,
  totalArea: optionalNumber,
  builtArea: optionalNumber,
  bedrooms: optionalNumber,
  suites: optionalNumber,
  bathrooms: optionalNumber,
  parkingSpaces: optionalNumber,
  constructionType: optionalString,
  finishes: optionalString,
  infrastructure: optionalString,
  condoDetails: optionalString,
  improvements: optionalString,
  topography: optionalString,
  liensAndEncumbrances: optionalString,
  propertyDebts: optionalString,
  unregisteredRecords: optionalString,
  hasHabiteSe: optionalBoolean,
  zoningRestrictions: optionalString,
  amenities: z.any().optional().nullable(), // JSON field
});

// Campos específicos para MÁQUINAS/EQUIPAMENTOS
export const machineryFieldsSchema = z.object({
  brand: optionalString,
  serialNumber: optionalString,
  itemCondition: optionalString,
  specifications: optionalString,
  includedAccessories: optionalString,
  batteryCondition: optionalString,
  hasInvoice: optionalBoolean,
  hasWarranty: optionalBoolean,
  repairHistory: optionalString,
  applianceCapacity: optionalString,
  voltage: optionalString,
  applianceType: optionalString,
  additionalFunctions: optionalString,
  hoursUsed: optionalNumber,
  engineType: optionalString,
  capacityOrPower: optionalString,
  maintenanceHistory: optionalString,
  installationLocation: optionalString,
  compliesWithNR: optionalString,
  operatingLicenses: optionalString,
});

// Campos específicos para PECUÁRIA/ANIMAIS
export const livestockFieldsSchema = z.object({
  breed: optionalString,
  age: optionalString,
  sex: optionalString,
  weight: optionalString,
  individualId: optionalString,
  purpose: optionalString,
  sanitaryCondition: optionalString,
  lineage: optionalString,
  isPregnant: optionalBoolean,
  specialSkills: optionalString,
  gtaDocument: optionalString,
  breedRegistryDocument: optionalString,
});

// Campos específicos para MÓVEIS
export const furnitureFieldsSchema = z.object({
  furnitureType: optionalString,
  material: optionalString,
  style: optionalString,
  dimensions: optionalString,
  pieceCount: optionalNumber,
});

// Campos específicos para JOIAS
export const jewelryFieldsSchema = z.object({
  jewelryType: optionalString,
  metal: optionalString,
  gemstones: optionalString,
  totalWeight: optionalString,
  jewelrySize: optionalString,
  authenticityCertificate: optionalString,
});

// Campos específicos para ARTE
export const artFieldsSchema = z.object({
  workType: optionalString,
  artist: optionalString,
  period: optionalString,
  technique: optionalString,
  provenance: optionalString,
});

// Campos específicos para EMBARCAÇÕES
export const boatFieldsSchema = z.object({
  boatType: optionalString,
  boatLength: optionalString,
  hullMaterial: optionalString,
  onboardEquipment: optionalString,
});

// Campos específicos para COMMODITIES
export const commodityFieldsSchema = z.object({
  productName: optionalString,
  quantity: optionalString,
  packagingType: optionalString,
  expirationDate: optionalDate,
  storageConditions: optionalString,
});

// Campos específicos para METAIS PRECIOSOS
export const preciousMetalFieldsSchema = z.object({
  preciousMetalType: optionalString,
  purity: optionalString,
});

// Campos específicos para PRODUTOS FLORESTAIS
export const forestGoodsFieldsSchema = z.object({
  forestGoodsType: optionalString,
  volumeOrQuantity: optionalString,
  species: optionalString,
  dofNumber: optionalString,
});

// Schema completo com TODOS os campos possíveis
export const assetFormSchema = baseAssetFormSchema
  .merge(vehicleFieldsSchema)
  .merge(propertyFieldsSchema)
  .merge(machineryFieldsSchema)
  .merge(livestockFieldsSchema)
  .merge(furnitureFieldsSchema)
  .merge(jewelryFieldsSchema)
  .merge(artFieldsSchema)
  .merge(boatFieldsSchema)
  .merge(commodityFieldsSchema)
  .merge(preciousMetalFieldsSchema)
  .merge(forestGoodsFieldsSchema);

export type AssetFormData = z.infer<typeof assetFormSchema>;

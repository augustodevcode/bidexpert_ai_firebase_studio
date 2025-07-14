// src/app/admin/bens/bem-form-schema.ts
import * as z from 'zod';
import type { Bem } from '@/types';

const bemStatusValues: [Bem['status'], ...Bem['status'][]] = [
  'CADASTRO', 'DISPONIVEL', 'LOTEADO', 'VENDIDO', 'REMOVIDO', 'INATIVADO'
];

export const bemFormSchema = z.object({
  title: z.string().min(5, {
    message: "O título do bem deve ter pelo menos 5 caracteres.",
  }).max(200, {
    message: "O título do bem não pode exceder 200 caracteres.",
  }),
  description: z.string().max(5000).optional(),
  status: z.enum(bemStatusValues),
  categoryId: z.string().min(1, "A categoria é obrigatória."),
  subcategoryId: z.string().optional().nullable(),
  judicialProcessId: z.string().optional().nullable(),
  sellerId: z.string().optional().nullable(),
  evaluationValue: z.coerce.number().positive("O valor de avaliação deve ser positivo.").optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  imageMediaId: z.string().optional().nullable(),
  galleryImageUrls: z.array(z.string().url()).optional(),
  mediaItemIds: z.array(z.string()).optional(),
  dataAiHint: z.string().max(50).optional(),
  locationCity: z.string().max(100).optional(),
  locationState: z.string().max(100).optional(),
  address: z.string().max(255).optional(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),

  // Veículos
  plate: z.string().max(10).optional().nullable(),
  make: z.string().max(50).optional().nullable(),
  model: z.string().max(50).optional().nullable(),
  version: z.string().max(100).optional().nullable(),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  modelYear: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 2).optional().nullable(),
  mileage: z.coerce.number().int().min(0).optional().nullable(),
  color: z.string().max(30).optional().nullable(),
  fuelType: z.string().max(30).optional().nullable(),
  transmissionType: z.string().max(30).optional().nullable(),
  bodyType: z.string().max(50).optional().nullable(),
  vin: z.string().max(17).optional().nullable(),
  renavam: z.string().max(11).optional().nullable(),
  enginePower: z.string().max(50).optional().nullable(),
  numberOfDoors: z.coerce.number().int().min(0).optional().nullable(),
  vehicleOptions: z.string().max(500).optional().nullable(),
  detranStatus: z.string().max(100).optional().nullable(),
  debts: z.string().max(500).optional().nullable(),
  runningCondition: z.string().max(100).optional().nullable(),
  bodyCondition: z.string().max(100).optional().nullable(),
  tiresCondition: z.string().max(100).optional().nullable(),
  hasKey: z.boolean().optional(),

  // Imóveis
  propertyRegistrationNumber: z.string().max(50).optional().nullable(),
  iptuNumber: z.string().max(50).optional().nullable(),
  isOccupied: z.boolean().optional(),
  totalArea: z.coerce.number().min(0).optional().nullable(),
  builtArea: z.coerce.number().min(0).optional().nullable(),
  bedrooms: z.coerce.number().int().min(0).optional().nullable(),
  suites: z.coerce.number().int().min(0).optional().nullable(),
  bathrooms: z.coerce.number().int().min(0).optional().nullable(),
  parkingSpaces: z.coerce.number().int().min(0).optional().nullable(),
  constructionType: z.string().max(100).optional().nullable(),
  finishes: z.string().max(500).optional().nullable(),
  infrastructure: z.string().max(500).optional().nullable(),
  condoDetails: z.string().max(500).optional().nullable(),
  improvements: z.string().max(500).optional().nullable(),
  topography: z.string().max(100).optional().nullable(),
  liensAndEncumbrances: z.string().max(1000).optional().nullable(),
  propertyDebts: z.string().max(500).optional().nullable(),
  unregisteredRecords: z.string().max(500).optional().nullable(),
  hasHabiteSe: z.boolean().optional(),
  zoningRestrictions: z.string().max(200).optional().nullable(),
  amenities: z.array(z.object({ value: z.string().min(1, 'Amenity cannot be empty') })).optional(),
  
  // Eletrônicos
  brand: z.string().max(50).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  itemCondition: z.string().max(100).optional().nullable(),
  specifications: z.string().max(1000).optional().nullable(),
  includedAccessories: z.string().max(500).optional().nullable(),
  batteryCondition: z.string().max(100).optional().nullable(),
  hasInvoice: z.boolean().optional(),
  hasWarranty: z.boolean().optional(),
  repairHistory: z.string().max(500).optional().nullable(),
  
  // Eletrodomésticos
  applianceCapacity: z.string().max(50).optional().nullable(),
  voltage: z.string().max(20).optional().nullable(),
  applianceType: z.string().max(50).optional().nullable(),
  additionalFunctions: z.string().max(200).optional().nullable(),
  
  // Máquinas e Equipamentos
  hoursUsed: z.coerce.number().int().min(0).optional().nullable(),
  engineType: z.string().max(50).optional().nullable(),
  capacityOrPower: z.string().max(100).optional().nullable(),
  maintenanceHistory: z.string().max(1000).optional().nullable(),
  installationLocation: z.string().max(200).optional().nullable(),
  compliesWithNR: z.string().max(100).optional().nullable(),
  operatingLicenses: z.string().max(200).optional().nullable(),
  
  // Semoventes (Livestock)
  breed: z.string().max(50).optional().nullable(),
  age: z.string().max(30).optional().nullable(),
  sex: z.enum(['Macho', 'Fêmea']).optional().nullable(),
  weight: z.string().max(30).optional().nullable(),
  individualId: z.string().max(50).optional().nullable(),
  purpose: z.string().max(100).optional().nullable(),
  sanitaryCondition: z.string().max(200).optional().nullable(),
  lineage: z.string().max(200).optional().nullable(),
  isPregnant: z.boolean().optional(),
  specialSkills: z.string().max(200).optional().nullable(),
  gtaDocument: z.string().max(100).optional().nullable(),
  breedRegistryDocument: z.string().max(100).optional().nullable(),

  // Móveis
  furnitureType: z.string().max(100).optional().nullable(),
  material: z.string().max(100).optional().nullable(),
  style: z.string().max(50).optional().nullable(),
  dimensions: z.string().max(100).optional().nullable(),
  pieceCount: z.coerce.number().int().min(0).optional().nullable(),
  
  // Joias
  jewelryType: z.string().max(100).optional().nullable(),
  metal: z.string().max(100).optional().nullable(),
  gemstones: z.string().max(500).optional().nullable(),
  totalWeight: z.string().max(50).optional().nullable(),
  jewelrySize: z.string().max(50).optional().nullable(),
  authenticityCertificate: z.string().max(200).optional().nullable(),
  
  // Obras de Arte e Antiguidades
  workType: z.string().max(100).optional().nullable(),
  artist: z.string().max(100).optional().nullable(),
  period: z.string().max(100).optional().nullable(),
  technique: z.string().max(100).optional().nullable(),
  provenance: z.string().max(500).optional().nullable(),
  
  // Embarcações
  boatType: z.string().max(100).optional().nullable(),
  boatLength: z.string().max(50).optional().nullable(),
  hullMaterial: z.string().max(50).optional().nullable(),
  onboardEquipment: z.string().max(1000).optional().nullable(),
  
  // Alimentos
  productName: z.string().max(100).optional().nullable(),
  quantity: z.string().max(50).optional().nullable(),
  packagingType: z.string().max(50).optional().nullable(),
  expirationDate: z.date().optional().nullable(),
  storageConditions: z.string().max(200).optional().nullable(),
  
  // Metais Preciosos e Pedras
  preciousMetalType: z.string().max(50).optional().nullable(),
  purity: z.string().max(50).optional().nullable(),
  
  // Bens Florestais
  forestGoodsType: z.string().max(100).optional().nullable(),
  volumeOrQuantity: z.string().max(100).optional().nullable(),
  species: z.string().max(100).optional().nullable(),
  dofNumber: z.string().max(100).optional().nullable(),
});

export type BemFormData = z.infer<typeof bemFormSchema>;

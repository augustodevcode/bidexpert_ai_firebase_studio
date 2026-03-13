/**
 * @fileoverview Tipagem de linha da tabela Asset — Admin Plus.
 */
export interface AssetRow {
  id: string;
  publicId: string;
  title: string;
  description: string;
  status: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  sellerId: string;
  sellerName: string;
  judicialProcessId: string;
  judicialProcessNumber: string;
  evaluationValue: number | null;
  imageUrl: string;
  locationCity: string;
  locationState: string;
  address: string;
  plate: string;
  make: string;
  model: string;
  year: number | null;
  mileage: number | null;
  color: string;
  fuelType: string;
  totalArea: number | null;
  builtArea: number | null;
  bedrooms: number | null;
  parkingSpaces: number | null;
  createdAt: string;
}

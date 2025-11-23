import { faker } from '@faker-js/faker';
import { AssetService } from '../src/services/asset.service';
import type { Asset, AssetFormData, CityInfo as City, StateInfo } from '../src/types';
import type { SeededAssetCategorySet } from './seed-asset-categories';

export async function enrichAssetLocations(
  assetService: AssetService,
  assets: Asset[],
  cities: City[],
  statesById: Record<string, StateInfo>,
  categorySet: SeededAssetCategorySet
): Promise<number> {
  const usableCities = cities.filter(Boolean);
  const availableStateIds = Object.keys(statesById);
  if (!assets.length || !usableCities.length || !availableStateIds.length) return 0;

  const fallbackState = statesById[availableStateIds[0]];
  let updatedCount = 0;

  for (const asset of assets) {
    if (!asset?.id) continue;
    const matchedCity = usableCities.find((city) => city.name === asset.locationCity) ?? faker.helpers.arrayElement(usableCities);
    const matchedState = matchedCity ? statesById[matchedCity.stateId] : fallbackState;
    const locationState = matchedState?.uf ?? asset.locationState ?? fallbackState?.uf ?? 'SP';
    const locationCity = matchedCity?.name ?? asset.locationCity ?? 'São Paulo';

    const totalArea = asset.totalArea ?? faker.number.int({ min: 60, max: 420 });
    const builtArea = asset.builtArea ?? Math.max(40, Math.round(totalArea * faker.number.float({ min: 0.65, max: 0.95 })));
    const latitude = asset.latitude ?? Number(faker.location.latitude({ min: -34, max: -2 }));
    const longitude = asset.longitude ?? Number(faker.location.longitude({ min: -74, max: -34 }));
    const addressFallback = `${faker.location.streetAddress(false)}, ${locationCity}, ${locationState}`;
    const update: Partial<AssetFormData> = {
      locationCity,
      locationState,
      address: asset.address || addressFallback,
      latitude,
      longitude,
    };

    if (asset.categoryId === categorySet.imoveis.id) {
      update.totalArea = totalArea;
      update.builtArea = builtArea;
      update.bedrooms = asset.bedrooms ?? faker.number.int({ min: 1, max: 4 });
      update.bathrooms = asset.bathrooms ?? faker.number.int({ min: 1, max: 3 });
      update.parkingSpaces = asset.parkingSpaces ?? faker.number.int({ min: 0, max: 3 });
      update.propertyRegistrationNumber = asset.propertyRegistrationNumber || faker.string.numeric(12);
      if (asset.isOccupied === undefined) {
        update.isOccupied = faker.datatype.boolean({ probability: 0.6 });
      }
    } else if (asset.categoryId === categorySet.veiculos.id) {
      update.mileage = asset.mileage ?? faker.number.int({ min: 12000, max: 160000 });
      update.modelYear = asset.modelYear ?? faker.number.int({ min: 2014, max: 2024 });
      update.year = asset.year ?? update.modelYear;
      update.make = asset.make || faker.vehicle.manufacturer();
      update.model = asset.model || faker.vehicle.model();
      update.color = asset.color || faker.vehicle.color();
      update.fuelType = asset.fuelType || faker.helpers.arrayElement(['Gasolina', 'Flex', 'Diesel', 'Elétrico']);
      update.transmissionType = asset.transmissionType || faker.helpers.arrayElement(['Manual', 'Automático', 'CVT']);
      update.plate = asset.plate || `${faker.string.alpha({ length: 3 }).toUpperCase()}-${faker.string.numeric(4)}`;
    } else {
      update.brand = asset.brand || faker.company.name();
      update.itemCondition = asset.itemCondition || faker.helpers.arrayElement(['Novo', 'Usado', 'Reformado']);
      update.specifications = asset.specifications || faker.commerce.productDescription();
      update.furnitureType = asset.furnitureType || faker.helpers.arrayElement(['Estante', 'Mesa', 'Sofá', 'Armário']);
      update.material = asset.material || faker.helpers.arrayElement(['Madeira', 'Metal', 'Vidro', 'Couro']);
      update.pieceCount = asset.pieceCount ?? faker.number.int({ min: 1, max: 12 });
    }

    await assetService.updateAsset(asset.id, update);
    updatedCount++;
  }

  return updatedCount;
}

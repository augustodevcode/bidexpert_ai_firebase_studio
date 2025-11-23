import { CategoryService } from '../src/services/category.service';
import { SubcategoryService } from '../src/services/subcategory.service';
import type { LotCategory } from '../src/types';

type CategoryKey = 'imoveis' | 'veiculos' | 'eletronicos';

export type SeededAssetCategorySet = Record<CategoryKey, LotCategory>;

const baseCategories: Array<{ key: CategoryKey; name: string; description: string }> = [
  { key: 'imoveis', name: 'Imóveis', description: 'Residências e imóveis comerciais em geral.' },
  { key: 'veiculos', name: 'Veículos', description: 'Veículos automotores, terrestres e aquáticos.' },
  { key: 'eletronicos', name: 'Eletrônicos', description: 'Equipamentos eletrônicos, máquinas e móveis.' },
];

const subcategoryDefinitions: Array<{
  parentKey: CategoryKey;
  name: string;
  description: string;
  displayOrder: number;
}> = [
  { parentKey: 'imoveis', name: 'Apartamentos', description: 'Unidades residenciais em condomínio.', displayOrder: 0 },
  { parentKey: 'imoveis', name: 'Casas', description: 'Casas unifamiliares e sobrado.', displayOrder: 1 },
  { parentKey: 'imoveis', name: 'Imóveis Comerciais', description: 'Prédios comerciais, galpões e salas.', displayOrder: 2 },
  { parentKey: 'veiculos', name: 'Carros', description: 'Automóveis de passeio e utilitários.', displayOrder: 0 },
  { parentKey: 'veiculos', name: 'Motos', description: 'Motocicletas e motonetas.', displayOrder: 1 },
  { parentKey: 'veiculos', name: 'Máquinas Pesadas', description: 'Caminhões, tratores e implementos.', displayOrder: 2 },
  { parentKey: 'eletronicos', name: 'Celulares', description: 'Smartphones e acessórios.', displayOrder: 0 },
  { parentKey: 'eletronicos', name: 'Computadores', description: 'Notebooks, desktops e servidores.', displayOrder: 1 },
  { parentKey: 'eletronicos', name: 'Móveis e Máquinas', description: 'Móveis corporativos e equipamentos industriais.', displayOrder: 2 },
];

export async function seedAssetCategories(
  categoryService: CategoryService,
  subcategoryService: SubcategoryService
): Promise<SeededAssetCategorySet> {
  const createdCategories: Partial<SeededAssetCategorySet> = {};

  for (const definition of baseCategories) {
    const result = await categoryService.createCategory({
      name: definition.name,
      description: definition.description,
    });

    if (!result.success || !result.category) {
      throw new Error(`Failed to seed category ${definition.name}: ${result.message}`);
    }

    createdCategories[definition.key] = result.category;
  }

  for (const sub of subcategoryDefinitions) {
    const parent = createdCategories[sub.parentKey];
    if (!parent) continue;
    await subcategoryService.createSubcategory({
      name: sub.name,
      parentCategoryId: parent.id,
      description: sub.description,
      displayOrder: sub.displayOrder,
      iconUrl: '',
      iconMediaId: null,
      dataAiHintIcon: '',
    });
  }

  return createdCategories as SeededAssetCategorySet;
}

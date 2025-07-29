
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NavigationMenuLink } from '@/components/ui/navigation-menu';
import type { LotCategory } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronRight, Tag, ListChecks, type LucideIcon } from 'lucide-react';
import { slugify } from '@/lib/ui-helpers';
import { Button } from '@/components/ui/button';
import { icons } from 'lucide-react';

// Função para obter o componente do ícone pelo nome
const getLucideIcon = (name?: string): LucideIcon | null => {
  if (!name || typeof name !== 'string') return null;
  const iconName = name.charAt(0).toUpperCase() + name.slice(1) as keyof typeof icons;
  return icons[iconName] || null;
};

interface MegaMenuCategoriesProps {
  categories: LotCategory[];
  onLinkClick?: () => void;
}

const CategoryListItem = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<'a'> & { category: LotCategory; onHover: () => void; isActive: boolean; onClick?: () => void; href: string; }
>(({ className, category, onHover, isActive, onClick, href, ...props }, ref) => {
  const IconComponent = getLucideIcon(category.iconName) || Tag;
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          ref={ref}
          className={cn(
            'flex select-none items-center justify-between rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            isActive ? 'bg-accent text-accent-foreground font-semibold' : 'text-foreground/80',
            className
          )}
          onMouseEnter={onHover}
          onFocus={onHover}
          onClick={onClick}
          {...props}
        >
          <div className="flex items-center gap-2">
             <IconComponent className="h-4 w-4 text-primary/90 flex-shrink-0" />
            <span className="truncate">{category.name}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
CategoryListItem.displayName = 'CategoryListItem';

// Mapa de subcategorias (slug da categoria principal => lista de nomes de subcategorias)
const subcategoryMap: Record<string, string[]> = {
  'imoveis': ['Apartamentos', 'Casas', 'Terrenos', 'Salas Comerciais', 'Galpões e Prédios', 'Imóveis Rurais'],
  'veiculos': ['Carros', 'Motos', 'Caminhões e Ônibus', 'Veículos Pesados', 'Aeronaves'],
  'maquinas-e-equipamentos': ['Máquinas Agrícolas', 'Máquinas Industriais', 'Equipamentos de Construção'],
  'eletronicos-e-tecnologia': ['Celulares e Tablets', 'Computadores e Notebooks', 'Televisores e Áudio', 'Componentes e Peças'],
  'casa-e-decoracao': ['Móveis Residenciais', 'Eletrodomésticos', 'Utensílios de Cozinha', 'Decoração e Iluminação'],
  'arte-e-antiguidades': ['Obras de Arte', 'Antiguidades', 'Itens Colecionáveis', 'Numismática'],
  'joias-e-acessorios': ['Joias', 'Relógios de Luxo', 'Bolsas de Grife'],
  'semoventes': ['Bovinos', 'Equinos', 'Ovinos e Caprinos'],
  'materiais-e-sucatas': ['Materiais de Construção', 'Sucatas Metálicas'],
  'industrial-geral': ['Estoques Industriais', 'Matéria-prima', 'Mobiliário Corporativo'],
  'embarcacoes': ['Lanchas e Iates', 'Jet Skis', 'Veleiros', 'Barcos de Pesca'],
  'alimentos': ['Não Perecíveis', 'Bebidas'],
  'metais-e-pedras-preciosas': ['Ouro', 'Prata', 'Pedras Preciosas'],
  'bens-florestais-e-ambientais': ['Madeira Legalizada', 'Créditos de Carbono'],
  'outros-itens-e-oportunidades': ['Consórcios', 'Direitos Creditórios'],
};

function getSubcategoriesFor(categorySlug: string | undefined): string[] {
  if (!categorySlug) return [];
  return subcategoryMap[categorySlug] || [];
}


export default function MegaMenuCategories({ categories, onLinkClick }: MegaMenuCategoriesProps) {
  const [hoveredCategory, setHoveredCategory] = React.useState<LotCategory | null>(
    categories && categories.length > 0 ? categories[0] : null
  );

  React.useEffect(() => {
    if (!hoveredCategory && categories && categories.length > 0) {
      setHoveredCategory(categories[0]);
    }
  }, [categories, hoveredCategory]);

  if (!categories || categories.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">Nenhuma categoria disponível.</div>;
  }

  const MAX_CATEGORIES_IN_SIDEBAR = 8;
  const sidebarCategories = categories.slice(0, MAX_CATEGORIES_IN_SIDEBAR);
  const subcategoriesToShow = getSubcategoriesFor(hoveredCategory?.slug);

  return (
    <div className="grid grid-cols-[260px_1fr] md:w-[700px] lg:w-[800px] xl:w-[900px] gap-0 p-0 max-h-[calc(80vh-100px)] min-h-[350px]">
      {/* Left Panel: Category List */}
      <div className="bg-background border-r border-border p-3 flex flex-col h-full">
        <h4 className="px-3 py-2 text-md font-semibold text-foreground mb-1 font-headline">Categorias de Oportunidades</h4>
        <div className="overflow-y-auto flex-grow pr-1">
          <ul className="space-y-0.5">
            {sidebarCategories.map((category) => (
              <CategoryListItem
                key={category.id}
                category={category}
                onHover={() => setHoveredCategory(category)}
                isActive={hoveredCategory?.id === category.id}
                onClick={onLinkClick}
                href={`/category/${category.slug}`}
              />
            ))}
          </ul>
        </div>
        {categories.length > MAX_CATEGORIES_IN_SIDEBAR && (
          <div className="mt-auto pt-2 border-t border-border">
            <NavigationMenuLink asChild>
              <Link
                href="/search?tab=categories"
                onClick={onLinkClick}
                className={cn(
                  'flex select-none items-center justify-center rounded-md p-3 text-sm font-semibold text-primary hover:bg-accent hover:text-primary/90 leading-none no-underline outline-none transition-colors focus:bg-accent focus:text-primary/90'
                )}
              >
                <ListChecks className="h-4 w-4 mr-2"/>
                <span>Ver Todas as Categorias</span>
              </Link>
            </NavigationMenuLink>
          </div>
        )}
      </div>

      {/* Right Panel: Content for Hovered Category */}
      <div className="p-4 md:p-6 h-full overflow-y-auto bg-secondary/30">
        {hoveredCategory ? (
          <div className="flex flex-col h-full">
            <div>
              <h3 className="text-xl font-bold text-primary mb-1 font-headline">{hoveredCategory.name}</h3>
              <p className="text-xs text-muted-foreground mb-3 h-10 overflow-hidden line-clamp-2">
                {hoveredCategory.description || `Explore os melhores itens na categoria ${hoveredCategory.name}.`}
              </p>
            
              {subcategoriesToShow.length > 0 && (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4">
                  {subcategoriesToShow.slice(0, 6).map((sub, index) => ( // Limitar a 6 para não ficar muito extenso
                    <li key={index}>
                      <Link 
                        href={`/category/${hoveredCategory.slug}?subcategory=${slugify(sub)}`}
                        className="block py-1.5 rounded hover:text-primary text-muted-foreground hover:font-medium text-xs"
                        onClick={onLinkClick}
                      >
                        {sub}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="mt-auto pt-4">
              <Link href={`/category/${hoveredCategory.slug}`} onClick={onLinkClick} className="block group">
                <div className="relative aspect-[16/9] bg-muted rounded-md overflow-hidden mb-3">
                  <Image 
                    src={hoveredCategory.megaMenuImageUrl || `https://placehold.co/400x225.png`}
                    alt={`Imagem promocional para ${hoveredCategory.name}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={hoveredCategory.dataAiHintMegaMenu || `${slugify(hoveredCategory.name || "categoria")} promocional`} 
                  />
                </div>
              </Link>
              <Button size="sm" variant="default" className="w-full" asChild>
                  <Link href={`/category/${hoveredCategory.slug}`} onClick={onLinkClick}>
                      Explorar {hoveredCategory.name}
                  </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Tag className="h-12 w-12 mb-3 text-primary/50" />
            <p className="text-sm">Passe o mouse sobre uma categoria à esquerda para ver os detalhes.</p>
          </div>
        )}
      </div>
    </div>
  );
}


'use client';

import * as React from 'react';
import Link from 'next/link';
import { NavigationMenuLink } from '@/components/ui/navigation-menu';
import type { LotCategory } from '@/types';
import { cn } from '@/lib/utils';
import { Tag, ListChecks } from 'lucide-react';

interface MegaMenuCategoriesProps {
  categories: LotCategory[];
  onLinkClick?: () => void; // Para fechar o menu mobile se usado lá e o sheet fechar ao clicar
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & { icon?: React.ReactNode }
>(({ className, title, children, icon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            'flex select-none items-start space-x-3 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className="mt-0.5 text-primary">{icon || <Tag className="h-5 w-5" />}</div>
          <div>
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
              {children}
            </p>
          </div>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = 'ListItem';

export default function MegaMenuCategories({ categories, onLinkClick }: MegaMenuCategoriesProps) {
  if (!categories || categories.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">Nenhuma categoria disponível.</p>;
  }

  // Define um número máximo de categorias a serem exibidas diretamente no megamenu
  const MAX_CATEGORIES_IN_MEGAMENU = 6;
  const visibleCategories = categories.slice(0, MAX_CATEGORIES_IN_MEGAMENU);
  const hasMoreCategories = categories.length > MAX_CATEGORIES_IN_MEGAMENU;

  return (
    <div className="p-2">
      <ul className="grid w-[300px] gap-2 p-2 md:w-[400px] md:grid-cols-2 lg:w-[500px]">
        {visibleCategories.map((category) => (
          <ListItem
            key={category.id}
            title={category.name}
            href={`/category/${category.slug}`}
            onClick={onLinkClick}
          >
            {category.description || `Explore lotes na categoria ${category.name}.`}
          </ListItem>
        ))}
        {hasMoreCategories && (
          <ListItem
            title="Ver Todas as Categorias"
            href="/search?tab=categories" // Ajuste o link se tiver uma página específica para categorias
            className="font-semibold text-primary hover:text-primary/90 md:col-span-2 text-center"
            onClick={onLinkClick}
            icon={<ListChecks className="h-5 w-5"/>}
          >
            Navegue por todas as categorias disponíveis em nossa plataforma.
          </ListItem>
        )}
      </ul>
    </div>
  );
}

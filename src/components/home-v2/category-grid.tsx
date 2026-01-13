/**
 * @file CategoryGrid Component
 * @description Grid of category cards for segment pages with icons,
 * names, descriptions, and lot counts.
 */
'use client';

import Link from 'next/link';
import { 
  Car, Home, Cog, Laptop, Truck, CreditCard, AlertTriangle,
  Building2, Map, Gavel, Tractor, Factory, HardHat, Package,
  Monitor, Tv, Smartphone, Server, ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SegmentCategory, SegmentType } from './types';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Car, Home, Cog, Laptop, Truck, CreditCard, AlertTriangle,
  Building2, Map, Gavel, Tractor, Factory, HardHat, Package,
  Monitor, Tv, Smartphone, Server,
};

interface CategoryGridProps {
  segmentId: SegmentType;
  categories: SegmentCategory[];
  title?: string;
  subtitle?: string;
}

export default function CategoryGrid({ 
  segmentId, 
  categories,
  title = 'Categorias',
  subtitle
}: CategoryGridProps) {
  return (
    <section className="py-10 md:py-14" data-testid="category-grid">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <Link 
            href={`/${segmentId}`}
            className="text-sm text-primary hover:underline hidden sm:flex items-center gap-1"
          >
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category, index) => {
            const IconComponent = CATEGORY_ICONS[category.icon] || Car;
            const isHighlighted = index === 0;

            return (
              <Link 
                key={category.id} 
                href={`/${segmentId}?category=${category.slug}`}
                data-testid={`category-card-${category.slug}`}
              >
                <Card className={cn(
                  "group h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50",
                  "hover:-translate-y-1",
                  isHighlighted && "md:row-span-2 md:col-span-2 lg:col-span-1 lg:row-span-1"
                )}>
                  <CardContent className="p-4 md:p-5 h-full flex flex-col">
                    {/* Icon */}
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                      "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
                      "transition-colors duration-200"
                    )}>
                      <IconComponent className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-base md:text-lg group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <Badge variant="secondary" className="text-xs">
                        {category.count.toLocaleString('pt-BR')} ofertas
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Mobile see all link */}
        <div className="mt-6 sm:hidden">
          <Link 
            href={`/${segmentId}`}
            className="text-sm text-primary hover:underline flex items-center justify-center gap-1"
          >
            Ver todas as categorias <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// src/components/layout/two-column-mega-menu.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NavigationMenuLink } from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight, ListChecks } from 'lucide-react';

interface MegaMenuLinkItem {
  href: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface MegaMenuGroup {
  title?: string;
  items: MegaMenuLinkItem[];
}

interface TwoColumnMegaMenuProps {
  sidebarTitle?: string;
  sidebarItems: MegaMenuLinkItem[];
  mainContent: {
    imageUrl: string;
    imageAlt: string;
    dataAiHint: string;
    title: string;
    description: string;
    buttonLink: string;
    buttonText: string;
  };
  viewAllLink?: {
    href: string;
    label: string;
    icon?: React.ElementType;
  };
  containerWidthClasses?: string;
  gridClasses?: string; // e.g., "grid-cols-[220px_1fr]"
  onLinkClick?: () => void;
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & { icon?: React.ReactNode; title: string }
>(({ className, title, children, icon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            'flex select-none items-center space-x-2 rounded-md p-2.5 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          {icon && <div className="text-primary flex-shrink-0">{icon}</div>}
          <div className="flex-grow min-w-0">
            <div className="text-sm font-medium leading-none truncate" title={title}>{title}</div>
            {children && (
              <p className="line-clamp-1 text-xs leading-snug text-muted-foreground">
                {children}
              </p>
            )}
          </div>
          {!children && <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />}
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = 'ListItem';

export default function TwoColumnMegaMenu({
  sidebarTitle,
  sidebarItems,
  mainContent,
  viewAllLink,
  containerWidthClasses = "md:w-[650px] lg:w-[750px]",
  gridClasses = "grid-cols-[250px_1fr]",
  onLinkClick
}: TwoColumnMegaMenuProps) {

  if (!sidebarItems || sidebarItems.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">Nenhuma opção disponível.</div>;
  }

  return (
    <div className={cn("grid gap-0 p-0 max-h-[calc(80vh-100px)] min-h-[350px]", containerWidthClasses, gridClasses)}>
      {/* Left Panel: Links List */}
      <div className="bg-background border-r border-border p-3 flex flex-col h-full">
        {sidebarTitle && (
          <h4 className="px-3 py-2 text-md font-semibold text-foreground mb-1 font-headline">{sidebarTitle}</h4>
        )}
        <div className="overflow-y-auto flex-grow pr-1">
          <ul className="space-y-0.5">
            {sidebarItems.map((item) => (
              <ListItem
                key={item.href}
                title={item.label}
                href={item.href}
                icon={item.icon}
                onClick={onLinkClick}
              >
                {item.description}
              </ListItem>
            ))}
          </ul>
        </div>
        {viewAllLink && (
          <div className="mt-auto pt-2 border-t border-border">
            <NavigationMenuLink asChild>
              <Link
                href={viewAllLink.href}
                onClick={onLinkClick}
                className={cn(
                  'flex select-none items-center justify-center rounded-md p-3 text-sm font-semibold text-primary hover:bg-accent hover:text-primary/90 leading-none no-underline outline-none transition-colors focus:bg-accent focus:text-primary/90'
                )}
              >
                {viewAllLink.icon ? <viewAllLink.icon className="h-4 w-4 mr-2"/> : <ListChecks className="h-4 w-4 mr-2"/>}
                <span>{viewAllLink.label}</span>
              </Link>
            </NavigationMenuLink>
          </div>
        )}
      </div>

      {/* Right Panel: Main Content / Promotion */}
      <div className="p-4 md:p-6 h-full overflow-y-auto bg-secondary/30 flex flex-col">
         <div className="flex-grow">
            <h3 className="text-xl font-bold text-primary mb-2 font-headline">{mainContent.title}</h3>
            <p className="text-xs text-muted-foreground mb-4">
                {mainContent.description}
            </p>
        </div>
        
        <div className="mt-auto">
            <Link href={mainContent.buttonLink} onClick={onLinkClick} className="block group">
            <div className="relative aspect-[16/9] bg-muted rounded-md overflow-hidden mb-3">
                <Image 
                src={mainContent.imageUrl} 
                alt={mainContent.imageAlt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={mainContent.dataAiHint}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
            </Link>
            <Button size="sm" variant="default" className="w-full" asChild>
                <Link href={mainContent.buttonLink} onClick={onLinkClick}>
                    {mainContent.buttonText}
                </Link>
            </Button>
        </div>
      </div>
    </div>
  );
}

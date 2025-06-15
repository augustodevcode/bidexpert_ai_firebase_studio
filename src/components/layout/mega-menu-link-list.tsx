
'use client';

import * as React from 'react';
import Link from 'next/link';
import { NavigationMenuLink } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

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

interface MegaMenuLinkListProps {
  groups: MegaMenuGroup[];
  onLinkClick?: () => void;
  gridCols?: string; // e.g., 'md:grid-cols-2'
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
            'flex select-none items-center space-x-3 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          {icon && <div className="text-primary">{icon}</div>}
          <div className="flex-grow">
            <div className="text-sm font-medium leading-none">{title}</div>
            {children && (
              <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                {children}
              </p>
            )}
          </div>
          {!children && <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />}
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = 'ListItem';

export default function MegaMenuLinkList({ groups, onLinkClick, gridCols = "md:grid-cols-1" }: MegaMenuLinkListProps) {
  if (!groups || groups.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">Nenhuma opção disponível.</p>;
  }

  return (
    <div className="p-2">
      {groups.map((group, groupIndex) => (
        <div key={group.title || `group-${groupIndex}`} className={groupIndex > 0 ? "mt-3 pt-3 border-t border-border/50" : ""}>
          {group.title && (
            <h4 className="px-3 py-2 text-sm font-semibold text-foreground">{group.title}</h4>
          )}
          <ul className={cn("grid w-[300px] gap-1 p-2 md:w-[350px] lg:w-[400px]", gridCols)}>
            {group.items.map((item) => (
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
      ))}
    </div>
  );
}

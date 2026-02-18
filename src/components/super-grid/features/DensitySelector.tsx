/**
 * @fileoverview Seletor de densidade do SuperGrid.
 * Permite alternar entre compact, normal e comfortable.
 */
'use client';

import { AlignJustify, AlignCenter, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { GridDensity } from '../SuperGrid.types';
import type { GridLocale } from '../SuperGrid.i18n';

interface DensitySelectorProps {
  density: GridDensity;
  onDensityChange: (density: GridDensity) => void;
  locale: GridLocale;
}

const densityKeys: Array<{
  value: GridDensity;
  localeKey: 'compact' | 'normal' | 'comfortable';
  icon: typeof AlignJustify;
}> = [
  { value: 'compact', localeKey: 'compact', icon: AlignJustify },
  { value: 'normal', localeKey: 'normal', icon: AlignCenter },
  { value: 'comfortable', localeKey: 'comfortable', icon: AlignLeft },
];

export function DensitySelector({
  density,
  onDensityChange,
  locale,
}: DensitySelectorProps) {
  return (
    <TooltipProvider>
      <div
        className="flex items-center rounded-md border"
        data-ai-id="supergrid-density-selector"
      >
        {densityKeys.map(opt => {
          const Icon = opt.icon;
          const isActive = density === opt.value;
          const label = locale.density[opt.localeKey];
          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-none first:rounded-l-md last:rounded-r-md"
                  onClick={() => onDensityChange(opt.value)}
                  data-ai-id={`supergrid-density-${opt.value}`}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

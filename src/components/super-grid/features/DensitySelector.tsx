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

interface DensitySelectorProps {
  density: GridDensity;
  onDensityChange: (density: GridDensity) => void;
}

const densityOptions: Array<{
  value: GridDensity;
  label: string;
  icon: typeof AlignJustify;
}> = [
  { value: 'compact', label: 'Compacto', icon: AlignJustify },
  { value: 'normal', label: 'Normal', icon: AlignCenter },
  { value: 'comfortable', label: 'Confortável', icon: AlignLeft },
];

export function DensitySelector({
  density,
  onDensityChange,
}: DensitySelectorProps) {
  return (
    <TooltipProvider>
      <div
        className="flex items-center rounded-md border"
        data-ai-id="supergrid-density-selector"
      >
        {densityOptions.map(opt => {
          const Icon = opt.icon;
          const isActive = density === opt.value;
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
                <p>{opt.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

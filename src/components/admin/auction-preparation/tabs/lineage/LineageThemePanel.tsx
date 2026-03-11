/**
 * @fileoverview Panel for customizing lineage node colors.
 * Provides a dropdown/popover with color swatch selection per node type.
 */
'use client';

import { Palette, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { COLOR_PRESETS } from './useLineageTheme';
import type { LineageNodeType } from '@/types/auction-lineage';

interface LineageThemePanelProps {
  overrides: Partial<Record<LineageNodeType, string>>;
  onSetColor: (nodeType: LineageNodeType, presetKey: string) => void;
  onReset: () => void;
}

const NODE_TYPE_LABELS: Record<LineageNodeType, string> = {
  auction: 'Leilão',
  seller: 'Vendedor',
  auctioneer: 'Leiloeiro',
  lot: 'Lote',
  asset: 'Ativo',
  category: 'Categoria',
  city: 'Cidade',
  state: 'Estado',
  stage: 'Praça',
  habilitation: 'Habilitação',
  'judicial-process': 'Processo',
  'judicial-branch': 'Vara/Foro',
  court: 'Tribunal',
};

/** Extracts the primary background color for a swatch preview */
function getSwatchColor(presetKey: string): string {
  const colors: Record<string, string> = {
    blue: 'bg-blue-400',
    orange: 'bg-orange-400',
    purple: 'bg-purple-400',
    emerald: 'bg-emerald-400',
    teal: 'bg-teal-400',
    amber: 'bg-amber-400',
    lime: 'bg-lime-400',
    cyan: 'bg-cyan-400',
    sky: 'bg-sky-400',
    indigo: 'bg-indigo-400',
    rose: 'bg-rose-400',
    red: 'bg-red-400',
    pink: 'bg-pink-400',
  };
  return colors[presetKey] || 'bg-gray-400';
}

export function LineageThemePanel({ overrides, onSetColor, onReset }: LineageThemePanelProps) {
  const nodeTypes = Object.keys(NODE_TYPE_LABELS) as LineageNodeType[];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-ai-id="lineage-theme-panel-trigger"
          aria-label="Personalizar cores do fluxo"
        >
          <Palette className="mr-2 h-4 w-4" />
          Cores
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 max-h-96 overflow-y-auto"
        side="bottom"
        align="end"
        data-ai-id="lineage-theme-panel-content"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Cores dos Nós</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              data-ai-id="lineage-theme-reset-button"
              aria-label="Restaurar cores padrão"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Resetar
            </Button>
          </div>
          <div className="space-y-2">
            {nodeTypes.map((nodeType) => (
              <div key={nodeType} className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-24 shrink-0" id={`theme-label-${nodeType}`}>
                  {NODE_TYPE_LABELS[nodeType]}
                </label>
                <div className="flex gap-1 flex-wrap" role="radiogroup" aria-labelledby={`theme-label-${nodeType}`}>
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      onClick={() => onSetColor(nodeType, preset.key)}
                      className={cn(
                        'h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        getSwatchColor(preset.key),
                        overrides[nodeType] === preset.key
                          ? 'border-foreground scale-110'
                          : 'border-transparent'
                      )}
                      title={preset.name}
                      aria-label={`${preset.name} para ${NODE_TYPE_LABELS[nodeType]}`}
                      role="radio"
                      aria-checked={overrides[nodeType] === preset.key}
                      data-ai-id={`lineage-theme-swatch-${nodeType}-${preset.key}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

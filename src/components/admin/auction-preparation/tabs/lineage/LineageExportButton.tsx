/**
 * @fileoverview Button to export the lineage canvas as a PNG/PDF image.
 * Uses html-to-image for canvas capture.
 */
'use client';

import { useCallback, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LineageExportButtonProps {
  /** CSS selector or ref id for the ReactFlow wrapper element */
  canvasSelector: string;
  fileName?: string;
}

export function LineageExportButton({
  canvasSelector,
  fileName = 'linhagem-leilao',
}: LineageExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    const element = document.querySelector(canvasSelector) as HTMLElement | null;
    if (!element) return;

    setIsExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(element, {
        backgroundColor: 'white',
        pixelRatio: 2,
        filter: (node) => {
          // Exclude ReactFlow controls/minimap from export
          const classList = (node as HTMLElement).classList;
          if (!classList) return true;
          return (
            !classList.contains('react-flow__minimap') &&
            !classList.contains('react-flow__controls')
          );
        },
      });

      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('[LineageExport] Failed to export:', err);
    } finally {
      setIsExporting(false);
    }
  }, [canvasSelector, fileName]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      data-ai-id="lineage-export-button"
      aria-label="Exportar linhagem como imagem"
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Exportar
    </Button>
  );
}

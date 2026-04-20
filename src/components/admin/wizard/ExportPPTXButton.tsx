'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Presentation, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';

interface ExportPPTXButtonProps {
  targetId: string;
  filename?: string;
  className?: string;
}

export function ExportPPTXButton({ targetId, filename = 'Apresentacao-Wizard', className }: ExportPPTXButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const element = document.getElementById(targetId);
      
      if (!element) {
        throw new Error('Elemento não encontrado na página.');
      }

      toast({
        title: 'Gerando Apresentação...',
        description: 'Aguarde enquanto preparamos a imagem da tela...',
      });

      // We use html-to-image to capture the exact layout of the target element.
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2, // High resolution
        backgroundColor: '#ffffff', // Ensures background is not transparent
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        },
      });

      // Create a pptx presentation
      const PptxGenModule = await import('pptxgenjs');
      const PptxGen = PptxGenModule.default || PptxGenModule;
      const pptx = new PptxGen();

      // Add a slide
      const slide = pptx.addSlide();
      
      // Calculate aspect ratio. Widescreen is often 16:9 (approx 10x5.625 inches).
      const elementRect = element.getBoundingClientRect();
      const aspectRatio = elementRect.width / elementRect.height;
      const slideAspect = 16 / 9;

      let imgWidth, imgHeight, imgX, imgY;

      if (aspectRatio > slideAspect) {
        // Image is wider than slide, set width to max (10) and calc height
        imgWidth = 10;
        imgHeight = 10 / aspectRatio;
        imgX = 0;
        imgY = (5.625 - imgHeight) / 2; // Center vertically
      } else {
        // Image is taller than slide, set height to max (5.625) and calc width
        imgHeight = 5.625;
        imgWidth = 5.625 * aspectRatio;
        imgY = 0;
        imgX = (10 - imgWidth) / 2; // Center horizontally
      }

      slide.addImage({
        data: dataUrl,
        x: imgX,
        y: imgY,
        w: imgWidth,
        h: imgHeight,
        sizing: { type: 'contain', w: 10, h: 5.625 }
      });

      // Save to file
      await pptx.writeFile({ fileName: `${filename}.pptx` });

      toast({
        title: 'Sucesso!',
        description: 'Apresentação PPTX gerada e baixada com sucesso.',
      });
      
    } catch (error) {
      console.error('Erro ao exportar para PPTX:', error);
      toast({
        title: 'Erro ao Exportar',
        description: 'Não foi possível gerar a apresentação. Verifique o console para mais detalhes.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={handleExport}
      disabled={isExporting}
      title="Exportar página e fluxo para PowerPoint"
    >
      {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Presentation className="mr-2 h-4 w-4" />}
      {isExporting ? 'Exportando...' : 'Exportar PPTX'}
    </Button>
  );
}

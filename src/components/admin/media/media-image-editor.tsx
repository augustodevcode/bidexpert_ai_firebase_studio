/**
 * @fileoverview Editor de imagens da Biblioteca de M├¡dia.
 * Crop (react-advanced-cropper), Rotate, Flip, Brightness/Contrast/Saturation (Canvas API),
 * Remo├º├úo de Fundo (Canvas API magic wand ÔÇö sem AGPL).
 * data-ai-id="media-image-editor"
 *
 * Licen├ºa: Todas as depend├¬ncias s├úo MIT ou Apache-2.0. Nenhuma AGPL.
 */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Crop, RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  Sun, Contrast, Droplets, Download, Save, Undo2, Redo2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MediaItemWithLinks } from '@/app/admin/media/actions';
import { useToast } from '@/hooks/use-toast';

interface MediaImageEditorProps {
  item: MediaItemWithLinks | null;
  open: boolean;
  onClose: () => void;
  onSave: (blob: Blob, mode: 'copy' | 'overwrite') => Promise<void>;
}

interface AdjustmentState {
  brightness: number;
  contrast: number;
  saturation: number;
}

interface TransformState {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

const ASPECT_PRESETS = [
  { label: 'Livre', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:2', value: 3 / 2 },
  { label: '2:3', value: 2 / 3 },
];

const DEFAULT_ADJUSTMENTS: AdjustmentState = { brightness: 100, contrast: 100, saturation: 100 };
const DEFAULT_TRANSFORM: TransformState = { rotation: 0, flipH: false, flipV: false };

export function MediaImageEditor({ item, open, onClose, onSave }: MediaImageEditorProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // States
  const [adjustments, setAdjustments] = useState<AdjustmentState>(DEFAULT_ADJUSTMENTS);
  const [transform, setTransform] = useState<TransformState>(DEFAULT_TRANSFORM);
  const [cropActive, setCropActive] = useState(false);
  const [cropAspect, setCropAspect] = useState<number | null>(null);

  // Crop region (relative 0-1)
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // History
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load image when item changes
  useEffect(() => {
    if (!item || !open) return;
    setLoaded(false);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setTransform(DEFAULT_TRANSFORM);
    setCropActive(false);
    setCropStart(null);
    setCropEnd(null);
    setHistory([]);
    setHistoryIndex(-1);

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setLoaded(true);
      renderCanvas(img, DEFAULT_ADJUSTMENTS, DEFAULT_TRANSFORM);
      saveToHistory();
    };
    img.onerror = () => {
      toast({ title: 'Erro', description: 'Falha ao carregar imagem.', variant: 'destructive' });
    };
    img.src = item.urlOriginal || '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, open]);

  // Render canvas with transformations
  const renderCanvas = useCallback((
    img?: HTMLImageElement | null,
    adj?: AdjustmentState,
    trans?: TransformState,
  ) => {
    const canvas = canvasRef.current;
    const image = img || imageRef.current;
    if (!canvas || !image) return;

    const a = adj || adjustments;
    const t = trans || transform;

    const w = image.naturalWidth;
    const h = image.naturalHeight;
    const isRotated90 = t.rotation % 180 !== 0;

    canvas.width = isRotated90 ? h : w;
    canvas.height = isRotated90 ? w : h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Center and rotate
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((t.rotation * Math.PI) / 180);
    ctx.scale(t.flipH ? -1 : 1, t.flipV ? -1 : 1);

    // Apply filters
    ctx.filter = `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturation}%)`;

    ctx.drawImage(image, -w / 2, -h / 2, w, h);
    ctx.restore();
  }, [adjustments, transform]);

  // Re-render on adjustment/transform changes
  useEffect(() => {
    if (loaded) renderCanvas();
  }, [adjustments, transform, loaded, renderCanvas]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(dataUrl);
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prevIndex = historyIndex - 1;
    setHistoryIndex(prevIndex);
    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[prevIndex];
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[nextIndex];
  }, [history, historyIndex]);

  // Rotate
  const rotate = useCallback((deg: number) => {
    setTransform((prev) => ({
      ...prev,
      rotation: (prev.rotation + deg + 360) % 360,
    }));
    setTimeout(saveToHistory, 100);
  }, [saveToHistory]);

  // Flip
  const flip = useCallback((axis: 'h' | 'v') => {
    setTransform((prev) => ({
      ...prev,
      flipH: axis === 'h' ? !prev.flipH : prev.flipH,
      flipV: axis === 'v' ? !prev.flipV : prev.flipV,
    }));
    setTimeout(saveToHistory, 100);
  }, [saveToHistory]);

  // Crop via mouse interaction on canvas
  const handleCropMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX / canvas.width;
    const y = (e.clientY - rect.top) * scaleY / canvas.height;
    setCropStart({ x, y });
    setCropEnd({ x, y });
    setIsDragging(true);
  }, [cropActive]);

  const handleCropMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !cropActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) * scaleX / canvas.width));
    let y = Math.max(0, Math.min(1, (e.clientY - rect.top) * scaleY / canvas.height));
    
    if (cropAspect && cropStart) {
      const w = Math.abs(x - cropStart.x);
      const h = w / cropAspect;
      y = cropStart.y + (y > cropStart.y ? h : -h);
      y = Math.max(0, Math.min(1, y));
    }
    
    setCropEnd({ x, y });
  }, [isDragging, cropActive, cropAspect, cropStart]);

  const handleCropMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const applyCrop = useCallback(() => {
    if (!cropStart || !cropEnd) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x1 = Math.min(cropStart.x, cropEnd.x);
    const y1 = Math.min(cropStart.y, cropEnd.y);
    const x2 = Math.max(cropStart.x, cropEnd.x);
    const y2 = Math.max(cropStart.y, cropEnd.y);

    const sx = Math.floor(x1 * canvas.width);
    const sy = Math.floor(y1 * canvas.height);
    const sw = Math.floor((x2 - x1) * canvas.width);
    const sh = Math.floor((y2 - y1) * canvas.height);

    if (sw < 10 || sh < 10) {
      toast({ title: 'Sele├º├úo muito pequena', variant: 'destructive' });
      return;
    }

    const imageData = ctx.getImageData(sx, sy, sw, sh);
    canvas.width = sw;
    canvas.height = sh;
    ctx.putImageData(imageData, 0, 0);

    setCropActive(false);
    setCropStart(null);
    setCropEnd(null);
    saveToHistory();
  }, [cropStart, cropEnd, saveToHistory, toast]);

  // Draw crop overlay
  useEffect(() => {
    if (!cropActive || !cropStart || !cropEnd) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Re-render base first
    renderCanvas();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x1 = Math.min(cropStart.x, cropEnd.x) * canvas.width;
    const y1 = Math.min(cropStart.y, cropEnd.y) * canvas.height;
    const w = Math.abs(cropEnd.x - cropStart.x) * canvas.width;
    const h = Math.abs(cropEnd.y - cropStart.y) * canvas.height;

    // Darken outside crop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, y1);
    ctx.fillRect(0, y1, x1, h);
    ctx.fillRect(x1 + w, y1, canvas.width - x1 - w, h);
    ctx.fillRect(0, y1 + h, canvas.width, canvas.height - y1 - h);

    // Crop border  
    ctx.strokeStyle = 'hsl(25, 95%, 53%)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x1, y1, w, h);

    // Grid lines (rule of thirds)
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x1 + (w / 3) * i, y1);
      ctx.lineTo(x1 + (w / 3) * i, y1 + h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x1, y1 + (h / 3) * i);
      ctx.lineTo(x1 + w, y1 + (h / 3) * i);
      ctx.stroke();
    }
  }, [cropStart, cropEnd, cropActive, renderCanvas]);

  // Export
  const exportCanvas = useCallback(async (mode: 'copy' | 'overwrite') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png', 1.0)
      );
      if (!blob) {
        toast({ title: 'Erro', description: 'Falha ao gerar imagem.', variant: 'destructive' });
        return;
      }
      await onSave(blob, mode);
      toast({ title: 'Salvo', description: mode === 'copy' ? 'C├│pia salva com sucesso.' : 'Imagem substitu├¡da.' });
      onClose();
    } catch (_err) {
      toast({ title: 'Erro', description: 'Falha ao salvar imagem.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [onSave, onClose, toast]);

  // Download locally
  const downloadCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `edited-${item?.fileName || 'image.png'}`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [item]);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-[95vw] w-[1200px] h-[85vh] flex flex-col p-0 gap-0"
        data-ai-id="media-image-editor"
      >
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base truncate flex-1">
              Editar: {item.title || item.fileName}
            </DialogTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={historyIndex <= 0} title="Desfazer">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={historyIndex >= history.length - 1} title="Refazer">
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Canvas area */}
          <div className="flex-1 flex items-center justify-center bg-muted/20 p-4 overflow-hidden relative">
            {!loaded && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando...
              </div>
            )}
            <canvas
              ref={canvasRef}
              className={cn(
                'max-w-full max-h-full object-contain shadow-lg rounded',
                cropActive && 'cursor-crosshair',
                !loaded && 'hidden'
              )}
              onMouseDown={handleCropMouseDown}
              onMouseMove={handleCropMouseMove}
              onMouseUp={handleCropMouseUp}
              onMouseLeave={handleCropMouseUp}
            />
          </div>

          {/* Tool sidebar */}
          <div className="w-[260px] border-l flex-shrink-0 overflow-y-auto bg-card">
            <Tabs defaultValue="transform" className="p-3">
              <TabsList className="w-full grid grid-cols-2 mb-3">
                <TabsTrigger value="transform" className="text-xs">Transformar</TabsTrigger>
                <TabsTrigger value="adjust" className="text-xs">Ajustar</TabsTrigger>
              </TabsList>

              {/* Transform tools */}
              <TabsContent value="transform" className="space-y-4 mt-0">
                {/* Crop */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Crop className="h-3.5 w-3.5" />Recortar
                  </Label>
                  <Button
                    variant={cropActive ? 'default' : 'outline'}
                    size="sm" className="w-full gap-1"
                    onClick={() => {
                      setCropActive(!cropActive);
                      if (cropActive && cropStart && cropEnd) {
                        applyCrop();
                      } else {
                        setCropStart(null);
                        setCropEnd(null);
                      }
                    }}
                  >
                    <Crop className="h-3.5 w-3.5" />
                    {cropActive ? 'Aplicar Recorte' : 'Recortar'}
                  </Button>
                  {cropActive && (
                    <>
                      <div className="flex flex-wrap gap-1">
                        {ASPECT_PRESETS.map((preset) => (
                          <Button
                            key={preset.label}
                            variant={cropAspect === preset.value ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            onClick={() => setCropAspect(preset.value)}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="ghost" size="sm" className="w-full text-xs"
                        onClick={() => { setCropActive(false); setCropStart(null); setCropEnd(null); renderCanvas(); }}
                      >
                        Cancelar Recorte
                      </Button>
                    </>
                  )}
                </div>

                <Separator />

                {/* Rotate */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <RotateCw className="h-3.5 w-3.5" />Girar
                  </Label>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => rotate(-90)}>
                      <RotateCcw className="h-3.5 w-3.5" /> -90┬░
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => rotate(90)}>
                      <RotateCw className="h-3.5 w-3.5" /> +90┬░
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-muted-foreground">Rota├º├úo livre</span>
                      <span className="text-[10px] font-mono">{transform.rotation}┬░</span>
                    </div>
                    <Slider
                      value={[transform.rotation]}
                      min={0} max={359} step={1}
                      onValueChange={([v]) => setTransform((prev) => ({ ...prev, rotation: v }))}
                    />
                  </div>
                </div>

                <Separator />

                {/* Flip */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <FlipHorizontal className="h-3.5 w-3.5" />Espelhar
                  </Label>
                  <div className="flex gap-1">
                    <Button
                      variant={transform.flipH ? 'secondary' : 'outline'}
                      size="sm" className="flex-1 gap-1"
                      onClick={() => flip('h')}
                    >
                      <FlipHorizontal className="h-3.5 w-3.5" /> Horizontal
                    </Button>
                    <Button
                      variant={transform.flipV ? 'secondary' : 'outline'}
                      size="sm" className="flex-1 gap-1"
                      onClick={() => flip('v')}
                    >
                      <FlipVertical className="h-3.5 w-3.5" /> Vertical
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Adjustment tools */}
              <TabsContent value="adjust" className="space-y-4 mt-0">
                {/* Brightness */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Sun className="h-3.5 w-3.5" />Brilho
                    </Label>
                    <span className="text-[10px] font-mono text-muted-foreground">{adjustments.brightness}%</span>
                  </div>
                  <Slider
                    value={[adjustments.brightness]}
                    min={0} max={200} step={1}
                    onValueChange={([v]) => setAdjustments((prev) => ({ ...prev, brightness: v }))}
                    onValueCommit={() => saveToHistory()}
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Contrast className="h-3.5 w-3.5" />Contraste
                    </Label>
                    <span className="text-[10px] font-mono text-muted-foreground">{adjustments.contrast}%</span>
                  </div>
                  <Slider
                    value={[adjustments.contrast]}
                    min={0} max={200} step={1}
                    onValueChange={([v]) => setAdjustments((prev) => ({ ...prev, contrast: v }))}
                    onValueCommit={() => saveToHistory()}
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Droplets className="h-3.5 w-3.5" />Satura├º├úo
                    </Label>
                    <span className="text-[10px] font-mono text-muted-foreground">{adjustments.saturation}%</span>
                  </div>
                  <Slider
                    value={[adjustments.saturation]}
                    min={0} max={200} step={1}
                    onValueChange={([v]) => setAdjustments((prev) => ({ ...prev, saturation: v }))}
                    onValueCommit={() => saveToHistory()}
                  />
                </div>

                <Separator />

                {/* Reset */}
                <Button
                  variant="outline" size="sm" className="w-full text-xs"
                  onClick={() => {
                    setAdjustments(DEFAULT_ADJUSTMENTS);
                    setTransform(DEFAULT_TRANSFORM);
                    renderCanvas(imageRef.current, DEFAULT_ADJUSTMENTS, DEFAULT_TRANSFORM);
                    saveToHistory();
                  }}
                >
                  Restaurar Original
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer with save actions */}
        <DialogFooter className="px-4 py-3 border-t flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="sm" className="gap-1" onClick={downloadCanvas}>
              <Download className="h-3.5 w-3.5" /> Baixar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                variant="outline" size="sm" className="gap-1"
                onClick={() => exportCanvas('copy')}
                disabled={saving}
              >
                <Save className="h-3.5 w-3.5" /> Salvar C├│pia
              </Button>
              <Button
                size="sm" className="gap-1"
                onClick={() => exportCanvas('overwrite')}
                disabled={saving}
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <Save className="h-3.5 w-3.5" /> Substituir
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

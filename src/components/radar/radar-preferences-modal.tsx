// src/components/radar/radar-preferences-modal.tsx
/**
 * @fileoverview Modal para configuração de preferências do Radar de Leilões.
 * Permite ao usuário configurar alertas e monitoramentos personalizados.
 */
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Bell, Eye, Target, Tag, MapPin, Gavel, Clock, Plus, X, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { LotCategory } from '@/types';
import { cn } from '@/lib/utils';

const RADAR_PREFERENCES_KEY = 'bidexpert.radarPreferences';

export interface RadarPreferences {
  // Alertas
  alertsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  
  // Categorias de interesse
  categories: string[];
  
  // Faixa de preço
  priceRange: {
    min: number | null;
    max: number | null;
  };
  
  // Localização
  locations: string[];
  
  // Tipos de leilão
  auctionTypes: string[];
  
  // Urgência
  urgencyDays: number; // Alertar quando encerrar em X dias
  
  // Demanda
  minDemandScore: number; // Score mínimo para alertar
  
  // Desconto
  minDiscount: number; // Desconto mínimo em % para alertar
  
  // Palavras-chave
  keywords: string[];
}

const defaultPreferences: RadarPreferences = {
  alertsEnabled: true,
  emailNotifications: true,
  pushNotifications: false,
  categories: [],
  priceRange: { min: null, max: null },
  locations: [],
  auctionTypes: [],
  urgencyDays: 7,
  minDemandScore: 0,
  minDiscount: 0,
  keywords: [],
};

interface RadarPreferencesModalProps {
  categories: LotCategory[];
  isLoggedIn: boolean;
  onRequestLogin?: () => void;
  trigger?: React.ReactNode;
}

export default function RadarPreferencesModal({ 
  categories, 
  isLoggedIn, 
  onRequestLogin,
  trigger 
}: RadarPreferencesModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [preferences, setPreferences] = React.useState<RadarPreferences>(defaultPreferences);
  const [newKeyword, setNewKeyword] = React.useState('');
  const [newLocation, setNewLocation] = React.useState('');

  // Carregar preferências do localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(RADAR_PREFERENCES_KEY);
      if (stored) {
        try {
          setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
        } catch {
          setPreferences(defaultPreferences);
        }
      }
    }
  }, []);

  const handleSave = () => {
    if (!isLoggedIn) {
      onRequestLogin?.();
      return;
    }
    
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(RADAR_PREFERENCES_KEY, JSON.stringify(preferences));
    }
    
    toast({ 
      title: 'Preferências salvas!', 
      description: 'Seus alertas foram configurados com sucesso.' 
    });
    setOpen(false);
  };

  const toggleCategory = (categoryId: string) => {
    setPreferences(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const toggleAuctionType = (type: string) => {
    setPreferences(prev => ({
      ...prev,
      auctionTypes: prev.auctionTypes.includes(type)
        ? prev.auctionTypes.filter(t => t !== type)
        : [...prev.auctionTypes, type]
    }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !preferences.keywords.includes(newKeyword.trim())) {
      setPreferences(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setPreferences(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const addLocation = () => {
    if (newLocation.trim() && !preferences.locations.includes(newLocation.trim())) {
      setPreferences(prev => ({
        ...prev,
        locations: [...prev.locations, newLocation.trim()]
      }));
      setNewLocation('');
    }
  };

  const removeLocation = (location: string) => {
    setPreferences(prev => ({
      ...prev,
      locations: prev.locations.filter(l => l !== location)
    }));
  };

  const auctionTypeOptions = [
    { value: 'JUDICIAL', label: 'Judicial' },
    { value: 'EXTRAJUDICIAL', label: 'Extrajudicial' },
    { value: 'ONLINE', label: 'Online' },
    { value: 'PRESENCIAL', label: 'Presencial' },
    { value: 'MIXED', label: 'Misto' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar Radar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Configurar Radar de Oportunidades
          </DialogTitle>
          <DialogDescription>
            {isLoggedIn 
              ? 'Configure seus alertas e receba notificações sobre lotes que combinam com seu perfil.'
              : 'Faça login para salvar suas preferências e receber alertas personalizados.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="alerts" className="text-xs sm:text-sm">
              <Bell className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Alertas</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-xs sm:text-sm">
              <Tag className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Categorias</span>
            </TabsTrigger>
            <TabsTrigger value="filters" className="text-xs sm:text-sm">
              <Target className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Filtros</span>
            </TabsTrigger>
            <TabsTrigger value="keywords" className="text-xs sm:text-sm">
              <Eye className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Palavras</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4 pr-4">
            <TabsContent value="alerts" className="space-y-6 mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Ativar Alertas</Label>
                    <p className="text-sm text-muted-foreground">Receba notificações sobre oportunidades</p>
                  </div>
                  <Switch
                    checked={preferences.alertsEnabled}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, alertsEnabled: checked }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">Resumo diário de oportunidades</p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailNotifications: checked }))}
                    disabled={!preferences.alertsEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">Alertas em tempo real no navegador</p>
                  </div>
                  <Switch
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, pushNotifications: checked }))}
                    disabled={!preferences.alertsEnabled}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Alerta de Urgência
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Alertar quando lotes encerram em até {preferences.urgencyDays} dias
                  </p>
                  <Slider
                    value={[preferences.urgencyDays]}
                    onValueChange={([value]) => setPreferences(prev => ({ ...prev, urgencyDays: value }))}
                    min={1}
                    max={30}
                    step={1}
                    className="w-full"
                    disabled={!preferences.alertsEnabled}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 dia</span>
                    <span>30 dias</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-base">Categorias de Interesse</Label>
                <p className="text-sm text-muted-foreground">
                  Selecione as categorias que deseja monitorar ({preferences.categories.length} selecionadas)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(category => (
                  <div
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
                      preferences.categories.includes(category.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent'
                    )}
                  >
                    <Checkbox
                      checked={preferences.categories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <span className="text-sm">{category.name}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label className="text-base flex items-center gap-2">
                  <Gavel className="h-4 w-4" />
                  Tipos de Leilão
                </Label>
                <div className="flex flex-wrap gap-2">
                  {auctionTypeOptions.map(type => (
                    <Badge
                      key={type.value}
                      variant={preferences.auctionTypes.includes(type.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleAuctionType(type.value)}
                    >
                      {type.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-6 mt-0">
              <div className="space-y-3">
                <Label className="text-base">Faixa de Preço</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Mínimo (R$)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={preferences.priceRange.min || ''}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, min: e.target.value ? Number(e.target.value) : null }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Máximo (R$)</Label>
                    <Input
                      type="number"
                      placeholder="Sem limite"
                      value={preferences.priceRange.max || ''}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, max: e.target.value ? Number(e.target.value) : null }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base">Score de Demanda Mínimo</Label>
                <p className="text-sm text-muted-foreground">
                  Apenas mostrar lotes com score acima de {preferences.minDemandScore}%
                </p>
                <Slider
                  value={[preferences.minDemandScore]}
                  onValueChange={([value]) => setPreferences(prev => ({ ...prev, minDemandScore: value }))}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base">Desconto Mínimo</Label>
                <p className="text-sm text-muted-foreground">
                  Apenas mostrar lotes com desconto acima de {preferences.minDiscount}%
                </p>
                <Slider
                  value={[preferences.minDiscount]}
                  onValueChange={([value]) => setPreferences(prev => ({ ...prev, minDiscount: value }))}
                  min={0}
                  max={80}
                  step={5}
                  className="w-full"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localizações
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: São Paulo, Rio de Janeiro..."
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                  />
                  <Button variant="outline" size="icon" onClick={addLocation}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferences.locations.map(location => (
                    <Badge key={location} variant="secondary" className="gap-1">
                      {location}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeLocation(location)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="keywords" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-base">Palavras-chave de Monitoramento</Label>
                <p className="text-sm text-muted-foreground">
                  Adicione termos específicos que você deseja monitorar nos leilões
                </p>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: BMW, apartamento, maquinário..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <Button variant="outline" size="icon" onClick={addKeyword}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[100px] p-4 border rounded-lg bg-muted/30">
                {preferences.keywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma palavra-chave adicionada</p>
                ) : (
                  preferences.keywords.map(keyword => (
                    <Badge key={keyword} variant="default" className="gap-1 h-8">
                      {keyword}
                      <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeKeyword(keyword)} />
                    </Badge>
                  ))
                )}
              </div>

              <div className="rounded-lg border bg-primary/5 p-4">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Dica
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use palavras-chave específicas como marcas, modelos ou características 
                  para receber alertas mais precisos sobre oportunidades.
                </p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          {isLoggedIn ? (
            <Button onClick={handleSave}>
              Salvar Preferências
            </Button>
          ) : (
            <Button onClick={onRequestLogin}>
              Fazer Login para Salvar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook para usar as preferências do radar
export function useRadarPreferences(): RadarPreferences | null {
  const [preferences, setPreferences] = React.useState<RadarPreferences | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(RADAR_PREFERENCES_KEY);
      if (stored) {
        try {
          setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
        } catch {
          setPreferences(defaultPreferences);
        }
      } else {
        setPreferences(defaultPreferences);
      }
    }
  }, []);

  return preferences;
}

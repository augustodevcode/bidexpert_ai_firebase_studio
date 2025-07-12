
// src/app/admin/settings/settings-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { platformSettingsFormSchema, type PlatformSettingsFormValues } from './settings-form-schema';
import type { PlatformSettings, MapSettings, SearchPaginationType, StorageProviderType, VariableIncrementRule, BiddingSettings } from '@/types';
import { Loader2, Save, Palette, Fingerprint, Wrench, MapPin as MapIcon, Search as SearchIconLucide, Clock as ClockIcon, Link2, Database, PlusCircle, Trash2, ArrowUpDown, Zap, Rows, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


import { updatePlatformSettings } from './actions';

interface SettingsFormProps {
  initialData: PlatformSettings;
  activeSection: string;
  onUpdateSuccess?: () => void;
}

type DatabaseSystem = 'SAMPLE_DATA' | 'FIRESTORE' | 'MYSQL' | 'POSTGRES';

const defaultMapSettings: MapSettings = {
    defaultProvider: 'openstreetmap',
    googleMapsApiKey: '',
    staticImageMapZoom: 15,
    staticImageMapMarkerColor: 'blue',
};

const defaultBiddingSettings: BiddingSettings = {
  instantBiddingEnabled: true,
  getBidInfoInstantly: true,
  biddingInfoCheckIntervalSeconds: 1,
};


export default function SettingsForm({ initialData, activeSection, onUpdateSuccess }: SettingsFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [isSubmittingDb, setIsSubmittingDb] = React.useState(false);
  const [currentDb, setCurrentDb] = React.useState<DatabaseSystem>('SAMPLE_DATA');
  const [selectedDb, setSelectedDb] = React.useState<DatabaseSystem>('SAMPLE_DATA');

  const form = useForm<PlatformSettingsFormValues>({
    resolver: zodResolver(platformSettingsFormSchema),
    defaultValues: {
      siteTitle: initialData?.siteTitle || 'BidExpert',
      siteTagline: initialData?.siteTagline || 'Leilões Online Especializados',
      galleryImageBasePath: initialData?.galleryImageBasePath || '/uploads/media/',
      storageProvider: initialData?.storageProvider || 'local',
      firebaseStorageBucket: initialData?.firebaseStorageBucket || '',
      activeThemeName: initialData?.activeThemeName || null,
      themes: initialData?.themes || [],
      platformPublicIdMasks: initialData?.platformPublicIdMasks || { auctions: '', lots: '', auctioneers: '', sellers: ''},
      mapSettings: initialData?.mapSettings || defaultMapSettings,
      biddingSettings: initialData?.biddingSettings || defaultBiddingSettings,
      searchPaginationType: initialData?.searchPaginationType || 'loadMore',
      searchItemsPerPage: initialData?.searchItemsPerPage || 12,
      searchLoadMoreCount: initialData?.searchLoadMoreCount || 12,
      showCountdownOnLotDetail: initialData?.showCountdownOnLotDetail === undefined ? true : initialData.showCountdownOnLotDetail,
      showCountdownOnCards: initialData?.showCountdownOnCards === undefined ? true : initialData.showCountdownOnCards,
      showRelatedLotsOnLotDetail: initialData?.showRelatedLotsOnLotDetail === undefined ? true : initialData.showRelatedLotsOnLotDetail,
      relatedLotsCount: initialData?.relatedLotsCount || 5,
      variableIncrementTable: initialData?.variableIncrementTable || [],
      defaultListItemsPerPage: initialData?.defaultListItemsPerPage || 10,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variableIncrementTable',
  });
  
  React.useEffect(() => {
    function getCookie(name: string): string | undefined {
      if (typeof document === 'undefined') return undefined;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    }
    const dbFromCookie = getCookie('dev-config-db') as DatabaseSystem | undefined;
    const dbFromEnv = (process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA') as DatabaseSystem;
    const initialDb = dbFromCookie || dbFromEnv;
    setCurrentDb(initialDb);
    setSelectedDb(initialDb);
  }, []);

  React.useEffect(() => {
    form.reset({
        siteTitle: initialData?.siteTitle || 'BidExpert',
        siteTagline: initialData?.siteTagline || 'Leilões Online Especializados',
        galleryImageBasePath: initialData?.galleryImageBasePath || '/uploads/media/',
        storageProvider: initialData?.storageProvider || 'local',
        firebaseStorageBucket: initialData?.firebaseStorageBucket || '',
        activeThemeName: initialData?.activeThemeName || null,
        themes: initialData?.themes || [],
        platformPublicIdMasks: initialData?.platformPublicIdMasks || { auctions: '', lots: '', auctioneers: '', sellers: ''},
        mapSettings: initialData?.mapSettings || defaultMapSettings,
        biddingSettings: initialData?.biddingSettings || defaultBiddingSettings,
        searchPaginationType: initialData?.searchPaginationType || 'loadMore',
        searchItemsPerPage: initialData?.searchItemsPerPage || 12,
        searchLoadMoreCount: initialData?.searchLoadMoreCount || 12,
        showCountdownOnLotDetail: initialData?.showCountdownOnLotDetail === undefined ? true : initialData.showCountdownOnLotDetail,
        showCountdownOnCards: initialData?.showCountdownOnCards === undefined ? true : initialData.showCountdownOnCards,
        showRelatedLotsOnLotDetail: initialData?.showRelatedLotsOnLotDetail === undefined ? true : initialData.showRelatedLotsOnLotDetail,
        relatedLotsCount: initialData?.relatedLotsCount || 5,
        variableIncrementTable: initialData?.variableIncrementTable || [],
        defaultListItemsPerPage: initialData?.defaultListItemsPerPage || 10,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, form.reset]);
  
  const handleDatabaseChange = async () => {
    setIsSubmittingDb(true);
    try {
      const response = await fetch('/api/set-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: selectedDb }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Falha ao definir a configuração.');
      }
      toast({ title: "Configuração aplicada!", description: "A página será recarregada para usar a nova fonte de dados." });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      setIsSubmittingDb(false);
    }
  };

  const handleResetSetup = () => {
    if(typeof window !== 'undefined') {
        localStorage.removeItem('bidexpert_setup_complete');
        toast({ title: "Assistente Reiniciado", description: "A página será recarregada para iniciar a configuração."});
        setTimeout(() => window.location.href = '/setup', 1000);
    }
  };


  async function onSubmit(values: PlatformSettingsFormValues) {
    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...values,
        platformPublicIdMasks: values.platformPublicIdMasks || {},
        mapSettings: values.mapSettings || defaultMapSettings,
        biddingSettings: values.biddingSettings || defaultBiddingSettings,
        variableIncrementTable: values.variableIncrementTable || [],
      };
      const result = await updatePlatformSettings(dataToSubmit);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        onUpdateSuccess?.(); // Trigger re-fetch in parent
      } else {
        toast({
          title: 'Erro ao Salvar',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro Inesperado',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
      console.error("Unexpected error in settings form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const watchedStorageProvider = form.watch('storageProvider');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {activeSection === 'identity' && (
          <section className="space-y-6">
            <FormField
              control={form.control}
              name="siteTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Site</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: BidExpert Leilões" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    O título principal que aparecerá no cabeçalho e na aba do navegador.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="siteTagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tagline do Site (Slogan)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Seu parceiro especialista em leilões online." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    Uma frase curta que descreve o seu site, exibida abaixo do título no cabeçalho.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
                <FormLabel>Logo do Site (Em breve)</FormLabel>
                <FormControl>
                    <Input type="file" disabled />
                </FormControl>
                <FormDescription>Faça upload do logo principal da sua plataforma.</FormDescription>
            </FormItem>
            <FormItem>
                <FormLabel>Favicon (Em breve)</FormLabel>
                <FormControl>
                    <Input type="file" disabled />
                </FormControl>
                <FormDescription>Ícone que aparece na aba do navegador (formato .ico ou .png).</FormDescription>
            </FormItem>
          </section>
        )}

        {activeSection === 'general' && (
          <section className="space-y-6">
             <Card>
              <CardHeader>
                  <CardTitle className="text-md">Máscaras de ID Público</CardTitle>
                  <CardDescription>Defina prefixos para IDs públicos (ex: LEIL- para leilões). Deixe em branco para usar IDs gerados automaticamente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                  <FormField
                      control={form.control}
                      name="platformPublicIdMasks.auctions"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel className="text-sm">Leilões</FormLabel>
                              <FormControl><Input placeholder="Ex: LEIL-" {...field} value={field.value || ''} /></FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="platformPublicIdMasks.lots"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel className="text-sm">Lotes</FormLabel>
                              <FormControl><Input placeholder="Ex: LOTE-" {...field} value={field.value || ''} /></FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="platformPublicIdMasks.auctioneers"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel className="text-sm">Leiloeiros</FormLabel>
                              <FormControl><Input placeholder="Ex: LEILOE-" {...field} value={field.value || ''} /></FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="platformPublicIdMasks.sellers"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel className="text-sm">Comitentes</FormLabel>
                              <FormControl><Input placeholder="Ex: COMI-" {...field} value={field.value || ''} /></FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
              </CardContent>
            </Card>
             <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-md text-destructive">Zona de Perigo</CardTitle>
                    <CardDescription>Ações nesta seção podem ter efeitos significativos na aplicação.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Atenção</AlertTitle>
                      <AlertDescription>
                        Esta ação irá limpar a marcação de que o setup foi concluído e forçará o redirecionamento para o assistente de configuração na próxima vez que a página for carregada. Use apenas se precisar reconfigurar a aplicação do zero.
                      </AlertDescription>
                    </Alert>
                </CardContent>
                <CardFooter>
                    <Button variant="destructive" type="button" onClick={handleResetSetup}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Reiniciar Assistente de Configuração
                    </Button>
                </CardFooter>
            </Card>
          </section>
        )}
        
        {activeSection === 'database' && process.env.NODE_ENV === 'development' && (
          <section className="space-y-6">
              <p className="text-sm text-muted-foreground">Esta configuração é apenas para desenvolvimento e permite alternar entre fontes de dados. A alteração recarregará a página. A configuração ativa é <strong>{currentDb}</strong>.</p>
              <RadioGroup value={selectedDb} onValueChange={(value) => setSelectedDb(value as DatabaseSystem)} className="space-y-2">
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SAMPLE_DATA" id="db-sample" />
                      <Label htmlFor="db-sample">Dados de Exemplo (Rápido, sem persistência)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="FIRESTORE" id="db-firestore" />
                      <Label htmlFor="db-firestore">Firestore (Requer credenciais)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="MYSQL" id="db-mysql" />
                      <Label htmlFor="db-mysql">MySQL (Requer string de conexão)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="POSTGRES" id="db-postgres" />
                      <Label htmlFor="db-postgres">PostgreSQL (Requer string de conexão)</Label>
                  </div>
              </RadioGroup>
              <div className="pt-4">
                  <Button onClick={handleDatabaseChange} disabled={isSubmittingDb || currentDb === selectedDb} type="button">
                    {isSubmittingDb ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
                    Aplicar e Recarregar
                </Button>
              </div>
          </section>
        )}

        {activeSection === 'storage' && (
          <section className="space-y-6">
             <FormField
              control={form.control}
              name="galleryImageBasePath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caminho Base para Imagens (Local Storage)</FormLabel>
                  <FormControl>
                    <Input placeholder="/uploads/media/" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    Caminho na pasta `public` onde as imagens serão armazenadas. Ex: <code>/media/gallery/</code>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <FormField
              control={form.control}
              name="storageProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provedor de Armazenamento de Mídia</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'local'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o provedor de armazenamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="local">Servidor Local (Pasta Public)</SelectItem>
                      <SelectItem value="firebase">Firebase Cloud Storage</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Onde os arquivos da Biblioteca de Mídia serão salvos. "Local" é recomendado apenas para desenvolvimento. A alteração desta configuração requer uma reinicialização do servidor e deve ser feita através da variável de ambiente `STORAGE_PROVIDER`.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {watchedStorageProvider === 'firebase' && (
              <FormItem>
                <FormLabel>Nome do Bucket (Firebase Storage)</FormLabel>
                <Input
                  value={process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'Não configurado'}
                  readOnly
                  disabled
                />
                <FormDescription>
                  O nome do seu bucket no Firebase. Este valor é configurado através da variável de ambiente `FIREBASE_STORAGE_BUCKET`.
                </FormDescription>
              </FormItem>
            )}
          </section>
        )}

        {activeSection === 'appearance' && (
          <section className="space-y-6">
            <FormField
                control={form.control}
                name="showCountdownOnCards"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Exibir Cronômetro nos Cards</FormLabel>
                        <FormDescription>Mostrar contagem regressiva nos cards de lote (grade/lista).</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="showCountdownOnLotDetail"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Exibir Cronômetro Detalhado no Lote</FormLabel>
                        <FormDescription>Mostrar contagem regressiva na página de detalhes do lote.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="showRelatedLotsOnLotDetail"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Exibir Lotes Relacionados</FormLabel>
                        <FormDescription>Mostrar seção "Outros lotes do mesmo leilão" na página do lote.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}
            />
            {form.watch('showRelatedLotsOnLotDetail') && (
                <FormField
                    control={form.control}
                    name="relatedLotsCount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Quantidade de Lotes Relacionados</FormLabel>
                        <FormControl><Input type="number" min="1" max="20" {...field} value={field.value ?? 5} onChange={e => field.onChange(parseInt(e.target.value,10))} /></FormControl>
                        <FormDescription>Número de lotes relacionados a exibir (1-20).</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}
             <div className="p-6 border rounded-lg bg-muted/20 text-center">
              <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                A seção de Temas de Cores está em desenvolvimento.
              </p>
            </div>
          </section>
        )}
        
        {activeSection === 'listDisplay' && (
             <section className="space-y-6">
                <FormField
                    control={form.control}
                    name="defaultListItemsPerPage"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Itens por Página Padrão (Listas Admin)</FormLabel>
                        <FormControl><Input type="number" min="5" max="100" {...field} value={field.value ?? 10} onChange={e => field.onChange(parseInt(e.target.value,10))} /></FormControl>
                        <FormDescription>Número padrão de linhas exibidas nas tabelas do painel de administração.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Separator />
                <FormField
                control={form.control}
                name="searchPaginationType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo de Paginação na Busca Pública</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'loadMore'}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de paginação" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="loadMore">Botão "Carregar Mais"</SelectItem>
                        <SelectItem value="numberedPages">Páginas Numeradas</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormDescription>Como os resultados de busca serão paginados para os usuários.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                {form.watch('searchPaginationType') === 'numberedPages' && (
                <FormField
                    control={form.control}
                    name="searchItemsPerPage"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Itens por Página (Busca Pública)</FormLabel>
                        <FormControl><Input type="number" min="1" max="100" {...field} value={field.value ?? 12} onChange={e => field.onChange(parseInt(e.target.value,10))} /></FormControl>
                        <FormDescription>Número de itens por página para paginação numerada (1-100).</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                )}
                {form.watch('searchPaginationType') === 'loadMore' && (
                <FormField
                    control={form.control}
                    name="searchLoadMoreCount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Contagem "Carregar Mais" (Busca Pública)</FormLabel>
                        <FormControl><Input type="number" min="1" max="100" {...field} value={field.value ?? 12} onChange={e => field.onChange(parseInt(e.target.value,10))} /></FormControl>
                        <FormDescription>Número de itens a carregar ao clicar em "Carregar Mais" (1-100).</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                )}
            </section>
        )}

        {activeSection === 'bidding' && (
          <section className="space-y-6">
            <FormField
              control={form.control}
              name="biddingSettings.instantBiddingEnabled"
              render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                          <FormLabel>Ativar Lances Instantâneos (AJAX)</FormLabel>
                          <FormDescription>Permite que os lances sejam enviados sem recarregar a página.</FormDescription>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="biddingSettings.getBidInfoInstantly"
              render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                          <FormLabel>Atualizar Informações de Lance Instantaneamente</FormLabel>
                          <FormDescription>Busca por novos lances de outros usuários em tempo real (polling).</FormDescription>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
              )}
            />
            {form.watch('biddingSettings.getBidInfoInstantly') && (
              <FormField
                control={form.control}
                name="biddingSettings.biddingInfoCheckIntervalSeconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verificar Novos Lances a Cada (Segundos)</FormLabel>
                    <FormControl><Input type="number" min="1" max="60" {...field} value={field.value ?? 1} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl>
                    <FormDescription>Intervalo para verificar novos lances. Valores muito baixos podem sobrecarregar o servidor.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </section>
        )}

        {activeSection === 'variableIncrements' && (
          <section className="space-y-4">
            <FormItem>
              <FormLabel className="text-base font-semibold">Tabela de Incremento Variável de Lances</FormLabel>
              <FormDescription>Defina valores de incremento diferentes para faixas de preço de lance. O valor 'Até' de uma linha deve ser igual ao valor 'De' da linha seguinte.</FormDescription>
              {form.formState.errors.variableIncrementTable && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.variableIncrementTable.message}</p>
              )}
            </FormItem>

            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-x-2 gap-y-3 items-center text-xs text-muted-foreground font-medium px-2">
              <span>De (R$)</span>
              <span>Até (R$)</span>
              <span>Incremento (R$)</span>
              <span className="w-9"></span>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-x-2 items-start">
                <FormField
                  control={form.control}
                  name={`variableIncrementTable.${index}.from`}
                  render={({ field }) => <FormItem><FormControl><Input type="number" {...field} disabled={index > 0} /></FormControl><FormMessage className="text-xs" /></FormItem>}
                />
                <FormField
                  control={form.control}
                  name={`variableIncrementTable.${index}.to`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="number" {...field} value={field.value ?? ""} disabled={index === fields.length - 1} placeholder={index === fields.length - 1 ? 'Em diante' : ''} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variableIncrementTable.${index}.increment`}
                  render={({ field }) => <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage className="text-xs" /></FormItem>}
                />
                <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:text-destructive" onClick={() => remove(index)} disabled={fields.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button type="button" variant="outline" size="sm" onClick={() => {
                const lastValue = fields.length > 0 ? fields[fields.length - 1].to : 0;
                append({ from: lastValue || 0, to: null, increment: 0 })
              }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Faixa
            </Button>
          </section>
        )}

        {activeSection === 'maps' && (
          <section className="space-y-6">
             <FormField
                  control={form.control}
                  name="mapSettings.defaultProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provedor de Mapa Padrão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'openstreetmap'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o provedor de mapa padrão" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="google">Google Maps (Embed API)</SelectItem>
                          <SelectItem value="openstreetmap">OpenStreetMap (Embed)</SelectItem>
                          <SelectItem value="staticImage">Imagem Estática (Configurada no Lote)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Escolha o serviço de mapa que será usado por padrão no site.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="mapSettings.googleMapsApiKey"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Chave API do Google Maps (Opcional)</FormLabel>
                        <FormControl><Input placeholder="Sua chave API do Google Maps (se usar Google Maps)" {...field} value={field.value ?? ''} /></FormControl>
                        <FormDescription>Necessária se "Google Maps" for o provedor padrão ou para imagens estáticas do Google.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="mapSettings.staticImageMapZoom"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Zoom Padrão (Imagem Estática)</FormLabel>
                            <FormControl><Input type="number" min="1" max="20" {...field} value={field.value ?? 15}
                                 onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                             /></FormControl>
                            <FormDescription>Nível de zoom (1-20) para mapas estáticos (se usados).</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="mapSettings.staticImageMapMarkerColor"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Cor do Marcador (Imagem Estática)</FormLabel>
                            <FormControl><Input placeholder="Ex: red, blue, 0xFF0000" {...field} value={field.value ?? 'blue'} /></FormControl>
                            <FormDescription>Cor do marcador para mapas estáticos (se usados).</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
          </section>
        )}
        
        {activeSection !== 'database' && (
            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Configurações
              </Button>
            </div>
        )}
      </form>
    </Form>
  );
}

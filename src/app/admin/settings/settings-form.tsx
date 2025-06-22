
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import type { PlatformSettings, MapSettings, SearchPaginationType, StorageProviderType } from '@/types';
import { Loader2, Save, Palette, Fingerprint, Wrench, MapPin as MapIcon, Search as SearchIconLucide, Clock as ClockIcon, Link2, Database } from 'lucide-react'; // Renomeado Map para MapIcon para evitar conflito
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { updatePlatformSettings } from './actions';

interface SettingsFormProps {
  initialData: PlatformSettings;
  activeSection: string;
}

const defaultMapSettings: MapSettings = {
    defaultProvider: 'openstreetmap',
    googleMapsApiKey: '',
    staticImageMapZoom: 15,
    staticImageMapMarkerColor: 'blue',
};


export default function SettingsForm({ initialData, activeSection }: SettingsFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      searchPaginationType: initialData?.searchPaginationType || 'loadMore',
      searchItemsPerPage: initialData?.searchItemsPerPage || 12,
      searchLoadMoreCount: initialData?.searchLoadMoreCount || 12,
      showCountdownOnLotDetail: initialData?.showCountdownOnLotDetail === undefined ? true : initialData.showCountdownOnLotDetail,
      showCountdownOnCards: initialData?.showCountdownOnCards === undefined ? true : initialData.showCountdownOnCards,
      showRelatedLotsOnLotDetail: initialData?.showRelatedLotsOnLotDetail === undefined ? true : initialData.showRelatedLotsOnLotDetail,
      relatedLotsCount: initialData?.relatedLotsCount || 5,
    },
  });

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
        searchPaginationType: initialData?.searchPaginationType || 'loadMore',
        searchItemsPerPage: initialData?.searchItemsPerPage || 12,
        searchLoadMoreCount: initialData?.searchLoadMoreCount || 12,
        showCountdownOnLotDetail: initialData?.showCountdownOnLotDetail === undefined ? true : initialData.showCountdownOnLotDetail,
        showCountdownOnCards: initialData?.showCountdownOnCards === undefined ? true : initialData.showCountdownOnCards,
        showRelatedLotsOnLotDetail: initialData?.showRelatedLotsOnLotDetail === undefined ? true : initialData.showRelatedLotsOnLotDetail,
        relatedLotsCount: initialData?.relatedLotsCount || 5,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, form.reset]);


  async function onSubmit(values: PlatformSettingsFormValues) {
    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...values,
        platformPublicIdMasks: values.platformPublicIdMasks || {},
        mapSettings: values.mapSettings || defaultMapSettings,
      };
      const result = await updatePlatformSettings(dataToSubmit);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        router.refresh();
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
            <FormField
              control={form.control}
              name="galleryImageBasePath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caminho Base para Imagens (Local Storage)</FormLabel>
                  <FormControl>
                    <Input placeholder="/uploads/media_gallery/" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    Caminho na pasta `public` onde as imagens serão armazenadas. Ex: <code>/media/gallery/</code>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          </section>
        )}

        {activeSection === 'storage' && (
          <section className="space-y-6">
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
                    Onde os arquivos da Biblioteca de Mídia serão salvos. "Local" é recomendado apenas para desenvolvimento.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {watchedStorageProvider === 'firebase' && (
              <FormField
                control={form.control}
                name="firebaseStorageBucket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Bucket (Firebase Storage)</FormLabel>
                    <FormControl><Input placeholder="Ex: seu-projeto.appspot.com" {...field} value={field.value ?? ''} /></FormControl>
                    <FormDescription>O nome do seu bucket no Firebase Cloud Storage. Se deixado em branco, tentará usar a configuração padrão.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </section>
        )}

        {activeSection === 'appearance' && (
          <section className="space-y-6">
            <FormField
              control={form.control}
              name="searchPaginationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Paginação na Busca</FormLabel>
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
                  <FormDescription>Como os resultados de busca serão paginados.</FormDescription>
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
                    <FormLabel>Itens por Página (Busca)</FormLabel>
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
                    <FormLabel>Contagem "Carregar Mais" (Busca)</FormLabel>
                    <FormControl><Input type="number" min="1" max="100" {...field} value={field.value ?? 12} onChange={e => field.onChange(parseInt(e.target.value,10))} /></FormControl>
                    <FormDescription>Número de itens a carregar ao clicar em "Carregar Mais" (1-100).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
        
        <Separator />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </form>
    </Form>
  );
}

// src/components/ai/ai-suggestion-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, Wand2, Check } from 'lucide-react';
import type { SuggestListingDetailsOutput } from '@/app/auctions/create/actions';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface AISuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fetchSuggestionsAction: () => Promise<SuggestListingDetailsOutput>;
  onApplySuggestions: (suggestions: SuggestListingDetailsOutput) => void;
}

export default function AISuggestionModal({
  isOpen,
  onClose,
  fetchSuggestionsAction,
  onApplySuggestions,
}: AISuggestionModalProps) {
  const [suggestions, setSuggestions] = useState<SuggestListingDetailsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchSuggestions = async () => {
        setIsLoading(true);
        setError(null);
        setSuggestions(null);
        try {
          const result = await fetchSuggestionsAction();
          setSuggestions(result);
        } catch (err: any) {
          setError(err.message || "Não foi possível obter sugestões da IA.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchSuggestions();
    }
  }, [isOpen, fetchSuggestionsAction]);

  const handleApply = () => {
    if (suggestions) {
      onApplySuggestions(suggestions);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Lightbulb className="h-6 w-6 text-primary"/> Sugestões de Conteúdo da IA</DialogTitle>
          <DialogDescription>
            Analisamos os dados do seu leilão e geramos algumas sugestões para otimizar a listagem.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto px-1 pr-4">
            {isLoading && (
                <div className="flex items-center justify-center flex-col gap-3 text-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Analisando e gerando sugestões...</p>
                </div>
            )}
            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Erro ao Gerar Sugestões</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {suggestions && (
                <div className="space-y-4 text-sm">
                    <div className="space-y-1">
                        <Label className="font-semibold text-foreground">Título Sugerido:</Label>
                        <p className="p-2 bg-secondary rounded-md">{suggestions.suggestedTitle}</p>
                    </div>
                     <div className="space-y-1">
                        <Label className="font-semibold text-foreground">Descrição Sugerida:</Label>
                        <p className="p-2 bg-secondary rounded-md whitespace-pre-line">{suggestions.suggestedDescription}</p>
                    </div>
                     <div className="space-y-1">
                        <Label className="font-semibold text-foreground">Palavras-chave Sugeridas:</Label>
                        <p className="p-2 bg-secondary rounded-md text-muted-foreground">{suggestions.suggestedKeywords}</p>
                    </div>
                </div>
            )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="button" onClick={handleApply} disabled={isLoading || !suggestions}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Aplicar Sugestões
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```
- src/app/auctions/create/form-schema.ts
- src/app/auctions/create/page.tsx
- src/app/auctions/create/actions.ts

I will remove the entire `src/app/auctions/create` directory.

I will also modify `src/app/admin/auctions/[auctionId]/edit/page.tsx` to add a button to trigger the AI suggestions modal.
I will also need to import `AISuggestionModal` and `fetchListingDetailsSuggestions` action.

The `AuctionForm` needs a way to have its values updated externally. I'll pass a `ref` to it.
I'll create a `formRef` in `EditAuctionPage` and pass it to `AuctionForm`.
Then, in `onApplySuggestions` in `EditAuctionPage`, I'll use `formRef.current.setValue(...)` to update the form fields.

This seems like a solid plan.OK. Vamos em frente com o nosso backlog. A próxima tarefa é o **Item 7: Melhoria do Assistente de Criação de Leilões**, que já comecei.

A análise dos testes E2E revelou algumas lacunas na lógica do wizard, especialmente na forma como os dados são filtrados e como o fluxograma é apresentado.

**Plano de Ação:**

Vou abordar as três principais tarefas deste item:

1.  **Corrigir a Fonte de Bens para Loteamento:** Atualmente, na etapa de loteamento, os bens não são filtrados corretamente para leilões extrajudiciais. Vou ajustar a lógica em `src/app/admin/wizard/page.tsx` para que, em leilões não-judiciais, apenas os bens do comitente selecionado sejam exibidos.
2.  **Melhorar a Seleção do Comitente Judicial:** Quando um processo judicial é escolhido, o "comitente" (que nesse caso é a Vara ou outra entidade judicial) associado a esse processo deve ser selecionado automaticamente no formulário. Vou implementar essa lógica em `src/app/admin/judicial-processes/judicial-process-form.tsx`.
3.  **Aprimorar a Visualização do Fluxograma:** O fluxograma (`WizardFlow.tsx`) precisa refletir com mais clareza a bifurcação entre o caminho "Judicial" e os outros. Vou redesenhar o fluxo para que as fontes de bens (Bens do Processo vs. Bens do Comitente) e as etapas seguintes convirjam de forma mais lógica, melhorando a visualização para o usuário.

Vou aplicar todas essas melhorias agora.

<changes>
  <description>Refatoração do fluxo do wizard para lidar corretamente com a origem dos bens (judiciais vs. extrajudiciais) e melhorar a visualização do fluxograma. Adiciona a criação automática do comitente judicial e a seleção automática no formulário de processos.</description>
  <change>
    <file>/home/user/studio/src/app/admin/wizard/page.tsx</file>
    <content><![CDATA[// src/app/admin/wizard/page.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { WizardProvider, useWizard } from '@/components/admin/wizard/wizard-context';
import WizardStepper from '@/components/admin/wizard/wizard-stepper';
import Step1TypeSelection from '@/components/admin/wizard/steps/step-1-type-selection';
import Step2JudicialSetup from '@/components/admin/wizard/steps/step-2-judicial-setup';
import Step3AuctionDetails from '@/components/admin/wizard/steps/step-3-auction-details';
import Step4Lotting from '@/components/admin/wizard/steps/step-4-lotting';
import Step5Review from '@/components/admin/wizard/steps/step-5-review';
import { getWizardInitialData } from './actions';
import type { JudicialProcess, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, Bem, Auction, Court, JudicialDistrict, JudicialBranch, Lot } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Rocket, Loader2, Workflow, Eye, Search, Expand, PackagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import JudicialProcessForm from '@/app/admin/judicial-processes/judicial-process-form';
import { createJudicialProcessAction } from '@/app/admin/judicial-processes/actions';
import { createBem as createBemAction } from '@/app/admin/bens/actions';
import { Separator } from '@/components/ui/separator';
import WizardFlow from '@/components/admin/wizard/WizardFlow';
import WizardFlowModal from '@/components/admin/wizard/WizardFlowModal';
import BemForm from '@/app/admin/bens/bem-form';


const allSteps = [
  { id: 'type', title: 'Tipo de Leilão', description: 'Selecione a modalidade.' },
  { id: 'judicial', title: 'Dados Judiciais', description: 'Informações do processo.' },
  { id: 'auction', title: 'Dados do Leilão', description: 'Detalhes e datas.' },
  { id: 'lotting', title: 'Loteamento', description: 'Agrupe bens em lotes.' },
  { id: 'review', title: 'Revisão e Publicação', description: 'Revise e publique.' },
];

interface WizardDataForFetching {
    judicialProcesses: JudicialProcess[];
    categories: LotCategory[];
    auctioneers: AuctioneerProfileInfo[];
    sellers: SellerProfileInfo[];
    availableBens: Bem[];
    courts: Court[];
    districts: JudicialDistrict[];
    branches: JudicialBranch[];
}

function WizardContent({ 
    fetchedData, 
    isLoading, 
    refetchData, 
}: { 
    fetchedData: WizardDataForFetching | null;
    isLoading: boolean;
    refetchData: (newProcessIdToSelect?: string) => void;
}) {
  const { currentStep, wizardData, nextStep, prevStep, goToStep, setWizardData } = useWizard();
  const [wizardMode, setWizardMode] = useState<'main' | 'judicial_process' | 'bem'>('main');
  const [isDataRefetching, setIsDataRefetching] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);


  const stepsToUse = useMemo(() => {
    if (wizardData.auctionType === 'JUDICIAL') {
      return allSteps;
    }
    return allSteps.filter(step => step.id !== 'judicial');
  }, [wizardData.auctionType]);

  const currentStepId = stepsToUse[currentStep]?.id;
  
  const handleNextStep = () => {
    if (currentStepId === 'auction') {
      if (!wizardData.auctionDetails?.title || !wizardData.auctionDetails.auctioneerId || !wizardData.auctionDetails.sellerId) {
        toast({ title: "Campos Obrigatórios", description: "Por favor, preencha o título, leiloeiro e comitente do leilão.", variant: "destructive" });
        return;
      }
    }
    nextStep();
  };

  const handleLotCreation = () => {
    // This is called when lots are created, but we don't need a full refetch,
    // as the state is handled on the client. We can keep this for potential future use.
  };
  
  const handleProcessCreated = async (newProcessId?: string) => {
    toast({ title: "Sucesso!", description: "Processo judicial cadastrado." });
    setIsDataRefetching(true);
    await refetchData(newProcessId);
    setWizardMode('main');
    setIsDataRefetching(false);
  }
  
  const handleBemCreated = async () => {
    toast({ title: "Sucesso!", description: "Bem cadastrado com sucesso." });
    setIsDataRefetching(true);
    await refetchData(wizardData.judicialProcess?.id);
    setWizardMode('main');
    setIsDataRefetching(false);
  }

  const renderStep = () => {
    if (isLoading || !fetchedData) {
      return <div className="flex items-center justify-center h-full min-h-[250px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    if (wizardMode === 'judicial_process') {
      return (
        <JudicialProcessForm
          courts={fetchedData.courts}
          allDistricts={fetchedData.districts}
          allBranches={fetchedData.branches}
          sellers={fetchedData.sellers}
          onSubmitAction={createJudicialProcessAction}
          onSuccess={handleProcessCreated}
          onCancel={() => setWizardMode('main')}
          formTitle="Novo Processo Judicial (Wizard)"
          formDescription="Cadastre o processo. Você retornará ao assistente de leilão após salvar."
          submitButtonText="Criar e Voltar para o Leilão"
        />
      );
    }
    
    if (wizardMode === 'bem') {
      return (
        <BemForm
          initialData={{
            judicialProcessId: wizardData.auctionType === 'JUDICIAL' ? wizardData.judicialProcess?.id : undefined,
            sellerId: wizardData.auctionType !== 'JUDICIAL' ? wizardData.auctionDetails?.sellerId : undefined,
            status: 'DISPONIVEL',
          }}
          processes={fetchedData.judicialProcesses}
          categories={fetchedData.categories}
          sellers={fetchedData.sellers}
          onSubmitAction={createBemAction}
          onSuccess={handleBemCreated}
          onCancel={() => setWizardMode('main')}
          formTitle="Novo Bem (Wizard)"
          formDescription="Cadastre o bem. Ele ficará disponível para loteamento ao salvar."
          submitButtonText="Criar e Voltar ao Loteamento"
        />
      );
    }

    switch (currentStepId) {
      case 'type': return <Step1TypeSelection />;
      case 'judicial': return <Step2JudicialSetup processes={fetchedData.judicialProcesses} onAddNewProcess={() => setWizardMode('judicial_process')} />;
      case 'auction': return <Step3AuctionDetails categories={fetchedData.categories} auctioneers={fetchedData.auctioneers} sellers={fetchedData.sellers} />;
      case 'lotting': {
        const bensForLotting = useMemo(() => {
          if (!fetchedData?.availableBens) return [];

          if (wizardData.auctionType === 'JUDICIAL') {
            return wizardData.judicialProcess
              ? fetchedData.availableBens.filter(bem => bem.judicialProcessId === wizardData.judicialProcess!.id)
              : [];
          } else {
            return wizardData.auctionDetails?.sellerId
              ? fetchedData.availableBens.filter(bem => bem.sellerId === wizardData.auctionDetails!.sellerId)
              : [];
          }
        }, [fetchedData?.availableBens, wizardData.auctionType, wizardData.judicialProcess, wizardData.auctionDetails?.sellerId]);

        return <Step4Lotting 
                  availableBens={bensForLotting} 
                  auctionData={wizardData.auctionDetails as Partial<Auction>} 
                  onLotCreated={handleLotCreation}
               />;
      }
      case 'review': return <Step5Review />;
      default: return <div className="text-center py-10"><p>Etapa "{stepsToUse[currentStep]?.title || 'Próxima'}" em desenvolvimento.</p></div>;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Rocket className="h-7 w-7 mr-3 text-primary" />
                Assistente de Criação de Leilão
              </CardTitle>
              <CardDescription>Siga os passos para criar um novo leilão de forma completa e guiada.</CardDescription>
            </CardHeader>
          {wizardMode === 'main' ? (
            <>
              <CardContent className="p-6">
                <WizardStepper steps={stepsToUse} currentStep={currentStep} onStepClick={goToStep} />
                <div className="mt-8 p-6 border rounded-lg bg-background min-h-[300px]">
                  {renderStep()}
                </div>
              </CardContent>
              <CardFooter className="mt-8 flex justify-between p-6 pt-0">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 0 || isLoading || isDataRefetching}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>

                <div className="flex items-center gap-2">
                    {currentStepId === 'lotting' && (
                        <Button variant="secondary" type="button" onClick={() => setWizardMode('bem')} disabled={isLoading || isDataRefetching}>
                            <PackagePlus className="mr-2 h-4 w-4" /> Cadastrar Novo Bem
                        </Button>
                    )}
                    {currentStep < stepsToUse.length - 1 && (
                    <Button onClick={handleNextStep} disabled={isLoading || isDataRefetching}>
                        {isDataRefetching ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                        Próximo <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                    )}
                </div>
              </CardFooter>
            </>
          ) : (
            <CardContent className="p-6">
              {renderStep()}
            </CardContent>
          )}
        </Card>
        
        <Card className="shadow-lg mt-8">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center"><Workflow className="h-5 w-5 mr-2 text-primary" /> Visualização do Fluxo</CardTitle>
              <CardDescription>Uma visão geral do progresso atual do seu cadastro.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsFlowModalOpen(true)}>
              <Expand className="mr-2 h-4 w-4" /> Visão Ampliada
            </Button>
          </CardHeader>
          <CardContent className="h-96 w-full p-0">
            <WizardFlow />
          </CardContent>
        </Card>
      </div>
      
      <WizardFlowModal isOpen={isFlowModalOpen} onClose={() => setIsFlowModalOpen(false)} />
    </>
  );
}

function WizardPageContent() {
    const [fetchedData, setFetchedData] = useState<WizardDataForFetching | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    
    const { setWizardData } = useWizard();

    const loadData = useCallback(async (newProcessIdToSelect?: string) => {
        setIsLoadingData(true);
        const result = await getWizardInitialData();
        if (result.success) {
            const data = result.data as WizardDataForFetching;
            setFetchedData(data);
            
            if (newProcessIdToSelect) {
                const newProcess = data.judicialProcesses.find(p => p.id === newProcessIdToSelect);
                if (newProcess) {
                    setWizardData(prev => ({...prev, judicialProcess: newProcess}));
                }
            }
        } else {
            console.error("Failed to load wizard data:", result.message);
        }
        setIsLoadingData(false);
    }, [setWizardData]);

    useEffect(() => {
        loadData();
    }, [loadData]);


    if (isLoadingData || !fetchedData) {
      return (
        <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
    }

    return (
      <WizardContent 
        fetchedData={fetchedData} 
        isLoading={isLoadingData} 
        refetchData={loadData} 
      />
    );
}


export default function WizardPage() {
  return (
    <WizardProvider>
      <WizardPageContent />
    </WizardProvider>
  );
}

// src/app/admin/qa/page.tsx
/**
 * @fileoverview Página de Quality Assurance (QA) para administradores.
 * Este componente de cliente fornece uma interface para executar vários testes
 * automatizados (E2E, unidade, validação) com o clique de um botão. Ele
 * gerencia o estado de execução de cada teste, exibe a saída do console
 * e, em caso de falha, mostra a análise e recomendação gerada pela IA,
 * tornando-o um painel central para garantir a saúde da aplicação.
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
    runBiddingEndToEndTest,
    runHabilitationEndToEndTest, 
    runSellerEndToEndTest, 
    runAuctioneerEndToEndTest, 
    runCategoryEndToEndTest, 
    runCourtEndToEndTest,
    runJudicialDistrictEndToEndTest,
    runJudicialBranchEndToEndTest,
    runJudicialProcessEndToEndTest,
    runBemEndToEndTest,
    runLotEndToEndTest,
    runWizardEndToEndTest,
    runRoleEndToEndTest,
    runSubcategoryEndToEndTest,
    runStateEndToEndTest,
    runCityEndToEndTest,
    runUserEndToEndTest,
    runMenuContentTest,
    runModalitiesMenuTest,
    runMediaLibraryEndToEndTest,
    runPlatformSettingsTest,
    runAuctionDataValidationTest,
    runSearchAndFilterTest,
    analyzeErrorLogAction, // Import a nova ação
} from './actions';
import { Loader2, ClipboardCheck, PlayCircle, ServerCrash, CheckCircle, Copy, TestTube, TestTubeDiagonal, Library, Users, UserCheck, TestTube2, Palette, Settings, BarChart3, Landmark, Search, BrainCircuit, Rocket, Workflow, PackageCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

interface TestResult {
  output: string;
  error?: string;
  success: boolean;
  recommendation?: string;
}

interface TestConfig {
  id: string;
  title: string;
  description: string;
  action: () => Promise<TestResult>;
  icon: React.ElementType;
}

interface TestGroup {
    title: string;
    description: string;
    icon: React.ElementType;
    tests: TestConfig[];
}

const testGroups: TestGroup[] = [
    {
        title: "Simulações End-to-End",
        description: "Testes complexos que simulam fluxos completos de usuários, validando a integração de múltiplas funcionalidades.",
        icon: Workflow,
        tests: [
            { id: 'bidding-e2e', title: 'Simulação de Leilão (E2E)', description: 'Simula 5 usuários, habilitação e um leilão com lances e soft-close.', action: runBiddingEndToEndTest, icon: Users },
            { id: 'wizard-e2e', title: 'Simulação do Wizard (E2E)', description: 'Executa o fluxo completo do assistente de criação de leilões, desde a seleção do tipo até a publicação.', action: runWizardEndToEndTest, icon: Rocket },
            { id: 'habilitation-e2e', title: 'Habilitação de Licitante (E2E)', description: 'Simula o fluxo de um usuário enviando documentos, sendo aprovado e dando um lance.', action: runHabilitationEndToEndTest, icon: UserCheck }
        ]
    },
    {
        title: "Validação de Lógica de Negócio e UI",
        description: "Testes que verificam a integridade dos dados, a consistência da interface e as regras de negócio da plataforma.",
        icon: PackageCheck,
        tests: [
            { id: 'auction-data-validation', title: 'Validação de Dados de Leilões', description: 'Cria entidades e verifica se os dados de leilões e lotes são consistentes para a UI.', action: runAuctionDataValidationTest, icon: BarChart3 },
            { id: 'search-filter-validation', title: 'Validação de Busca e Filtro', description: 'Cria dados e valida a lógica de filtro e busca da camada de serviço.', action: runSearchAndFilterTest, icon: Search },
            { id: 'platform-settings', title: 'Configurações da Plataforma (E2E)', description: 'Valida a criação e atualização das configurações da plataforma via camada de serviço.', action: runPlatformSettingsTest, icon: Settings },
            { id: 'menu-content', title: 'Conteúdo Dinâmico dos Menus', description: 'Valida se os itens nos menus (Categorias, Leiloeiros, etc.) correspondem aos dados no banco.', action: runMenuContentTest, icon: TestTube2 },
            { id: 'modalities-menu', title: 'Menu de Modalidades', description: 'Verifica se o menu estático de modalidades contém os itens e links corretos.', action: runModalitiesMenuTest, icon: TestTube2 },
        ]
    },
    {
        title: "Testes de Unidade (CRUD por Entidade)",
        description: "Testes focados em validar a criação, leitura, atualização e exclusão (CRUD) de cada entidade do sistema.",
        icon: TestTubeDiagonal,
        tests: [
            { id: 'user-creation', title: 'Cadastro de Usuário', description: 'Verifica a criação de um usuário, hash de senha e atribuição de perfil padrão.', action: runUserEndToEndTest, icon: TestTube2 },
            { id: 'seller-creation', title: 'Cadastro de Comitente', description: 'Verifica o fluxo completo de criação de um novo comitente.', action: runSellerEndToEndTest, icon: TestTube2 },
            { id: 'auctioneer-creation', title: 'Cadastro de Leiloeiro', description: 'Verifica a criação de um novo leiloeiro e a integridade dos dados.', action: runAuctioneerEndToEndTest, icon: TestTube2 },
            { id: 'category-creation', title: 'Cadastro de Categoria', description: 'Verifica a criação de uma nova categoria de lote e a geração do slug.', action: runCategoryEndToEndTest, icon: TestTube2 },
            { id: 'subcategory-creation', title: 'Cadastro de Subcategoria', description: 'Verifica a criação de uma subcategoria e sua vinculação à categoria pai.', action: runSubcategoryEndToEndTest, icon: TestTube2 },
            { id: 'role-creation', title: 'Cadastro de Perfil (Role)', description: 'Verifica a criação de um novo perfil de usuário com permissões.', action: runRoleEndToEndTest, icon: TestTube2 },
            { id: 'state-creation', title: 'Cadastro de Estado', description: 'Verifica a criação de um novo estado e validação de UF duplicada.', action: runStateEndToEndTest, icon: TestTube2 },
            { id: 'city-creation', title: 'Cadastro de Cidade', description: 'Verifica a criação de uma cidade e sua vinculação com um estado.', action: runCityEndToEndTest, icon: TestTube2 },
            { id: 'court-creation', title: 'Cadastro de Tribunal', description: 'Verifica a criação de uma nova entidade de Tribunal no banco de dados.', action: runCourtEndToEndTest, icon: TestTube2 },
            { id: 'judicial-district-creation', title: 'Cadastro de Comarca', description: 'Verifica a criação de uma comarca e sua vinculação com estado e tribunal.', action: runJudicialDistrictEndToEndTest, icon: TestTube2 },
            { id: 'judicial-branch-creation', title: 'Cadastro de Vara', description: 'Verifica a criação de uma vara judicial e sua vinculação com uma comarca.', action: runJudicialBranchEndToEndTest, icon: TestTube2 },
            { id: 'judicial-process-creation', title: 'Cadastro de Processo', description: 'Verifica a criação de um processo judicial e a inclusão transacional de suas partes.', action: runJudicialProcessEndToEndTest, icon: TestTube2 },
            { id: 'bem-creation', title: 'Cadastro de Bem', description: 'Verifica a criação de um novo bem (ativo) e sua associação com categoria e comitente.', action: runBemEndToEndTest, icon: TestTube2 },
            { id: 'lot-creation', title: 'Cadastro de Lote', description: 'Verifica a criação de um lote e sua vinculação com bens e um leilão.', action: runLotEndToEndTest, icon: TestTube2 },
            { id: 'media-library', title: 'Upload de Mídia', description: 'Testa o endpoint de upload, criação de registro e salvamento do arquivo físico.', action: runMediaLibraryEndToEndTest, icon: Library },
        ]
    }
];


export default function QualityAssurancePage() {
    const { toast } = useToast();
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [runningTest, setRunningTest] = useState<string | null>(null);
    const [lastTestRun, setLastTestRun] = useState<string | null>(null);
    const [hasCopied, setHasCopied] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false); // Novo estado para análise

    const handleRunTest = async (testId: string) => {
        setRunningTest(testId);
        setLastTestRun(testId);
        setTestResult(null); // Limpa o resultado anterior

        const testToRun = testGroups.flatMap(g => g.tests).find(t => t.id === testId);
        if (!testToRun) return;

        const result = await testToRun.action();
        setTestResult(result);
        setRunningTest(null);
    };

    const handleCopyLog = () => {
        if (!testResult?.output && !testResult?.error) return;
        const logToCopy = `${testResult.recommendation || ''}\n\n--- FULL LOG ---\n${testResult.output}\n\n--- STDERR ---\n${testResult.error || 'N/A'}`;
        navigator.clipboard.writeText(logToCopy);
        setHasCopied(true);
        toast({ title: "Copiado!", description: "A recomendação da IA e o log de saída foram copiados." });
        setTimeout(() => setHasCopied(false), 2500);
    };

    const handleAnalyzeError = async () => {
      if (!testResult || !testResult.error) return;
      setIsAnalyzing(true);
      toast({ title: "Análise Iniciada", description: "Enviando o log de erro para a IA."});
      try {
        const result = await analyzeErrorWithLogsAction(testResult.error);
        if (result.success) {
          setTestResult(prev => ({
            ...prev!,
            recommendation: `**Análise:**\n${result.analysis}\n\n**Recomendação:**\n${result.recommendation}`
          }));
        } else {
          toast({ title: "Falha na Análise", description: result.recommendation, variant: "destructive" });
        }
      } catch (e: any) {
        toast({ title: "Erro Crítico na Análise", description: e.message, variant: "destructive" });
      } finally {
        setIsAnalyzing(false);
      }
    };


    return (
        <div className="space-y-8" data-ai-id="admin-qa-page-container">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-6 w-6 text-primary" />
                        Painel de Quality Assurance (QA)
                    </CardTitle>
                    <CardDescription>
                        Execute testes automatizados para verificar a integridade das funcionalidades críticas da plataforma.
                    </CardDescription>
                </CardHeader>
            </Card>

            {testGroups.map(group => (
                <Card key={group.title} className="shadow-md">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                           <group.icon className="h-5 w-5 text-primary" /> {group.title}
                        </CardTitle>
                        <CardDescription>{group.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {group.tests.map(test => (
                            <Card key={test.id} className="bg-secondary/30 flex flex-col">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <test.icon className="h-4 w-4 text-primary" />
                                        {test.title}
                                    </CardTitle>
                                    <CardDescription className="text-xs h-12">
                                        {test.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter className="mt-auto">
                                    <Button onClick={() => handleRunTest(test.id)} disabled={!!runningTest} className="w-full">
                                        {runningTest === test.id ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <PlayCircle className="mr-2 h-4 w-4" />
                                        )}
                                        {runningTest === test.id ? 'Executando...' : 'Rodar Teste'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            ))}

            {testResult && (
                <Card data-ai-id="qa-test-results-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          Resultados para: <span className="text-primary">{testGroups.flatMap(g=>g.tests).find(t => t.id === lastTestRun)?.title}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {testResult.success ? (
                            <Alert variant="default" className="bg-green-50 dark:bg-green-900/20 border-green-500/50">
                                <CheckCircle className="h-5 w-5 text-green-700 dark:text-green-300"/>
                                <AlertTitle className="font-bold text-green-800 dark:text-green-300">Teste Passou com Sucesso</AlertTitle>
                            </Alert>
                        ) : (
                            <div>
                                {testResult.recommendation ? (
                                    <Alert variant="destructive" className="mb-4">
                                        <BrainCircuit className="h-5 w-5" />
                                        <AlertTitle className="font-bold">Recomendação da IA</AlertTitle>
                                        <AlertDescription className="whitespace-pre-line text-sm leading-relaxed mt-2">
                                            {testResult.recommendation.split('================================================').join('')}
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                     <Alert variant="destructive" className="mb-4">
                                        <BrainCircuit className="h-5 w-5" />
                                        <AlertTitle className="font-bold">Análise da IA Falhou</AlertTitle>
                                        <AlertDescription className="whitespace-pre-line text-sm leading-relaxed mt-2">
                                            A análise automática falhou. Verifique o log abaixo e tente analisar manualmente.
                                            <Button size="sm" variant="outline" className="mt-3" onClick={handleAnalyzeError} disabled={isAnalyzing}>
                                                {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <BrainCircuit className="mr-2 h-4 w-4" />}
                                                Tentar Análise Manualmente
                                            </Button>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}
                        <div className="flex justify-between items-center mt-4 mb-2">
                             <h4 className="text-sm font-semibold">Saída do Console:</h4>
                             <Button variant="outline" size="sm" onClick={handleCopyLog} disabled={!testResult.output && !testResult.error}>
                                {hasCopied ? <CheckCircle className="mr-2 h-4 w-4 text-green-600"/> : <Copy className="mr-2 h-4 w-4"/>}
                                {hasCopied ? 'Copiado!' : 'Copiar Log'}
                             </Button>
                        </div>
                        <pre className="bg-muted text-muted-foreground p-4 rounded-md text-xs max-h-96 overflow-auto">{testResult.output || "Nenhuma saída no console."}</pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

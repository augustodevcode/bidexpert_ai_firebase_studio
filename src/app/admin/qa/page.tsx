// src/app/admin/qa/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    runRoleEndToEndTest,
    runSubcategoryEndToEndTest,
    runStateEndToEndTest,
    runCityEndToEndTest,
    runUserEndToEndTest,
    runMenuContentTest,
    runModalitiesMenuTest,
    runMediaLibraryEndToEndTest,
    runAuctionCardDetailsTest, // Import the new test action
} from './actions';
import { Loader2, ClipboardCheck, PlayCircle, ServerCrash, CheckCircle, Copy, TestTube, TestTubeDiagonal, Library, Users, UserCheck, TestTube2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  output: string;
  error?: string;
  success: boolean;
}

interface TestConfig {
  id: string;
  title: string;
  description: string;
  action: () => Promise<TestResult>;
  type: 'backend' | 'frontend' | 'simulation';
}

const tests: TestConfig[] = [
  {
    id: 'bidding-e2e',
    title: 'Simulação de Leilão (E2E)',
    description: 'Simula 5 usuários, habilitação e um leilão com lances e soft-close.',
    action: runBiddingEndToEndTest,
    type: 'simulation',
  },
   {
    id: 'habilitation-e2e',
    title: 'Habilitação de Licitante (E2E)',
    description: 'Simula o fluxo completo de um usuário enviando documentos, sendo aprovado e dando um lance.',
    action: runHabilitationEndToEndTest,
    type: 'simulation',
  },
  {
    id: 'auction-card-details-ui',
    title: 'Validação de Card de Leilão (UI)',
    description: 'Verifica se todos os dados dinâmicos (contadores, badges, etc.) são exibidos corretamente no card do leilão.',
    action: runAuctionCardDetailsTest,
    type: 'frontend',
  },
  {
    id: 'menu-content',
    title: 'Conteúdo Dinâmico dos Menus',
    description: 'Valida se os itens nos menus (Categorias, Leiloeiros, etc.) correspondem aos dados no banco.',
    action: runMenuContentTest,
    type: 'backend', 
  },
  {
    id: 'modalities-menu',
    title: 'Menu de Modalidades',
    description: 'Verifica se o menu estático de modalidades contém os itens e links corretos.',
    action: runModalitiesMenuTest,
    type: 'backend',
  },
  {
    id: 'user-creation',
    title: 'Cadastro de Usuário',
    description: 'Verifica a criação de um usuário, hash de senha e atribuição de perfil padrão.',
    action: runUserEndToEndTest,
    type: 'backend',
  },
  {
    id: 'seller-creation',
    title: 'Cadastro de Comitente',
    description: 'Verifica o fluxo completo de criação de um novo comitente.',
    action: runSellerEndToEndTest,
    type: 'backend',
  },
  {
    id: 'auctioneer-creation',
    title: 'Cadastro de Leiloeiro',
    description: 'Verifica a criação de um novo leiloeiro e a integridade dos dados.',
    action: runAuctioneerEndToEndTest,
    type: 'backend',
  },
  {
    id: 'category-creation',
    title: 'Cadastro de Categoria',
    description: 'Verifica a criação de uma nova categoria de lote e a geração do slug.',
    action: runCategoryEndToEndTest,
    type: 'backend',
  },
   {
    id: 'subcategory-creation',
    title: 'Cadastro de Subcategoria',
    description: 'Verifica a criação de uma subcategoria e sua vinculação à categoria pai.',
    action: runSubcategoryEndToEndTest,
    type: 'backend',
  },
   {
    id: 'role-creation',
    title: 'Cadastro de Perfil (Role)',
    description: 'Verifica a criação de um novo perfil de usuário com permissões.',
    action: runRoleEndToEndTest,
    type: 'backend',
  },
   {
    id: 'state-creation',
    title: 'Cadastro de Estado',
    description: 'Verifica a criação de um novo estado e validação de UF duplicada.',
    action: runStateEndToEndTest,
    type: 'backend',
  },
  {
    id: 'city-creation',
    title: 'Cadastro de Cidade',
    description: 'Verifica a criação de uma cidade e sua vinculação com um estado.',
    action: runCityEndToEndTest,
    type: 'backend',
  },
  {
    id: 'court-creation',
    title: 'Cadastro de Tribunal',
    description: 'Verifica a criação de uma nova entidade de Tribunal no banco de dados.',
    action: runCourtEndToEndTest,
    type: 'backend',
  },
  {
    id: 'judicial-district-creation',
    title: 'Cadastro de Comarca',
    description: 'Verifica a criação de uma comarca e sua vinculação com estado e tribunal.',
    action: runJudicialDistrictEndToEndTest,
    type: 'backend',
  },
  {
    id: 'judicial-branch-creation',
    title: 'Cadastro de Vara',
    description: 'Verifica a criação de uma vara judicial e sua vinculação com uma comarca.',
    action: runJudicialBranchEndToEndTest,
    type: 'backend',
  },
  {
    id: 'judicial-process-creation',
    title: 'Cadastro de Processo',
    description: 'Verifica a criação de um processo judicial e a inclusão transacional de suas partes.',
    action: runJudicialProcessEndToEndTest,
    type: 'backend',
  },
  {
    id: 'bem-creation',
    title: 'Cadastro de Bem',
    description: 'Verifica a criação de um novo bem (ativo) e sua associação com categoria e comitente.',
    action: runBemEndToEndTest,
    type: 'backend',
  },
  {
    id: 'lot-creation',
    title: 'Cadastro de Lote',
    description: 'Verifica a criação de um lote e sua vinculação com bens e um leilão.',
    action: runLotEndToEndTest,
    type: 'backend',
  },
  {
    id: 'media-library',
    title: 'Upload de Mídia',
    description: 'Testa o endpoint de upload, criação de registro e salvamento do arquivo físico.',
    action: runMediaLibraryEndToEndTest,
    type: 'backend',
  },
];

export default function QualityAssurancePage() {
    const { toast } = useToast();
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [runningTest, setRunningTest] = useState<string | null>(null);
    const [lastTestRun, setLastTestRun] = useState<string | null>(null);
    const [hasCopied, setHasCopied] = useState(false);

    const handleRunTest = async (testId: string) => {
        setRunningTest(testId);
        setLastTestRun(testId);
        setTestResult(null);

        const testToRun = tests.find(t => t.id === testId);
        if (!testToRun) return;

        const result = await testToRun.action();
        setTestResult(result);
        setRunningTest(null);
    };

    const handleCopyLog = () => {
        if (!testResult?.output && !testResult?.error) return;
        const logToCopy = `--- STDOUT ---\n${testResult.output}\n\n--- STDERR ---\n${testResult.error || 'N/A'}`;
        navigator.clipboard.writeText(logToCopy);
        setHasCopied(true);
        toast({ title: "Log Copiado!", description: "O log de saída do console foi copiado para a área de transferência." });
        setTimeout(() => setHasCopied(false), 2500);
    };

    const getIconForTestType = (type: TestConfig['type']) => {
        switch(type) {
            case 'simulation': return <Users className="h-4 w-4 text-primary" />;
            case 'backend': return <TestTubeDiagonal className="h-4 w-4 text-primary"/>;
            case 'frontend': return <TestTube2 className="h-4 w-4 text-primary" />;
            default: return <TestTube className="h-4 w-4 text-primary" />;
        }
    }

    return (
        <div className="space-y-6">
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
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tests.map(test => (
                        <Card key={test.id} className="bg-secondary/30">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                     {getIconForTestType(test.type)}
                                     {test.title}
                                </CardTitle>
                                <CardDescription>{test.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={() => handleRunTest(test.id)} disabled={!!runningTest}>
                                    {runningTest === test.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <PlayCircle className="mr-2 h-4 w-4" />
                                    )}
                                    {runningTest === test.id ? 'Executando...' : 'Rodar Teste'}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            {testResult && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          Resultados para: <span className="text-primary">{tests.find(t => t.id === lastTestRun)?.title}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {testResult.error || !testResult.success ? (
                            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                                <div className="flex items-center gap-2 text-destructive font-bold">
                                    <ServerCrash className="h-5 w-5" />
                                    <span>Teste Falhou</span>
                                </div>
                                {testResult.error && (
                                  <pre className="mt-2 whitespace-pre-wrap text-xs font-mono bg-background p-2 rounded max-h-80 overflow-auto">{testResult.error}</pre>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md">
                                <div className="flex items-center gap-2 text-green-700 font-bold">
                                    <CheckCircle className="h-5 w-5" />
                                    <span>Teste Passou com Sucesso</span>
                                </div>
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

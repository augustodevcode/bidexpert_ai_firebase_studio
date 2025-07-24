// src/app/admin/qa/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    runSellerEndToEndTest, 
    runAuctioneerEndToEndTest, 
    runCategoryEndToEndTest, 
    runCourtEndToEndTest,
    runJudicialDistrictEndToEndTest,
    runJudicialBranchEndToEndTest,
    runJudicialProcessEndToEndTest,
    runBemEndToEndTest,
    runAuctionEndToEndTest,
    runLotEndToEndTest,
    runRoleEndToEndTest,
    runSubcategoryEndToEndTest // Import the new test action
} from './actions';
import { Loader2, ClipboardCheck, PlayCircle, ServerCrash, CheckCircle, Copy } from 'lucide-react';
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
}

const tests: TestConfig[] = [
  {
    id: 'seller-creation',
    title: 'Teste de Cadastro de Comitente',
    description: 'Verifica o fluxo completo de criação de um novo comitente.',
    action: runSellerEndToEndTest,
  },
  {
    id: 'auctioneer-creation',
    title: 'Teste de Cadastro de Leiloeiro',
    description: 'Verifica a criação de um novo leiloeiro e a integridade dos dados.',
    action: runAuctioneerEndToEndTest,
  },
  {
    id: 'category-creation',
    title: 'Teste de Cadastro de Categoria',
    description: 'Verifica a criação de uma nova categoria de lote e a geração do slug.',
    action: runCategoryEndToEndTest,
  },
   {
    id: 'subcategory-creation',
    title: 'Teste de Cadastro de Subcategoria',
    description: 'Verifica a criação de uma subcategoria e sua vinculação à categoria pai.',
    action: runSubcategoryEndToEndTest,
  },
   {
    id: 'role-creation',
    title: 'Teste de Cadastro de Perfil (Role)',
    description: 'Verifica a criação de um novo perfil de usuário com permissões.',
    action: runRoleEndToEndTest,
  },
  {
    id: 'court-creation',
    title: 'Teste de Cadastro de Tribunal',
    description: 'Verifica a criação de uma nova entidade de Tribunal no banco de dados.',
    action: runCourtEndToEndTest,
  },
  {
    id: 'judicial-district-creation',
    title: 'Teste de Cadastro de Comarca',
    description: 'Verifica a criação de uma comarca e sua vinculação com estado e tribunal.',
    action: runJudicialDistrictEndToEndTest,
  },
  {
    id: 'judicial-branch-creation',
    title: 'Teste de Cadastro de Vara',
    description: 'Verifica a criação de uma vara judicial e sua vinculação com uma comarca.',
    action: runJudicialBranchEndToEndTest,
  },
  {
    id: 'judicial-process-creation',
    title: 'Teste de Cadastro de Processo',
    description: 'Verifica a criação de um processo judicial e a inclusão transacional de suas partes.',
    action: runJudicialProcessEndToEndTest,
  },
  {
    id: 'bem-creation',
    title: 'Teste de Cadastro de Bem',
    description: 'Verifica a criação de um novo bem (ativo) e sua associação com categoria e comitente.',
    action: runBemEndToEndTest,
  },
   {
    id: 'auction-creation',
    title: 'Teste de Cadastro de Leilão',
    description: 'Verifica a criação de um novo leilão e a vinculação com leiloeiro e comitente.',
    action: runAuctionEndToEndTest,
  },
  {
    id: 'lot-creation',
    title: 'Teste de Cadastro de Lote',
    description: 'Verifica a criação de um lote, incluindo a relação com um bem.',
    action: runLotEndToEndTest,
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
        if (!testResult?.output) return;
        navigator.clipboard.writeText(testResult.output);
        setHasCopied(true);
        toast({ title: "Log Copiado!", description: "O log de saída do console foi copiado para a área de transferência." });
        setTimeout(() => setHasCopied(false), 2500);
    };

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
                                <CardTitle className="text-lg">{test.title}</CardTitle>
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
                             <Button variant="outline" size="sm" onClick={handleCopyLog} disabled={!testResult.output}>
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

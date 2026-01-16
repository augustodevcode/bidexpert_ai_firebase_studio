// src/app/admin/platform-tenants/page.tsx
/**
 * @fileoverview Painel de Gerenciamento de Tenants da Plataforma.
 * 
 * Este painel é exclusivo para o administrador de TI da plataforma (landlord).
 * Permite visualizar todos os tenants, seus status, limites e configurações.
 * 
 * ACESSO: Apenas usuários do tenant 1 com permissão de administrador.
 * 
 * FUNCIONALIDADES:
 * - Listagem de todos os tenants com filtros
 * - Visualização de estatísticas da plataforma
 * - Gerenciamento de status (suspender/reativar)
 * - Visualização de limites e uso
 * - Links para acesso aos tenants
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Users, 
  Gavel, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ExternalLink,
  RefreshCw,
  Settings,
  Shield,
  Globe,
  Key,
  Info,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  getPlatformTenants, 
  getPlatformStats, 
  updateTenantStatus,
  getTenantDetails,
  regenerateTenantApiKey,
  verifyCustomDomain,
  type TenantListItem,
  type TenantWithSettings,
} from './actions';

// ============================================================================
// Componentes Auxiliares
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    PENDING: { label: 'Pendente', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
    TRIAL: { label: 'Trial', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
    ACTIVE: { label: 'Ativo', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
    SUSPENDED: { label: 'Suspenso', variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
    CANCELLED: { label: 'Cancelado', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
    EXPIRED: { label: 'Expirado', variant: 'outline', icon: <XCircle className="h-3 w-3" /> },
  };

  const { label, variant, icon } = config[status] || { label: status, variant: 'outline' as const, icon: null };

  return (
    <Badge variant={variant} className="gap-1">
      {icon}
      {label}
    </Badge>
  );
}

function StatCard({ title, value, icon, description }: { title: string; value: number; icon: React.ReactNode; description?: string }) {
  return (
    <Card data-ai-id="stat-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Componente Principal
// ============================================================================

export default function PlatformTenantsPage() {
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [stats, setStats] = useState<{
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
    totalUsers: number;
    totalAuctions: number;
    totalLots: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<TenantWithSettings | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tenantsData, statsData] = await Promise.all([
        getPlatformTenants(),
        getPlatformStats(),
      ]);
      setTenants(tenantsData);
      setStats(statsData);
    } catch (error: any) {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Falha ao carregar dados.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewDetails = async (tenantId: string) => {
    try {
      const details = await getTenantDetails(tenantId);
      setSelectedTenant(details);
      setIsDetailDialogOpen(true);
      setShowApiKey(false);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (tenantId: string, newStatus: string) => {
    const result = await updateTenantStatus(tenantId, newStatus as any);
    if (result.success) {
      toast({ title: 'Sucesso', description: result.message });
      fetchData();
      if (selectedTenant?.id.toString() === tenantId) {
        const details = await getTenantDetails(tenantId);
        setSelectedTenant(details);
      }
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive' });
    }
  };

  const handleRegenerateApiKey = async (tenantId: string) => {
    if (!confirm('Tem certeza que deseja regenerar a API Key? A key atual será invalidada.')) return;
    
    const result = await regenerateTenantApiKey(tenantId);
    if (result.success) {
      toast({ title: 'Sucesso', description: result.message });
      if (selectedTenant?.id.toString() === tenantId) {
        const details = await getTenantDetails(tenantId);
        setSelectedTenant(details);
      }
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive' });
    }
  };

  const handleVerifyDomain = async (tenantId: string) => {
    const result = await verifyCustomDomain(tenantId);
    if (result.success) {
      toast({ title: 'Sucesso', description: result.message });
      fetchData();
      if (selectedTenant?.id.toString() === tenantId) {
        const details = await getTenantDetails(tenantId);
        setSelectedTenant(details);
      }
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!', description: 'Texto copiado para a área de transferência.' });
  };

  const buildAccessUrl = (tenant: TenantListItem) => {
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'bidexpert.com.br';
    switch (tenant.resolutionStrategy) {
      case 'SUBDOMAIN':
        return `https://${tenant.subdomain}.${appDomain}`;
      case 'PATH':
        return `https://${appDomain}/app/${tenant.subdomain}`;
      case 'CUSTOM_DOMAIN':
        return tenant.domain ? `https://${tenant.domain}` : `https://${tenant.subdomain}.${appDomain}`;
      default:
        return `https://${tenant.subdomain}.${appDomain}`;
    }
  };

  // Filtros
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (tenant.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" data-ai-id="platform-tenants-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Gestão de Tenants da Plataforma
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os leiloeiros e empresas que utilizam o BidExpert
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Alertas de Configuração */}
      <Alert data-ai-id="config-alert">
        <Info className="h-4 w-4" />
        <AlertTitle>Configuração do Ambiente</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-2">Para que a resolução de tenants funcione corretamente, configure:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><code className="bg-muted px-1 rounded">ADMIN_API_KEY</code> - Chave para APIs administrativas do CRM</li>
            <li><code className="bg-muted px-1 rounded">NEXT_PUBLIC_APP_DOMAIN</code> - Domínio base (ex: bidexpert.com.br)</li>
            <li><code className="bg-muted px-1 rounded">LANDLORD_URL</code> - URL do painel principal</li>
          </ul>
          <p className="mt-2 text-sm text-muted-foreground">
            Para domínios customizados com SSL, configure um proxy reverso (Nginx/Caddy) ou Cloudflare for SaaS.
          </p>
        </AlertDescription>
      </Alert>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-ai-id="stats-grid">
          <StatCard
            title="Total de Tenants"
            value={stats.totalTenants}
            icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
          />
          <StatCard
            title="Tenants Ativos"
            value={stats.activeTenants}
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          />
          <StatCard
            title="Em Trial"
            value={stats.trialTenants}
            icon={<Clock className="h-4 w-4 text-yellow-500" />}
          />
          <StatCard
            title="Suspensos"
            value={stats.suspendedTenants}
            icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          />
        </div>
      )}

      {/* Filtros */}
      <Card data-ai-id="filters-card">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por nome, subdomínio ou domínio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              data-ai-id="search-input"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-ai-id="status-filter">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="ACTIVE">Ativo</SelectItem>
                <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
                <SelectItem value="EXPIRED">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Tenants */}
      <Card data-ai-id="tenants-table-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tenants ({filteredTenants.length})
          </CardTitle>
          <CardDescription>
            Lista de todos os leiloeiros cadastrados na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table data-ai-id="tenants-table">
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Subdomínio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resolução</TableHead>
                <TableHead>Setup</TableHead>
                <TableHead className="text-center">Usuários</TableHead>
                <TableHead className="text-center">Leilões</TableHead>
                <TableHead>Trial Expira</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">Carregando tenants...</p>
                  </TableCell>
                </TableRow>
              ) : filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum tenant encontrado com os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id} data-ai-id={`tenant-row-${tenant.id}`}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {tenant.subdomain}
                      </code>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tenant.status} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {tenant.resolutionStrategy === 'SUBDOMAIN' && 'Subdomínio'}
                        {tenant.resolutionStrategy === 'PATH' && 'Path'}
                        {tenant.resolutionStrategy === 'CUSTOM_DOMAIN' && (
                          <>
                            <Globe className="h-3 w-3 mr-1" />
                            {tenant.customDomainVerified ? 'Verificado' : 'Pendente'}
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tenant.isSetupComplete ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">{tenant.usersCount}</TableCell>
                    <TableCell className="text-center">{tenant.auctionsCount}</TableCell>
                    <TableCell>
                      {tenant.trialExpiresAt ? (
                        <span className="text-xs">
                          {new Date(tenant.trialExpiresAt).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewDetails(tenant.id)}
                              data-ai-id={`view-details-${tenant.id}`}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver detalhes</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => window.open(buildAccessUrl(tenant), '_blank')}
                              data-ai-id={`access-tenant-${tenant.id}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Acessar tenant</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-ai-id="tenant-details-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedTenant?.name}
            </DialogTitle>
            <DialogDescription>
              Detalhes e configurações do tenant
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="limits">Limites</TabsTrigger>
                <TabsTrigger value="domain">Domínio</TabsTrigger>
                <TabsTrigger value="api">API</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID</label>
                    <p className="font-mono">{selectedTenant.id.toString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <StatusBadge status={selectedTenant.status} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Subdomínio</label>
                    <p className="font-mono">{selectedTenant.subdomain}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Plano</label>
                    <p>{selectedTenant.planId || 'Não definido'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                    <p>{new Date(selectedTenant.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Setup Completo</label>
                    <p>{selectedTenant.settings?.isSetupComplete ? 'Sim' : 'Não'}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground">Alterar Status</label>
                  <div className="flex gap-2 mt-2">
                    <Select 
                      value={selectedTenant.status} 
                      onValueChange={(value) => handleStatusChange(selectedTenant.id.toString(), value)}
                    >
                      <SelectTrigger className="w-[200px]" data-ai-id="change-status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pendente</SelectItem>
                        <SelectItem value="TRIAL">Trial</SelectItem>
                        <SelectItem value="ACTIVE">Ativo</SelectItem>
                        <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                        <SelectItem value="CANCELLED">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="limits" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Máx. Usuários</label>
                    <p className="text-2xl font-bold">{selectedTenant.maxUsers ?? 'Ilimitado'}</p>
                    <p className="text-xs text-muted-foreground">
                      Atual: {selectedTenant._count.users}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Máx. Leilões</label>
                    <p className="text-2xl font-bold">{selectedTenant.maxAuctions ?? 'Ilimitado'}</p>
                    <p className="text-xs text-muted-foreground">
                      Atual: {selectedTenant._count.auctions}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Máx. Storage</label>
                    <p className="text-2xl font-bold">
                      {selectedTenant.maxStorageBytes 
                        ? `${(Number(selectedTenant.maxStorageBytes) / 1073741824).toFixed(1)} GB` 
                        : 'Ilimitado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Lotes</label>
                    <p className="text-2xl font-bold">{selectedTenant._count.lots}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="domain" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estratégia de Resolução</label>
                  <p className="font-medium mt-1">
                    {selectedTenant.resolutionStrategy === 'SUBDOMAIN' && 'Subdomínio'}
                    {selectedTenant.resolutionStrategy === 'PATH' && 'Path-based'}
                    {selectedTenant.resolutionStrategy === 'CUSTOM_DOMAIN' && 'Domínio Customizado'}
                  </p>
                </div>

                {selectedTenant.domain && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Domínio Customizado</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded">{selectedTenant.domain}</code>
                      {selectedTenant.customDomainVerified ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Verificado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pendente
                        </Badge>
                      )}
                    </div>
                    
                    {!selectedTenant.customDomainVerified && selectedTenant.customDomainVerifyToken && (
                      <Alert className="mt-4">
                        <Globe className="h-4 w-4" />
                        <AlertTitle>Verificação de Domínio</AlertTitle>
                        <AlertDescription>
                          <p className="mb-2">Adicione o seguinte registro TXT ao DNS do domínio:</p>
                          <code className="block bg-muted p-2 rounded text-xs break-all">
                            {selectedTenant.customDomainVerifyToken}
                          </code>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => handleVerifyDomain(selectedTenant.id.toString())}
                            data-ai-id="verify-domain-btn"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Verificar Agora
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Configuração de SSL</AlertTitle>
                  <AlertDescription>
                    Para domínios customizados, configure um proxy reverso (Nginx, Caddy) ou 
                    use Cloudflare for SaaS para gerenciar certificados SSL automaticamente.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="api" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">API Key do Tenant</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-2 py-1 rounded flex-1 font-mono text-sm">
                      {showApiKey ? selectedTenant.apiKey : '••••••••••••••••••••••••'}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(selectedTenant.apiKey || '')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => handleRegenerateApiKey(selectedTenant.id.toString())}
                  data-ai-id="regenerate-api-key-btn"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Regenerar API Key
                </Button>

                {selectedTenant.webhookUrl && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Webhook URL</label>
                    <code className="block bg-muted px-2 py-1 rounded mt-1 text-sm break-all">
                      {selectedTenant.webhookUrl}
                    </code>
                  </div>
                )}

                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertTitle>External ID</AlertTitle>
                  <AlertDescription>
                    <code className="bg-muted px-1 rounded">{selectedTenant.externalId || 'Não definido'}</code>
                    <p className="mt-1 text-xs">
                      ID usado pelo CRM para identificar este tenant.
                    </p>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

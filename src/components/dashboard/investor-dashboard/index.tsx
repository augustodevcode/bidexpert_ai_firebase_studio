/**
 * @file src/components/dashboard/investor-dashboard/index.tsx
 * @description Dashboard pessoal do investidor com lotes salvos, alertas e estatísticas.
 * Permite acompanhar oportunidades, performance e histórico de participação.
 * 
 * Gap 6 - Dashboard pessoal do investidor
 */

"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bookmark, 
  Bell, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  Award,
  Calendar,
  Search,
  Settings,
  ChevronRight,
  Heart,
  Eye,
  Gavel,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type AlertType = "price_drop" | "auction_start" | "auction_end" | "new_lot" | "outbid";
export type AlertFrequency = "realtime" | "daily" | "weekly";
export type LotStatus = "watching" | "bidding" | "won" | "lost" | "ended";

export interface SavedLot {
  id: string;
  lotId: string;
  lotTitle: string;
  lotImage?: string;
  category: string;
  auctionDate?: Date;
  currentBid: number;
  myMaxBid?: number;
  status: LotStatus;
  notes?: string;
  savedAt: Date;
  priceAlertThreshold?: number;
}

export interface InvestorAlert {
  id: string;
  alertType: AlertType;
  title: string;
  message: string;
  lotId?: string;
  lotTitle?: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface InvestorStatistics {
  totalAuctionsParticipated: number;
  totalBidsPlaced: number;
  auctionsWon: number;
  auctionsLost: number;
  totalInvested: number;
  estimatedSavings: number;
  averageDiscount: number;
  favoriteCategories: { category: string; count: number }[];
  monthlyActivity: { month: string; bids: number; wins: number }[];
  successRate: number;
}

export interface AlertPreferences {
  priceDropAlert: boolean;
  auctionStartAlert: boolean;
  auctionEndAlert: boolean;
  newLotAlert: boolean;
  outbidAlert: boolean;
  frequency: AlertFrequency;
  emailNotifications: boolean;
  pushNotifications: boolean;
  watchedCategories: string[];
}

export interface InvestorDashboardData {
  userId: string;
  savedLots: SavedLot[];
  alerts: InvestorAlert[];
  statistics: InvestorStatistics;
  alertPreferences: AlertPreferences;
}

export interface InvestorDashboardProps {
  dashboardData: InvestorDashboardData | null;
  onRemoveSavedLot?: (lotId: string) => void;
  onMarkAlertRead?: (alertId: string) => void;
  onUpdatePreferences?: (prefs: Partial<AlertPreferences>) => void;
  onViewLot?: (lotId: string) => void;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const _formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const _formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return `${diffDays}d atrás`;
};

const getLotStatusConfig = (status: LotStatus) => {
  const configs: Record<string, { 
    label: string; 
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }> = {
    watching: { label: "Observando", variant: "outline", icon: <Eye className="h-3 w-3" /> },
    bidding: { label: "Participando", variant: "default", icon: <Gavel className="h-3 w-3" /> },
    won: { label: "Arrematado", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
    lost: { label: "Perdido", variant: "secondary", icon: <XCircle className="h-3 w-3" /> },
    ended: { label: "Encerrado", variant: "outline", icon: <Clock className="h-3 w-3" /> },
  };
  return configs[status];
};

const getAlertTypeConfig = (type: AlertType) => {
  const configs: Record<string, { 
    icon: React.ReactNode;
    color: string;
  }> = {
    price_drop: { icon: <TrendingDown className="h-4 w-4" />, color: "text-green-600" },
    auction_start: { icon: <Gavel className="h-4 w-4" />, color: "text-blue-600" },
    auction_end: { icon: <Clock className="h-4 w-4" />, color: "text-orange-600" },
    new_lot: { icon: <Sparkles className="h-4 w-4" />, color: "text-purple-600" },
    outbid: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600" },
  };
  return configs[type];
};

// ============================================================================
// Sub-components
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, trend, className }) => {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
                {trend.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {trend.value}%
              </div>
            )}
          </div>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface SavedLotCardProps {
  lot: SavedLot;
  onRemove?: () => void;
  onView?: () => void;
}

const SavedLotCard: React.FC<SavedLotCardProps> = ({ lot, onRemove, onView }) => {
  const statusConfig = getLotStatusConfig(lot.status);
  const daysUntilAuction = lot.auctionDate 
    ? Math.ceil((lot.auctionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {lot.lotImage && (
            <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0 relative">
              <Image src={lot.lotImage} alt={lot.lotTitle} fill className="object-cover" sizes="80px" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-medium text-sm truncate pr-2">{lot.lotTitle}</h4>
              <Badge variant={statusConfig.variant} className="gap-1 shrink-0">
                {statusConfig.icon}
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{lot.category}</p>
            
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Lance Atual</span>
                <div className="font-bold text-primary">{formatCurrency(lot.currentBid)}</div>
              </div>
              {lot.myMaxBid && (
                <div>
                  <span className="text-muted-foreground text-xs">Meu Máximo</span>
                  <div className="font-medium">{formatCurrency(lot.myMaxBid)}</div>
                </div>
              )}
            </div>

            {daysUntilAuction !== null && daysUntilAuction > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <Calendar className="h-3 w-3" />
                {daysUntilAuction === 1 ? "Amanhã" : `Em ${daysUntilAuction} dias`}
              </div>
            )}

            {lot.notes && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                📝 {lot.notes}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <Button variant="default" size="sm" className="flex-1" onClick={onView}>
            <Eye className="h-3 w-3 mr-1" />
            Ver Lote
          </Button>
          <Button variant="outline" size="sm" onClick={onRemove}>
            <Heart className="h-3 w-3" fill="currentColor" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface AlertItemProps {
  alert: InvestorAlert;
  onMarkRead?: () => void;
  onAction?: () => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onMarkRead, onAction: _onAction }) => {
  const typeConfig = getAlertTypeConfig(alert.alertType);

  return (
    <div 
      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
        alert.isRead ? "bg-muted/30" : "bg-primary/5 border-primary/20"
      }`}
      onClick={onMarkRead}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${typeConfig.color}`}>
          {typeConfig.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-medium text-sm ${!alert.isRead ? "text-primary" : ""}`}>
              {alert.title}
            </h4>
            <span className="text-xs text-muted-foreground shrink-0">
              {getTimeAgo(alert.createdAt)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{alert.message}</p>
          {alert.lotTitle && (
            <p className="text-xs text-primary mt-1 flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              {alert.lotTitle}
            </p>
          )}
        </div>
        {!alert.isRead && (
          <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
        )}
      </div>
    </div>
  );
};

interface PerformanceChartProps {
  monthlyData: { month: string; bids: number; wins: number }[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ monthlyData }) => {
  const maxBids = Math.max(...monthlyData.map((d) => d.bids), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Lances</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Vitórias</span>
        </div>
      </div>
      <div className="space-y-2">
        {monthlyData.slice(-6).map((data) => (
          <div key={data.month} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-8">{data.month}</span>
            <div className="flex-1 flex gap-1 h-6">
              <div 
                className="bg-primary/80 rounded-sm transition-all"
                style={{ width: `${(data.bids / maxBids) * 100}%` }}
              />
              <div 
                className="bg-green-500/80 rounded-sm transition-all"
                style={{ width: `${(data.wins / maxBids) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-12 text-right">
              {data.bids}/{data.wins}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface CategoryBreakdownProps {
  categories: { category: string; count: number }[];
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ categories }) => {
  const total = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-3">
      {categories.slice(0, 5).map((cat) => {
        const percentage = total > 0 ? Math.round((cat.count / total) * 100) : 0;
        return (
          <div key={cat.category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{cat.category}</span>
              <span className="text-muted-foreground">{cat.count} lotes</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * InvestorDashboard - Dashboard pessoal do investidor
 * 
 * Funcionalidades:
 * - Lotes salvos com filtros e busca
 * - Central de alertas personalizados
 * - Estatísticas de performance (vitórias, investimento, economia)
 * - Gráfico de atividade mensal
 * - Breakdown por categoria
 * - Configuração de preferências de alertas
 */
export const InvestorDashboard: React.FC<InvestorDashboardProps> = ({
  dashboardData,
  onRemoveSavedLot,
  onMarkAlertRead,
  onUpdatePreferences,
  onViewLot,
  isLoading = false,
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LotStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Filter saved lots
  const filteredLots = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData.savedLots.filter((lot) => {
      const matchesSearch = lot.lotTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || lot.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || lot.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [dashboardData, searchTerm, statusFilter, categoryFilter]);

  // Unread alerts count
  const unreadAlertsCount = useMemo(() => {
    if (!dashboardData) return 0;
    return dashboardData.alerts.filter((a) => !a.isRead).length;
  }, [dashboardData]);

  // Categories for filter
  const categories = useMemo(() => {
    if (!dashboardData) return [];
    const cats = new Set(dashboardData.savedLots.map((l) => l.category));
    return Array.from(cats);
  }, [dashboardData]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="font-semibold text-lg mb-2">Dashboard não disponível</h3>
        <p className="text-muted-foreground">
          Faça login para acessar seu dashboard pessoal.
        </p>
      </div>
    );
  }

  const { statistics, alerts, savedLots } = dashboardData;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Leilões Vencidos"
          value={statistics.auctionsWon}
          subtitle={`de ${statistics.totalAuctionsParticipated} participações`}
          icon={<Award className="h-5 w-5" />}
          trend={{ value: statistics.successRate, isPositive: true }}
        />
        <StatCard
          title="Total Investido"
          value={formatCurrency(statistics.totalInvested)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Economia Estimada"
          value={formatCurrency(statistics.estimatedSavings)}
          subtitle={`${statistics.averageDiscount.toFixed(0)}% desconto médio`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Lances Dados"
          value={statistics.totalBidsPlaced}
          icon={<Gavel className="h-5 w-5" />}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="saved" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="saved" className="gap-2">
            <Bookmark className="h-4 w-4" />
            Salvos ({savedLots.length})
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2 relative">
            <Bell className="h-4 w-4" />
            Alertas
            {unreadAlertsCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-[10px]">
                {unreadAlertsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurar
          </TabsTrigger>
        </TabsList>

        {/* Saved Lots Tab */}
        <TabsContent value="saved" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lotes salvos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LotStatus | "all")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="watching">Observando</SelectItem>
                <SelectItem value="bidding">Participando</SelectItem>
                <SelectItem value="won">Arrematados</SelectItem>
                <SelectItem value="lost">Perdidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lots Grid */}
          {filteredLots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLots.map((lot) => (
                <SavedLotCard
                  key={lot.id}
                  lot={lot}
                  onRemove={() => onRemoveSavedLot?.(lot.lotId)}
                  onView={() => onViewLot?.(lot.lotId)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum lote encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Comece a salvar lotes para acompanhar suas oportunidades."}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onMarkRead={() => onMarkAlertRead?.(alert.id)}
                  onAction={() => alert.lotId && onViewLot?.(alert.lotId)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum alerta</h3>
              <p className="text-muted-foreground">
                Você será notificado sobre oportunidades importantes aqui.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Atividade Mensal
                </CardTitle>
                <CardDescription>Lances e vitórias nos últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceChart monthlyData={statistics.monthlyActivity} />
              </CardContent>
            </Card>

            {/* Categories Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Categorias Favoritas
                </CardTitle>
                <CardDescription>Distribuição por tipo de lote</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryBreakdown categories={statistics.favoriteCategories} />
              </CardContent>
            </Card>
          </div>

          {/* Success Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4" />
                Taxa de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={`${statistics.successRate * 3.52} 352`}
                      className="text-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{statistics.successRate}%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Vitórias</span>
                    <span className="font-bold text-green-600">{statistics.auctionsWon}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Derrotas</span>
                    <span className="font-bold text-red-600">{statistics.auctionsLost}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Participações</span>
                    <span className="font-bold">{statistics.totalAuctionsParticipated}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preferências de Alertas</CardTitle>
              <CardDescription>Configure como deseja receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Alert Types */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Tipos de Alerta</h4>
                <div className="space-y-3">
                  {[
                    { key: "priceDropAlert", label: "Queda de preço em lotes salvos", icon: <TrendingDown className="h-4 w-4" /> },
                    { key: "auctionStartAlert", label: "Início de leilão", icon: <Gavel className="h-4 w-4" /> },
                    { key: "auctionEndAlert", label: "Leilão encerrando em breve", icon: <Clock className="h-4 w-4" /> },
                    { key: "newLotAlert", label: "Novo lote em categoria favorita", icon: <Sparkles className="h-4 w-4" /> },
                    { key: "outbidAlert", label: "Alguém superou meu lance", icon: <AlertTriangle className="h-4 w-4" /> },
                  ].map(({ key, label, icon }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">{icon}</div>
                        <span className="text-sm">{label}</span>
                      </div>
                      <Button 
                        variant={dashboardData.alertPreferences[key as keyof AlertPreferences] ? "default" : "outline"}
                        size="sm"
                        onClick={() => onUpdatePreferences?.({ 
                          [key]: !dashboardData.alertPreferences[key as keyof AlertPreferences] 
                        })}
                      >
                        {dashboardData.alertPreferences[key as keyof AlertPreferences] ? "Ativo" : "Inativo"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Frequência</h4>
                <Select 
                  value={dashboardData.alertPreferences.frequency} 
                  onValueChange={(v) => onUpdatePreferences?.({ frequency: v as AlertFrequency })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Tempo Real</SelectItem>
                    <SelectItem value="daily">Resumo Diário</SelectItem>
                    <SelectItem value="weekly">Resumo Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Channels */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Canais de Notificação</h4>
                <div className="flex gap-3">
                  <Button
                    variant={dashboardData.alertPreferences.emailNotifications ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => onUpdatePreferences?.({ 
                      emailNotifications: !dashboardData.alertPreferences.emailNotifications 
                    })}
                  >
                    Email
                  </Button>
                  <Button
                    variant={dashboardData.alertPreferences.pushNotifications ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => onUpdatePreferences?.({ 
                      pushNotifications: !dashboardData.alertPreferences.pushNotifications 
                    })}
                  >
                    Push
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvestorDashboard;

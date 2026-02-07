/**
 * @fileoverview Smart 404 Page - GAP 5.12
 * Exibe página de erro personalizada com sugestões de lotes populares
 * e links úteis, ao invés de uma página genérica.
 */
import Link from 'next/link';
import { Search, Home, Gavel, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16" data-ai-id="smart-404-page">
      <div className="text-center max-w-2xl mx-auto">
        {/* Visual */}
        <div className="text-8xl font-bold text-primary/20 mb-4 font-mono">404</div>
        <h1 className="text-3xl font-bold mb-3">Página não encontrada</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          O lote ou página que você está procurando pode ter sido removido, encerrado ou o link está incorreto.
        </p>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Search className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Buscar Lotes</h3>
              <p className="text-xs text-muted-foreground mb-3">Encontre leilões ativos com filtros avançados</p>
              <Button asChild size="sm" className="w-full">
                <Link href="/search?type=lots">Buscar Agora</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Gavel className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Leilões Ativos</h3>
              <p className="text-xs text-muted-foreground mb-3">Veja todos os leilões em andamento</p>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/search?type=auctions">Ver Leilões</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Home className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Página Inicial</h3>
              <p className="text-xs text-muted-foreground mb-3">Volte ao início e explore oportunidades</p>
              <Button asChild size="sm" variant="secondary" className="w-full">
                <Link href="/">Ir para Início</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Security Badge - GAP 5.28 */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground" data-ai-id="ssl-trust-badge">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span>Ambiente Seguro · Conexão Criptografada SSL/TLS</span>
        </div>

        <div className="mt-6">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar à página anterior
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

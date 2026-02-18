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
    <div className="wrapper-not-found-page" data-ai-id="smart-404-page">
      <div className="container-not-found-content">
        {/* Visual */}
        <div className="text-not-found-code">404</div>
        <h1 className="header-not-found-title">Página não encontrada</h1>
        <p className="text-not-found-desc">
          O lote ou página que você está procurando pode ter sido removido, encerrado ou o link está incorreto.
        </p>

        {/* Quick Actions */}
        <div className="grid-not-found-actions" data-ai-id="not-found-actions-grid">
          <Card className="card-not-found-action" data-ai-id="not-found-action-search">
            <CardContent className="content-not-found-action">
              <Search className="icon-not-found-action" />
              <h3 className="title-not-found-action">Buscar Lotes</h3>
              <p className="desc-not-found-action">Encontre leilões ativos com filtros avançados</p>
              <Button asChild size="sm" className="btn-not-found-action" data-ai-id="not-found-search-btn">
                <Link href="/search?type=lots">Buscar Agora</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-not-found-action" data-ai-id="not-found-action-auctions">
            <CardContent className="content-not-found-action">
              <Gavel className="icon-not-found-action" />
              <h3 className="title-not-found-action">Leilões Ativos</h3>
              <p className="desc-not-found-action">Veja todos os leilões em andamento</p>
              <Button asChild size="sm" variant="outline" className="btn-not-found-action" data-ai-id="not-found-auctions-btn">
                <Link href="/search?type=auctions">Ver Leilões</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-not-found-action" data-ai-id="not-found-action-home">
            <CardContent className="content-not-found-action">
              <Home className="icon-not-found-action" />
              <h3 className="title-not-found-action">Página Inicial</h3>
              <p className="desc-not-found-action">Volte ao início e explore oportunidades</p>
              <Button asChild size="sm" variant="secondary" className="btn-not-found-action" data-ai-id="not-found-home-btn">
                <Link href="/">Ir para Início</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Security Badge - GAP 5.28 */}
        <div className="wrapper-not-found-security" data-ai-id="ssl-trust-badge">
          <ShieldCheck className="icon-security-check" />
          <span className="text-security-info">Ambiente Seguro · Conexão Criptografada SSL/TLS</span>
        </div>

        <div className="wrapper-not-found-footer">
          <Button variant="ghost" asChild className="btn-not-found-back" data-ai-id="not-found-back-btn">
            <Link href="/" className="link-not-found-back">
              <ArrowLeft className="icon-btn-start" /> Voltar à página anterior
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// src/app/auctions/page.tsx
/**
 * @fileoverview Página de alias para a busca de leilões.
 * Este componente Server-Side atua como um redirecionamento simples ou um invólucro
 * para a página de busca principal (`/app/search/page.tsx`). A sua função é
 * garantir que a rota `/auctions` se comporte como a página de busca, pré-configurada
 * para exibir leilões, mantendo uma estrutura de URL intuitiva para o usuário.
 */
import SearchPage from '@/app/search/page';

/**
 * This page now acts as a server-side alias for the main search page,
 * ensuring that the /auctions route defaults to showing all auctions
 * in the search interface.
 */
export default function AuctionsPage() {
  return <SearchPage />;
}

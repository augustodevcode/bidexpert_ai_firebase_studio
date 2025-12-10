# Regra de exibição do comitente nos cards e listas

- Todos os componentes padrão de cards (`BidExpertCard` → `AuctionCard`, `LotCard`) devem exibir o logotipo do comitente sobre a imagem destacada.
- Itens de lista (`BidExpertListItem` → `auction-list-item`, `lot-list-item`) também exibem o logotipo sobre a miniatura, alinhado à área da imagem.
- Apenas o logotipo é mostrado inicialmente; o nome do comitente aparece somente no hover via tooltip.
- O logotipo usa a mídia vinculada ao cadastro do comitente (`Seller.logoUrl`/`logoMediaId`). Se não houver logo válido, nada é renderizado.
- Componente reutilizável: `ConsignorLogoBadge` deve ser usado para manter comportamento consistente de tooltip, fallback e posicionamento.

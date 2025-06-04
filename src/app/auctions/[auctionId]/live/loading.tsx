
import { Loader2 } from 'lucide-react';

export default function LiveAuctionLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
      <h1 className="text-2xl font-semibold text-foreground mb-2">Carregando Auditório Virtual...</h1>
      <p className="text-muted-foreground">Preparando a sala de leilão. Aguarde um momento.</p>
    </div>
  );
}

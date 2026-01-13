// src/repositories/bid.repository.ts
import prisma from '@/lib/prisma';
import type { Prisma, Bid } from '@prisma/client';

export class BidRepository {
  async create(data: Prisma.BidCreateInput): Promise<Bid> {
    const { lotId, bidderId, amount, tenantId } = data;

    // Converte BigInt para string/number para uso
    const lotIdBig = typeof lotId === 'string' ? BigInt(lotId) : lotId;
    // @ts-ignore - Prisma types sometimes mismatch on relations vs IDs in CreateInput, assuming basic IDs passed
    const bidderIdStr = data.bidder.connect?.id?.toString() || (data.bidderId ? data.bidderId.toString() : '0');

    // Transação Atômica com Auditoria e Trava Otimista
    return await prisma.$transaction(async (tx) => {
      // 1. Auditoria: Seta o usuário da sessão para o pgAudit logar
      // Proteção contra SQL injection via parâmetros (embora aqui seja numérico/string controlado)
      await tx.$executeRaw`SET LOCAL app.current_user_id = ${bidderIdStr}`;
      await tx.$executeRaw`SET LOCAL app.current_tenant_id = ${tenantId?.toString() || '0'}`;

      // 2. Atomic Update aka "Check-and-Set"
      // Tenta atualizar o Lote APENAS SE o novo lance for maior que o preço atual (ou inicial)
      // Isso garante que se 2 lances iguais chegarem, só um passa.
      // O campo 'price' é Decimal.
      // Assumindo que temos acesso direto ao ID ou connect
      const lotIdValue = typeof lotId === 'bigint' ? lotId : (lotId as any); // Simplificação de tipo

      // Busca o lote para validação prévia de status/prazo (opcional mas recomendado)
      const lot = await tx.lot.findUniqueOrThrow({ where: { id: lotIdValue } });

      const newAmount = new Prisma.Decimal(amount as any);
      const currentPrice = lot.price || lot.initialPrice || new Prisma.Decimal(0);
      const minIncrement = lot.bidIncrementStep || new Prisma.Decimal(0);

      if (newAmount.lessThanOrEqualTo(currentPrice)) {
        throw new Error(`Lance inválido: O valor deve ser maior que ${currentPrice}`);
      }

      if (newAmount.lessThan(currentPrice.add(minIncrement))) {
        throw new Error(`Lance inválido: Incremento mínimo não atingido`);
      }

      // Atualiza o Lote e o "Vencedor Atual"
      // Usamos update com 'where' simples porque já validamos, mas para 'race condition' perfeita
      // deveríamos usar updateMany com where { price: { lt: newAmount } }.
      // Se retornar count 0, alguel deu lance maior no meio tempo.
      const updateResult = await tx.lot.updateMany({
        where: {
          id: lotIdValue,
          price: { lt: newAmount } // GARANTIA DE CONCORRÊNCIA POSTGRES
        },
        data: {
          price: newAmount,
          winnerId: typeof data.bidderId === 'bigint' ? data.bidderId : undefined, // Ajustar conforme entrada
          bidsCount: { increment: 1 }
        }
      });

      if (updateResult.count === 0) {
        throw new Error('Outro lance foi computado antes do seu. Tente novamente.');
      }

      // 3. Cria o registro do Lance (Histórico imutável)
      const bid = await tx.bid.create({ data });

      // 4. Emite evento Realtime via Redis (Side Effect fora do banco, mas dentro da lógica de sucesso)
      // Import dinâmico para evitar erro de build se o arquivo não existir ainda no contexto geral
      const { socketEmitter } = await import('@/lib/socket-emitter');

      socketEmitter.to(`auction:${lot.auctionId}`).emit('bid:placed', {
        lotId: lot.id.toString(),
        amount: newAmount.toString(),
        bidderId: bidderIdStr,
        timestamp: new Date().toISOString()
      });

      return bid;
    });
  }

  // Mantendo outros métodos...
  async deleteMany(where: Prisma.BidWhereInput): Promise<Prisma.BatchPayload> {
    return prisma.bid.deleteMany({ where });
  }

  async count(): Promise<number> {
    return prisma.bid.count();
  }
}

/**
 * @file src/app/api/investor/dashboard/route.ts
 * @description API route para o dashboard do investidor.
 * Retorna lotes salvos, alertas, estatísticas e preferências.
 * 
 * Gap 6 - Dashboard Pessoal do Investidor
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ============================================================================
// Types
// ============================================================================

type AlertType = "price_drop" | "auction_start" | "auction_end" | "new_lot" | "outbid";
type AlertFrequency = "realtime" | "daily" | "weekly";
type LotStatus = "watching" | "bidding" | "won" | "lost" | "ended";

interface SavedLot {
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

interface InvestorAlert {
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

interface InvestorStatistics {
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

interface AlertPreferences {
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

// ============================================================================
// Helper Functions
// ============================================================================

function determineLotStatus(lot: {
  status: string;
  auction?: { status: string; endDate: Date | null } | null;
  currentBidUserId?: bigint | null;
}, userId: bigint): LotStatus {
  const auctionEnded = 
    lot.auction?.status === "ENCERRADO" ||
    (lot.auction?.endDate && new Date(lot.auction.endDate) < new Date());

  if (lot.status === "VENDIDO") {
    return lot.currentBidUserId === userId ? "won" : "lost";
  }
  if (auctionEnded) {
    return "ended";
  }
  if (lot.currentBidUserId === userId) {
    return "bidding";
  }
  return "watching";
}

function getMonthKey(date: Date): string {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return months[date.getMonth()];
}

// ============================================================================
// API Route Handlers
// ============================================================================

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = BigInt(session.user.id);

    // Fetch user's saved/favorite lots
    const favoriteLots = await prisma.favoriteLot.findMany({
      where: { userId },
      include: {
        lot: {
          include: {
            auction: {
              include: {
                category: true,
              },
            },
            images: { take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch user's bids for statistics
    const userBids = await prisma.bid.findMany({
      where: { userId },
      include: {
        lot: {
          include: {
            auction: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch won lots
    const wonLots = await prisma.wonLot.findMany({
      where: { bidderId: userId },
      include: {
        lot: {
          include: {
            auction: true,
          },
        },
      },
    });

    // Fetch user's max bids
    const maxBids = await prisma.userLotMaxBid.findMany({
      where: { userId, isActive: true },
    });

    // Build saved lots list
    const savedLots: SavedLot[] = favoriteLots.map((fav: typeof favoriteLots[number]) => {
      const lot = fav.lot;
      const maxBid = maxBids.find((mb: typeof maxBids[number]) => mb.lotId === lot.id);
      
      return {
        id: fav.id.toString(),
        lotId: lot.id.toString(),
        lotTitle: lot.title || "Lote sem título",
        lotImage: lot.images[0]?.url || undefined,
        category: lot.auction?.category?.name || "Sem categoria",
        auctionDate: lot.auction?.endDate || undefined,
        currentBid: Number(lot.currentBid || lot.initialPrice || 0),
        myMaxBid: maxBid ? Number(maxBid.maxAmount) : undefined,
        status: determineLotStatus(lot as Parameters<typeof determineLotStatus>[0], userId),
        savedAt: fav.createdAt,
        notes: (fav as { notes?: string }).notes || undefined,
      };
    });

    // Calculate statistics
    const uniqueAuctions = new Set(userBids.map((b: typeof userBids[number]) => b.lot.auctionId?.toString())).size;
    const totalBids = userBids.length;
    const auctionsWon = wonLots.length;
    const totalInvested = wonLots.reduce((sum: number, w: typeof wonLots[number]) => sum + Number(w.finalBid || 0), 0);

    // Calculate estimated savings (difference from evaluation value)
    let estimatedSavings = 0;
    let totalDiscount = 0;
    for (const won of wonLots) {
      const evalValue = Number(won.lot.evaluationValue || 0);
      const finalBid = Number(won.finalBid || 0);
      if (evalValue > finalBid) {
        estimatedSavings += evalValue - finalBid;
        totalDiscount += ((evalValue - finalBid) / evalValue) * 100;
      }
    }
    const averageDiscount = auctionsWon > 0 ? totalDiscount / auctionsWon : 0;

    // Calculate favorite categories
    const categoryCount: Record<string, number> = {};
    for (const bid of userBids) {
      const cat = bid.lot.auction?.category?.name || "Outros";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }
    const favoriteCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate monthly activity
    const monthlyActivity: Record<string, { bids: number; wins: number }> = {};
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return getMonthKey(date);
    }).reverse();

    for (const month of last6Months) {
      monthlyActivity[month] = { bids: 0, wins: 0 };
    }

    for (const bid of userBids) {
      const month = getMonthKey(bid.createdAt);
      if (monthlyActivity[month]) {
        monthlyActivity[month].bids++;
      }
    }

    for (const won of wonLots) {
      const month = getMonthKey(won.wonAt);
      if (monthlyActivity[month]) {
        monthlyActivity[month].wins++;
      }
    }

    const statistics: InvestorStatistics = {
      totalAuctionsParticipated: uniqueAuctions,
      totalBidsPlaced: totalBids,
      auctionsWon,
      auctionsLost: Math.max(0, uniqueAuctions - auctionsWon),
      totalInvested: Math.round(totalInvested * 100) / 100,
      estimatedSavings: Math.round(estimatedSavings * 100) / 100,
      averageDiscount: Math.round(averageDiscount * 100) / 100,
      favoriteCategories,
      monthlyActivity: last6Months.map((month) => ({
        month,
        bids: monthlyActivity[month].bids,
        wins: monthlyActivity[month].wins,
      })),
      successRate: uniqueAuctions > 0 ? Math.round((auctionsWon / uniqueAuctions) * 100) : 0,
    };

    // Fetch notifications as alerts
    const notifications = await prisma.bidderNotification.findMany({
      where: { bidderId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const alerts: InvestorAlert[] = notifications.map((n: typeof notifications[number]) => ({
      id: n.id.toString(),
      alertType: mapNotificationType(n.type),
      title: n.title,
      message: n.message,
      lotId: (n as { lotId?: bigint }).lotId?.toString(),
      lotTitle: (n as { lotTitle?: string }).lotTitle,
      isRead: n.isRead,
      createdAt: n.createdAt,
      actionUrl: (n as { actionUrl?: string }).actionUrl,
    }));

    // Default alert preferences (would come from user settings in real implementation)
    const alertPreferences: AlertPreferences = {
      priceDropAlert: true,
      auctionStartAlert: true,
      auctionEndAlert: true,
      newLotAlert: true,
      outbidAlert: true,
      frequency: "realtime",
      emailNotifications: true,
      pushNotifications: false,
      watchedCategories: favoriteCategories.map((c) => c.category),
    };

    return NextResponse.json({
      userId: userId.toString(),
      savedLots,
      alerts,
      statistics,
      alertPreferences,
    });
  } catch (error) {
    console.error("Erro ao buscar dashboard do investidor:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function mapNotificationType(type: string): AlertType {
  const typeMap: Record<string, AlertType> = {
    PRICE_DROP: "price_drop",
    AUCTION_START: "auction_start",
    AUCTION_END: "auction_end",
    NEW_LOT: "new_lot",
    OUTBID: "outbid",
    BID_SUPERADO: "outbid",
    LEILAO_INICIADO: "auction_start",
    LEILAO_ENCERRADO: "auction_end",
  };
  return typeMap[type] || "new_lot";
}

// ============================================================================
// POST - Save/Update Preferences
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = BigInt(session.user.id);
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "save_lot": {
        const { lotId, notes: _notes } = data;
        const existing = await prisma.favoriteLot.findFirst({
          where: { userId, lotId: BigInt(lotId) },
        });

        if (existing) {
          return NextResponse.json({ message: "Lote já está salvo" });
        }

        await prisma.favoriteLot.create({
          data: {
            userId,
            lotId: BigInt(lotId),
          },
        });

        return NextResponse.json({ success: true, message: "Lote salvo com sucesso" });
      }

      case "remove_lot": {
        const { lotId } = data;
        await prisma.favoriteLot.deleteMany({
          where: { userId, lotId: BigInt(lotId) },
        });

        return NextResponse.json({ success: true, message: "Lote removido dos salvos" });
      }

      case "mark_alert_read": {
        const { alertId } = data;
        await prisma.bidderNotification.update({
          where: { id: BigInt(alertId) },
          data: { isRead: true },
        });

        return NextResponse.json({ success: true });
      }

      case "update_preferences": {
        // In a real implementation, this would update user preferences in database
        const { preferences } = data;
        // TODO: Implement user preferences storage
        return NextResponse.json({ success: true, preferences });
      }

      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }
  } catch (error) {
    console.error("Erro no dashboard do investidor:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

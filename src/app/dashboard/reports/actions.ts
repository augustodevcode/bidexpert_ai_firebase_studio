// src/app/dashboard/reports/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { LotCategory } from '@/types';

export interface UserReportData {
    totalLotsWon: number;
    totalAmountSpent: number;
    totalBidsPlaced: number;
    spendingByCategory: {
        name: string;
        value: number;
    }[];
}

export async function getUserReportDataAction(userId: string): Promise<UserReportData> {
    if (!userId) {
        throw new Error("User ID is required to generate a report.");
    }
    
    try {
        const [totalLotsWon, userWins, totalBidsPlaced] = await Promise.all([
            prisma.userWin.count({ where: { userId } }),
            prisma.userWin.findMany({ 
                where: { userId },
                include: { 
                    lot: { 
                        include: { 
                            category: true 
                        }
                    } 
                }
            }),
            prisma.bid.count({ where: { bidderId: userId } })
        ]);

        const totalAmountSpent = userWins.reduce((sum, win) => sum + win.winningBidAmount, 0);

        const spendingByCategoryMap = new Map<string, number>();
        userWins.forEach(win => {
            const categoryName = win.lot.category?.name || 'Outros';
            const currentAmount = spendingByCategoryMap.get(categoryName) || 0;
            spendingByCategoryMap.set(categoryName, currentAmount + win.winningBidAmount);
        });

        const spendingByCategory = Array.from(spendingByCategoryMap.entries()).map(([name, value]) => ({
            name,
            value,
        }));

        return {
            totalLotsWon,
            totalAmountSpent,
            totalBidsPlaced,
            spendingByCategory,
        };

    } catch (error) {
        console.error(`[getUserReportDataAction] Error fetching report for user ${userId}:`, error);
        throw new Error("Failed to generate user report data.");
    }
}

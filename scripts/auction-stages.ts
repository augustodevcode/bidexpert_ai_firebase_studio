import { AuctionStageService } from '../src/services/auction-stage.service';
import { Decimal } from 'decimal.js';

export type CreateStagesProps = {
    auctionId: string;
    evaluationValue: number;
    firstStageStartDate: Date;
    firstStageEndDate: Date;
    secondStageStartDate: Date;
    secondStageEndDate: Date;
};

export async function createAuctionStages(
    auctionStageService: AuctionStageService,
    { 
        auctionId,
        evaluationValue,
        firstStageStartDate,
        firstStageEndDate,
        secondStageStartDate,
        secondStageEndDate 
    }: CreateStagesProps
) {
    // RN-008: Timeline de Etapas
    // 1ª Praça - Valor cheio
    await auctionStageService.createAuctionStage({
        auction: { connect: { id: BigInt(auctionId) } },
        name: '1ª Praça',
        startDate: firstStageStartDate,
        endDate: firstStageEndDate,
        initialPrice: new Decimal(evaluationValue)
    });

    // 2ª Praça - 70% do valor
    await auctionStageService.createAuctionStage({
        auction: { connect: { id: BigInt(auctionId) } },
        name: '2ª Praça',
        startDate: secondStageStartDate,
        endDate: secondStageEndDate,
        initialPrice: new Decimal(evaluationValue * 0.7)
    });
}
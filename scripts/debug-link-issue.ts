
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('Checking auction 201...');
    const auctionByPublicId = await prisma.auction.findFirst({
      where: { publicId: '201' }
    });
    
    if (auctionByPublicId) {
        console.log('Auction found by publicId 201:', {
            id: auctionByPublicId.id,
            publicId: auctionByPublicId.publicId,
            title: auctionByPublicId.title
        });
    } else {
        console.log('Auction NOT found by publicId 201');
    }

    const auctionById = await prisma.auction.findUnique({
      where: { id: 201n }
    });

    if (auctionById) {
        console.log('Auction found by ID 201:', {
            id: auctionById.id,
            publicId: auctionById.publicId,
            title: auctionById.title
        });
    }

    console.log('Checking lot lot-1763656354435-8...');
    const lot = await prisma.lot.findFirst({
        where: { 
            OR: [
                { id: 'lot-1763656354435-8' },
                { publicId: 'lot-1763656354435-8' }
            ]
        }
    });

    if (lot) {
        console.log('Lot found:', {
            id: lot.id,
            publicId: lot.publicId,
            auctionId: lot.auctionId
        });
    } else {
        console.log('Lot NOT found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();

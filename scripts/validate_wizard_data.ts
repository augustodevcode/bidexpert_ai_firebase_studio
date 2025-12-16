
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const replacer = (key: string, value: any) =>
    typeof value === 'bigint' ? value.toString() : value;

async function main() {
    console.log('Fetching latest auction...');
    const auction = await prisma.auction.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
            asset: true,
            location: true,
            lots: true
        }
    });

    if (!auction) {
        console.log('No auctions found.');
    } else {
        console.log('Latest Auction Created:');
        console.log(JSON.stringify(auction, replacer, 2));
    }

    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

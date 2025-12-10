
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const publicId = 'lot-1764169048835-002';
  
  console.log(`Updating images for lot: ${publicId}`);

  const lot = await prisma.lot.findUnique({
    where: { publicId: publicId },
  });

  if (!lot) {
    console.error(`Lot with publicId ${publicId} not found.`);
    return;
  }

  const imageUrl = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80';
  
  const galleryImageUrls = [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
  ];

  await prisma.lot.update({
    where: { id: lot.id },
    data: {
      imageUrl: imageUrl,
      galleryImageUrls: galleryImageUrls,
    },
  });

  console.log(`Successfully updated images for lot ${publicId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

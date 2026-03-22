import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration: Fix image URLs...');

  const items = await prisma.portfolioItem.findMany();

  let updatedCount = 0;

  for (const item of items) {
    const images = item.images as string[];
    
    if (!Array.isArray(images)) {
      continue;
    }

    const updatedImages = images.map(img => {
      if (typeof img === 'string' && !img.startsWith('/')) {
        return '/' + img.replace(/^\/+/, '');
      }
      return img;
    });

    const hasChanges = updatedImages.some((img, index) => img !== images[index]);

    if (hasChanges) {
      await prisma.portfolioItem.update({
        where: { id: item.id },
        data: { images: updatedImages },
      });
      updatedCount++;
      console.log(`Updated item ${item.id}: ${images.join(', ')} -> ${updatedImages.join(', ')}`);
    }
  }

  console.log(`Migration completed. Updated ${updatedCount} items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
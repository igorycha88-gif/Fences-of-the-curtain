import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const slugRenames: [string, string][] = [
  ['zabory-iz-profnastila', 'zabor-iz-profnastila'],
  ['evroshtaketnik', 'zabor-iz-evroshtaketnika'],
  ['zabory-iz-3d-panelej', 'zabor-iz-3d-panelej'],
  ['zabory-iz-setki-rabitsy', 'zabor-iz-setki-rabitsy'],
  ['navesy-dlya-avto', 'naves-pod-mashinu'],
  ['navesy-iz-polikarbonata', 'naves-iz-polikarbonata'],
];

async function main() {
  console.log('Renaming service page slugs...\n');

  for (const [oldSlug, newSlug] of slugRenames) {
    const existing = await prisma.pageContent.findUnique({
      where: { slug: oldSlug },
    });

    if (!existing) {
      console.log(`  [SKIP] "${oldSlug}" not found (already renamed or missing)`);
      continue;
    }

    await prisma.pageContent.update({
      where: { slug: oldSlug },
      data: { slug: newSlug },
    });

    console.log(`  [OK] "${oldSlug}" → "${newSlug}"`);
  }

  console.log('\nDone!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FENCE_TYPE_CODE_MAP: Record<string, string> = {
  'Профнастил': 'PROFNASTIL',
  'Евроштакетник': 'PICKET',
  '3D-панели': 'PANEL_3D',
  'Сетка-рабица': 'MESH',
};

async function migrateWorkRelations() {
  console.log('Starting WorkRelation fenceType migration...');

  const workRelations = await prisma.workRelation.findMany({
    where: {
      fenceType: {
        not: null,
      },
    },
  });

  console.log(`Found ${workRelations.length} work relations with fenceType`);

  let updated = 0;
  let skipped = 0;

  for (const relation of workRelations) {
    const oldFenceType = relation.fenceType;
    const newFenceType = FENCE_TYPE_CODE_MAP[oldFenceType!];

    if (newFenceType && newFenceType !== oldFenceType) {
      await prisma.workRelation.update({
        where: { id: relation.id },
        data: { fenceType: newFenceType },
      });
      console.log(`Updated: "${oldFenceType}" -> "${newFenceType}"`);
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Migration complete: ${updated} updated, ${skipped} skipped`);
}

migrateWorkRelations()
  .then(() => {
    console.log('Migration completed successfully');
    return prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Migration failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });

// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding reference guides...');

  // Fence Types
  const fenceTypes = await Promise.all([
    prisma.fenceType.upsert({
      where: { id: 'fence-type-profnastil' },
      update: {},
      create: {
        id: 'fence-type-profnastil',
        name: 'Профнастил',
        description: 'Забор из профнастила - надежное и долговечное ограждение',
        difficultyCoef: 1.0,
        postSpacing: 2500,
        defaultLagRows: 2,
        active: true,
        updatedAt: new Date(),
      },
    }),
    prisma.fenceType.upsert({
      where: { id: 'fence-type-shakhetnik' },
      update: {},
      create: {
        id: 'fence-type-shakhetnik',
        name: 'Евроштакетник',
        description: 'Современный забор из металлического штакетника',
        difficultyCoef: 1.1,
        postSpacing: 2500,
        defaultLagRows: 2,
        active: true,
        updatedAt: new Date(),
      },
    }),
    prisma.fenceType.upsert({
      where: { id: 'fence-type-mesh' },
      update: {},
      create: {
        id: 'fence-type-mesh',
        name: 'Сетка-рабица',
        description: 'Экономичный вариант ограждения из сетки',
        difficultyCoef: 0.9,
        postSpacing: 2500,
        defaultLagRows: 1,
        active: true,
        updatedAt: new Date(),
      },
    }),
    prisma.fenceType.upsert({
      where: { id: 'fence-type-3d-panels' },
      update: {},
      create: {
        id: 'fence-type-3d-panels',
        name: '3D-панели',
        description: 'Современные 3D панели для забора',
        difficultyCoef: 1.1,
        postSpacing: 2500,
        defaultLagRows: 2,
        active: true,
        updatedAt: new Date(),
      },
    }),
  ]);

  console.log(`Created ${fenceTypes.length} fence types`);

  const lagTypes = await Promise.all([
    prisma.lagType.upsert({
      where: { id: 'lag-40x20x2.0' },
      update: {},
      create: {
        id: 'lag-40x20x2.0',
        name: 'Профиль 40x20x2.0',
        description: 'Стандартная лага для забора',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        retailPricePerUnit: 150,
        length: 2500,
        purchasePricePerUnit: 120,
        active: true,
        updatedAt: new Date(),
      },
    }),
    prisma.lagType.upsert({
      where: { id: 'lag-40x20x1.5' },
      update: {},
      create: {
        id: 'lag-40x20x1.5',
        name: 'Профиль 40x20x1.5',
        description: 'Экономичная лага',
        width: 40,
        height: 20,
        metalThickness: 1.5,
        retailPricePerUnit: 120,
        length: 2500,
        purchasePricePerUnit: 95,
        active: true,
        updatedAt: new Date(),
      },
    }),
    prisma.lagType.upsert({
      where: { id: 'lag-40x40x2.0' },
      update: {},
      create: {
        id: 'lag-40x40x2.0',
        name: 'Профиль 40x40x2.0',
        description: 'Усиленная лага',
        width: 40,
        height: 40,
        metalThickness: 2.0,
        retailPricePerUnit: 200,
        length: 2500,
        purchasePricePerUnit: 160,
        active: true,
        updatedAt: new Date(),
      },
    }),
  ]);

  console.log(`Created ${lagTypes.length} lag types`);

  // Post Types
  const postTypes = await Promise.all([
    prisma.postType.upsert({
      where: { id: 'post-60x60x2.0' },
      update: {},
      create: {
        id: 'post-60x60x2.0',
        name: 'Столб 60x60x2.0',
        description: 'Стандартный столб для забора',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.0,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
        purchasePricePerUnit: 600,
        active: true,
        updatedAt: new Date(),
      },
    }),
    prisma.postType.upsert({
      where: { id: 'post-60x60x2.5' },
      update: {},
      create: {
        id: 'post-60x60x2.5',
        name: 'Столб 60x60x2.5',
        description: 'Усиленный столб для забора',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 350,
        length: 2.5,
        retailPricePerUnit: 875,
        purchasePricePerUnit: 700,
        active: true,
        updatedAt: new Date(),
      },
    }),
    prisma.postType.upsert({
      where: { id: 'post-80x80x2.5' },
      update: {},
      create: {
        id: 'post-80x80x2.5',
        name: 'Столб 80x80x2.5',
        description: 'Мощный столб для высоких заборов',
        sectionWidth: 80,
        sectionHeight: 80,
        wallThickness: 2.5,
        pricePerMeter: 450,
        length: 2.5,
        retailPricePerUnit: 1125,
        purchasePricePerUnit: 900,
        active: true,
        updatedAt: new Date(),
      },
    }),
  ]);

  console.log(`Created ${postTypes.length} post types`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

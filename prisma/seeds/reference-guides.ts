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
        postSpacing: 2.5,
        defaultLagRows: 2,
        active: true,
        sortOrder: 1,
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
        postSpacing: 2.5,
        defaultLagRows: 2,
        active: true,
        sortOrder: 2,
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
        postSpacing: 2.5,
        defaultLagRows: 1,
        active: true,
        sortOrder: 3,
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
        postSpacing: 2.5,
        defaultLagRows: 2,
        active: true,
        sortOrder: 4,
      },
    }),
  ]);

  console.log(`Created ${fenceTypes.length} fence types`);

  // Coating Types
  const coatingTypes = await Promise.all([
    prisma.coatingType.upsert({
      where: { id: 'coating-galvanized' },
      update: {},
      create: {
        id: 'coating-galvanized',
        name: 'Оцинковка',
        description: 'Базовое цинковое покрытие',
        baseCost: 0,
        markupCoef: 1.0,
        active: true,
        sortOrder: 1,
      },
    }),
    prisma.coatingType.upsert({
      where: { id: 'coating-polymer-single' },
      update: {},
      create: {
        id: 'coating-polymer-single',
        name: 'Полимерное одностороннее',
        description: 'Полимерное покрытие с одной стороны',
        baseCost: 50,
        markupCoef: 1.15,
        active: true,
        sortOrder: 2,
      },
    }),
    prisma.coatingType.upsert({
      where: { id: 'coating-polymer-double' },
      update: {},
      create: {
        id: 'coating-polymer-double',
        name: 'Полимерное двустороннее',
        description: 'Полимерное покрытие с двух сторон',
        baseCost: 80,
        markupCoef: 1.25,
        active: true,
        sortOrder: 3,
      },
    }),
  ]);

  console.log(`Created ${coatingTypes.length} coating types`);

  // Lag Types
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
        basePricePerMeter: 150,
        length: 2.5,
        purchasePricePerMeter: 120,
        active: true,
        sortOrder: 1,
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
        basePricePerMeter: 120,
        length: 2.5,
        purchasePricePerMeter: 95,
        active: true,
        sortOrder: 2,
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
        basePricePerMeter: 200,
        length: 2.5,
        purchasePricePerMeter: 160,
        active: true,
        sortOrder: 3,
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
        availableLengths: [
          { length: 2.5, pricePerMeter: 300 },
          { length: 3.0, pricePerMeter: 360 },
        ],
        purchasePrices: [
          { length: 2.5, purchasePrice: 240 },
          { length: 3.0, purchasePrice: 290 },
        ],
        active: true,
        sortOrder: 1,
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
        availableLengths: [
          { length: 2.5, pricePerMeter: 350 },
          { length: 3.0, pricePerMeter: 420 },
        ],
        purchasePrices: [
          { length: 2.5, purchasePrice: 280 },
          { length: 3.0, purchasePrice: 340 },
        ],
        active: true,
        sortOrder: 2,
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
        availableLengths: [
          { length: 2.5, pricePerMeter: 450 },
          { length: 3.0, pricePerMeter: 540 },
        ],
        purchasePrices: [
          { length: 2.5, purchasePrice: 360 },
          { length: 3.0, purchasePrice: 435 },
        ],
        active: true,
        sortOrder: 3,
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

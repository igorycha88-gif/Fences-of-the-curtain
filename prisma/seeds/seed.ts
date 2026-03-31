// @ts-nocheck
// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { Role, FenceMaterialCategory, CanopyMaterialCategory } from '@prisma/client';
import { hash, isHashed } from '../../src/lib/password';

const prisma = new PrismaClient();

async function ensureUser(email: string, name: string, passwordPlain: string, role: Role, phone: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    if (!isHashed(existingUser.password)) {
      const hashedPassword = await hash(passwordPlain);
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      });
      console.log(`[MIGRATED] ${email} - password hashed`);
    } else {
      console.log(`[SKIP] ${email} - already hashed`);
    }
    return;
  }

  const hashedPassword = await hash(passwordPlain);
  await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role,
      phone,
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      updatedAt: new Date(),
    },
  });
  console.log(`[CREATED] ${email}`);
}

async function main() {
  console.log('Seeding database...');

  await ensureUser('system@fences.local', 'Система', 'system_internal_2024', Role.ADMIN, '+70000000000');
  await ensureUser('admin@fences.ru', 'Администратор', 'admin123', Role.ADMIN, '+79001234567');
  await ensureUser('manager@fences.ru', 'Менеджер', 'manager123', Role.MANAGER, '+79001234568');

  await prisma.fenceMaterial.createMany({
    data: [
      {
        name: 'Профнастил С8',
        category: FenceMaterialCategory.PROFNASTIL,
        unit: 'м²',
        basePrice: 450,
        description: 'Оцинкованный профилированный лист',
        thickness: 0.5,
        width: 1.0,
        height: 2.0,
        coating: 'Оцинковка',
        sortOrder: 1,
      },
      {
        name: 'Профнастил С8 полимерный',
        category: FenceMaterialCategory.PROFNASTIL,
        unit: 'м²',
        basePrice: 550,
        description: 'Профлист с полимерным покрытием',
        thickness: 0.5,
        width: 1.0,
        height: 2.0,
        coating: 'Полимерное',
        sortOrder: 2,
      },
      {
        name: 'Столб металлический 60x60',
        category: FenceMaterialCategory.POSTS,
        unit: 'м.п.',
        basePrice: 1200,
        description: 'Профильная труба квадратного сечения',
        sortOrder: 3,
      },
      {
        name: 'Лага металлическая 40x20',
        category: FenceMaterialCategory.LAGS,
        unit: 'м.п.',
        basePrice: 300,
        description: 'Профиль для поперечин',
        sortOrder: 4,
      },
      {
        name: 'Саморезы 5.5x25',
        category: FenceMaterialCategory.FASTENERS,
        unit: 'шт',
        basePrice: 5,
        description: 'Крепеж для профлиста',
        sortOrder: 5,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.canopyMaterial.createMany({
    data: [
      {
        name: 'Поликарбонат сотовый 8мм',
        category: CanopyMaterialCategory.POLYCARBONATE,
        unit: 'м²',
        basePrice: 800,
        thickness: 8,
        sortOrder: 1,
      },
      {
        name: 'Поликарбонат сотовый 10мм',
        category: CanopyMaterialCategory.POLYCARBONATE,
        unit: 'м²',
        basePrice: 950,
        thickness: 10,
        sortOrder: 2,
      },
      {
        name: 'Профиль 60x60',
        category: CanopyMaterialCategory.PROFILE,
        unit: 'м.п.',
        basePrice: 450,
        sortOrder: 3,
      },
      {
        name: 'Профиль 40x20',
        category: CanopyMaterialCategory.PROFILE,
        unit: 'м.п.',
        basePrice: 280,
        sortOrder: 4,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.workPrice.createMany({
    data: [
      {
        name: 'Монтаж забора',
        category: 'fence',
        pricePerUnit: 800,
        unit: 'м.п.',
      },
      {
        name: 'Бетонирование столба',
        category: 'fence',
        pricePerUnit: 500,
        unit: 'шт',
      },
      {
        name: 'Установка ворот распашных',
        category: 'fence',
        pricePerUnit: 5000,
        unit: 'шт',
      },
      {
        name: 'Установка ворот откатных',
        category: 'fence',
        pricePerUnit: 7000,
        unit: 'шт',
      },
      {
        name: 'Монтаж навеса',
        category: 'canopy',
        pricePerUnit: 1500,
        unit: 'м²',
      },
      {
        name: 'Установка стоек',
        category: 'canopy',
        pricePerUnit: 1000,
        unit: 'шт',
      },
      {
        name: 'Монтаж навеса - усиленный',
        category: 'canopy',
        pricePerUnit: 1800,
        unit: 'м²',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.soilType.createMany({
    data: [
      {
        name: 'Нормальный',
        surchargeCoef: 1.0,
      },
      {
        name: 'Бетон/Асфальт',
        surchargeCoef: 1.15,
      },
      {
        name: 'Каменистый',
        surchargeCoef: 1.25,
      },
      {
        name: 'Болотистый',
        surchargeCoef: 1.4,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.review.createMany({
    data: [
      {
        name: 'Алексей Петров',
        text: 'Отличная работа! Забор установлен быстро и качественно. Рекомендую!',
        rating: 5,
        sortOrder: 1,
      },
      {
        name: 'Мария Иванова',
        text: 'Заказывала навес для автомобиля. Всё сделали в срок, цена адекватная.',
        rating: 5,
        sortOrder: 2,
      },
      {
        name: 'Дмитрий Сидоров',
        text: 'Профессиональный подход. Калькулятор показал точную стоимость.',
        rating: 4,
        sortOrder: 3,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.setting.createMany({
    data: [
      {
        key: 'companyName',
        value: 'Заборы и Навесы',
      },
      {
        key: 'phone',
        value: '+7 (900) 123-45-67',
      },
      {
        key: 'email',
        value: 'info@fences.ru',
      },
      {
        key: 'address',
        value: 'г. Москва, ул. Строительная, д. 15',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.rateLimitConfig.upsert({
    where: { id: 'auth' },
    update: {},
    create: {
      id: 'auth',
      maxAttempts: 5,
      windowMs: 900000,
    },
  });
  console.log('[CREATED] RateLimitConfig - auth configuration');

  await prisma.rateLimitConfig.upsert({
    where: { id: 'orders' },
    update: {},
    create: {
      id: 'orders',
      maxAttempts: 5,
      windowMs: 3600000,
    },
  });
  console.log('[CREATED] RateLimitConfig - orders configuration');

  await prisma.wicketType.createMany({
    data: [
      {
        name: 'Калитка стандартная 1.0м',
        description: 'Стандартная калитка для загородного дома',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        wicketHeight: 2000,
        wicketLength: 1000,
        retailPrice: 12000,
        purchasePrice: 8000,
        active: true,
      },
      {
        name: 'Калитка стандартная 0.9м',
        description: 'Компактная калитка для прохода',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        wicketHeight: 2000,
        wicketLength: 900,
        retailPrice: 11000,
        purchasePrice: 7500,
        active: true,
      },
      {
        name: 'Калитка усиленная 1.2м',
        description: 'Усиленная калитка с увеличенной толщиной металла',
        metalThickness: 3.0,
        sectionWidth: 60,
        sectionHeight: 40,
        wicketHeight: 2200,
        wicketLength: 1200,
        retailPrice: 18000,
        purchasePrice: 12000,
        active: true,
      },
      {
        name: 'Калитка низкая 0.8м',
        description: 'Низкая калитка для детских площадок',
        metalThickness: 1.5,
        sectionWidth: 40,
        sectionHeight: 20,
        wicketHeight: 1200,
        wicketLength: 800,
        retailPrice: 8000,
        purchasePrice: 5500,
        active: true,
      },
      {
        name: 'Калитка высокая 2.2м',
        description: 'Высокая калитка для промышленных объектов',
        metalThickness: 2.5,
        sectionWidth: 50,
        sectionHeight: 50,
        wicketHeight: 2200,
        wicketLength: 1000,
        retailPrice: 15000,
        purchasePrice: 10000,
        active: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('[SEED] Checking existing Panel3D records...');
  const existingPanel3D = await prisma.panel3D.findMany();
  console.log('[SEED] Found', existingPanel3D.length, 'existing Panel3D records');
  existingPanel3D.forEach(p => {
    console.log(`[SEED] Existing: ${p.name} (${p.panelHeight}x${p.panelWidth}) - Active: ${p.active}`);
  });

  const panel3DResult = await prisma.panel3D.createMany({
    data: [
      {
        name: '3D-панель 2000x2500',
        description: 'Стандартная 3D-панель для забора высотой 2 метра',
        panelHeight: 2000,
        panelWidth: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        purchasePricePerUnit: 3500,
        retailPricePerUnit: 5000,
        active: true,
        priority: 0,
      },
      {
        name: '3D-панель 2500x2500',
        description: 'Высокая 3D-панель для забора высотой 2.5 метра',
        panelHeight: 2500,
        panelWidth: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        purchasePricePerUnit: 4200,
        retailPricePerUnit: 6000,
        active: true,
        priority: 0,
      },
      {
        name: '3D-панель 3000x2500',
        description: 'Широкая 3D-панель для забора высотой 3 метра',
        panelHeight: 3000,
        panelWidth: 2500,
        rodDiameter: 4.5,
        cellWidth: 50,
        cellHeight: 200,
        purchasePricePerUnit: 5000,
        retailPricePerUnit: 8000,
        active: true,
        priority: 10,
      },
      {
        name: '3D-панель 2000x3000',
        description: 'Широкая 3D-панель для забора высотой 2 метра',
        panelHeight: 2000,
        panelWidth: 3000,
        rodDiameter: 4.5,
        cellWidth: 50,
        cellHeight: 200,
        purchasePricePerUnit: 4200,
        retailPricePerUnit: 6000,
        active: true,
        priority: 2,
      },
      {
        name: '3D-панель 1500x2500',
        description: 'Низкая 3D-панель для забора высотой 1.5 метра',
        panelHeight: 1500,
        panelWidth: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        purchasePricePerUnit: 2800,
        retailPricePerUnit: 4000,
        active: true,
        priority: 3,
      },
      {
        name: '3D-панель 1700x2500',
        description: '3D-панель для забора высотой 1.7 метра',
        panelHeight: 1700,
        panelWidth: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        purchasePricePerUnit: 3150,
        retailPricePerUnit: 4500,
        active: true,
        priority: 4,
      },
    ],
    skipDuplicates: true,
  });

  console.log('[SEED] Panel3D createMany result - Count:', panel3DResult.count);

  console.log('[SEED] Seeding PicketProfileType...');
  await prisma.picketProfileType.createMany({
    data: [
      { name: 'П-образный', description: 'П-образный профиль евроштакетника', sortOrder: 0, active: true },
      { name: 'М-образный', description: 'М-образный профиль евроштакетника', sortOrder: 1, active: true },
      { name: 'Полукруглый (С-образный)', description: 'Полукруглый (С-образный) профиль евроштакетника', sortOrder: 2, active: true },
    ],
    skipDuplicates: true,
  });
  console.log('[SEED] PicketProfileType seeded successfully');

  console.log('[SEED] Seeding PicketCoating...');
  await prisma.picketCoating.createMany({
    data: [
      { name: 'Пластизол', description: 'Покрытие Пластизол', sortOrder: 0, active: true },
      { name: 'Пурал', description: 'Покрытие Пурал', sortOrder: 1, active: true },
      { name: 'PVDF', description: 'Покрытие PVDF', sortOrder: 2, active: true },
      { name: 'Printech', description: 'Покрытие Printech', sortOrder: 3, active: true },
      { name: 'Глянцевый полиэстер', description: 'Глянцевый полиэстер', sortOrder: 4, active: true },
      { name: 'Матовый полиэстер', description: 'Матовый полиэстер', sortOrder: 5, active: true },
    ],
    skipDuplicates: true,
  });
  console.log('[SEED] PicketCoating seeded successfully');

  console.log('[SEED] Checking existing PicketType records...');
  const existingPickets = await prisma.picketType.findMany({ include: { profileType: true, coating: true } });
  console.log('[SEED] Found', existingPickets.length, 'existing PicketType records');
  existingPickets.forEach(p => {
    console.log(`[SEED] Existing: ${p.name} - Profile: ${p.profileType?.name || 'N/A'}, Coating: ${p.coating?.name || 'N/A'}`);
  });

  const profileTypes = await prisma.picketProfileType.findMany();
  const coatings = await prisma.picketCoating.findMany();

  const pProfileMap: Record<string, string> = {};
  profileTypes.forEach(p => { pProfileMap[p.name] = p.id; });

  const coatingMap: Record<string, string> = {};
  coatings.forEach(c => { coatingMap[c.name] = c.id; });

  if (profileTypes.length > 0 && coatings.length > 0) {
    const picketData = [
      {
        name: 'Евроштакетник П-образный 1.5м',
        description: 'П-образный евроштакетник высотой 1.5 метра',
        metalThickness: 0.45,
        width: 115,
        length: 1500,
        color: 'RAL 8017',
        purchasePricePerMeter: 45,
        retailPricePerMeter: 65,
        active: true,
        priority: 0,
        profileTypeId: pProfileMap['П-образный'],
        coatingId: coatingMap['Глянцевый полиэстер'],
      },
      {
        name: 'Евроштакетник П-образный 1.8м',
        description: 'П-образный евроштакетник высотой 1.8 метра',
        metalThickness: 0.45,
        width: 115,
        length: 1800,
        color: 'RAL 8017',
        purchasePricePerMeter: 50,
        retailPricePerMeter: 72,
        active: true,
        priority: 0,
        profileTypeId: pProfileMap['П-образный'],
        coatingId: coatingMap['Глянцевый полиэстер'],
      },
      {
        name: 'Евроштакетник П-образный 2.0м',
        description: 'П-образный евроштакетник высотой 2.0 метра',
        metalThickness: 0.45,
        width: 115,
        length: 2000,
        color: 'RAL 8017',
        purchasePricePerMeter: 55,
        retailPricePerMeter: 78,
        active: true,
        priority: 0,
        profileTypeId: pProfileMap['П-образный'],
        coatingId: coatingMap['Глянцевый полиэстер'],
      },
      {
        name: 'Евроштакетник М-образный 1.5м',
        description: 'М-образный евроштакетник высотой 1.5 метра',
        metalThickness: 0.45,
        width: 110,
        length: 1500,
        color: 'RAL 8017',
        purchasePricePerMeter: 48,
        retailPricePerMeter: 68,
        active: true,
        priority: 0,
        profileTypeId: pProfileMap['М-образный'],
        coatingId: coatingMap['Глянцевый полиэстер'],
      },
      {
        name: 'Евроштакетник М-образный 1.8м',
        description: 'М-образный евроштакетник высотой 1.8 метра',
        metalThickness: 0.45,
        width: 110,
        length: 1800,
        color: 'RAL 8017',
        purchasePricePerMeter: 52,
        retailPricePerMeter: 75,
        active: true,
        priority: 0,
        profileTypeId: pProfileMap['М-образный'],
        coatingId: coatingMap['Глянцевый полиэстер'],
      },
      {
        name: 'Евроштакетник М-образный 2.0м',
        description: 'М-образный евроштакетник высотой 2.0 метра',
        metalThickness: 0.45,
        width: 110,
        length: 2000,
        color: 'RAL 8017',
        purchasePricePerMeter: 58,
        retailPricePerMeter: 82,
        active: true,
        priority: 0,
        profileTypeId: pProfileMap['М-образный'],
        coatingId: coatingMap['Глянцевый полиэстер'],
      },
      {
        name: 'Евроштакетник Полукруглый 1.5м',
        description: 'Полукруглый евроштакетник высотой 1.5 метра',
        metalThickness: 0.45,
        width: 120,
        length: 1500,
        color: 'RAL 8017',
        purchasePricePerMeter: 50,
        retailPricePerMeter: 72,
        active: true,
        priority: 0,
        profileTypeId: pProfileMap['Полукруглый (С-образный)'],
        coatingId: coatingMap['Глянцевый полиэстер'],
      },
      {
        name: 'Евроштакетник Полукруглый 1.8м',
        description: 'Полукруглый евроштакетник высотой 1.8 метра',
        metalThickness: 0.45,
        width: 120,
        length: 1800,
        color: 'RAL 8017',
        purchasePricePerMeter: 55,
        retailPricePerMeter: 78,
        active: true,
        priority: 0,
        profileTypeId: pProfileMap['Полукруглый (С-образный)'],
        coatingId: coatingMap['Глянцевый полиэстер'],
      },
      {
        name: 'Евроштакетник Полукруглый 2.0м',
        description: 'Полукруглый евроштакетник высотой 2.0 метра',
        metalThickness: 0.45,
        width: 120,
        length: 2000,
        color: 'RAL 8017',
        purchasePricePerMeter: 60,
        retailPricePerMeter: 85,
        active: true,
        priority: 0,
        profileTypeId: pProfileMap['Полукруглый (С-образный)'],
        coatingId: coatingMap['Глянцевый полиэстер'],
      },
    ];

    const picketResult = await prisma.picketType.createMany({
      data: picketData,
      skipDuplicates: true,
    });

    console.log('[SEED] PicketType createMany result - Count:', picketResult.count);
  } else {
    console.log('[SEED] Skipping PicketType seeding - missing profile types or coatings');
  }

  console.log('Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

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
    },
  });
  console.log(`[CREATED] ${email}`);
}

async function main() {
  console.log('Seeding database...');

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

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('=== Проверка данных в базе данных ===\n');

  try {
    // 1. Проверяем 3D-панели
    console.log('1. 3D-панели (активные):');
    const panels = await prisma.panel3D.findMany({
      where: { active: true },
      orderBy: [{ priority: 'asc' }, { panelHeight: 'asc' }],
      take: 5,
      select: {
        id: true,
        name: true,
        panelHeight: true,
        panelWidth: true,
        retailPricePerUnit: true,
      }
    });
    
    if (panels.length === 0) {
      console.log('   ⚠️ Нет активных 3D-панелей');
    } else {
      panels.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p.id}, Высота: ${p.panelHeight}мм, Цена: ${p.retailPricePerUnit}руб)`);
      });
    }

    // 2. Проверяем работы
    console.log('\n2. Работы (активные, для калькулятора):');
    const works = await prisma.work.findMany({
      where: {
        active: true,
        useInCalculator: true
      },
      orderBy: { sortOrder: 'asc' },
      take: 10,
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
      }
    });

    if (works.length === 0) {
      console.log('   ⚠️ Нет активных работ для калькулятора');
    } else {
      works.forEach(w => {
        console.log(`   - ${w.name} (${w.category}, ${w.price}руб)`);
      });
    }

    // 3. Проверяем связи между работами и 3D-панелями
    console.log('\n3. Связи между работами и 3D-панелями:');
    const workRelations = await prisma.workRelation.findMany({
      where: {
        referenceType: 'PANEL_3D'
      },
      include: {
        work: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            active: true,
            useInCalculator: true,
          }
        },
        panel3D: {
          select: {
            id: true,
            name: true,
            panelHeight: true,
            active: true,
          }
        }
      }
    });

    if (workRelations.length === 0) {
      console.log('   ❌ НЕТ связей между работами и 3D-панелями');
      console.log('   Это объясняет, почему работы не попадают в расчет!');
    } else {
      console.log(`   Найдено ${workRelations.length} связей:`);
      workRelations.forEach(rel => {
        const panelName = rel.panel3D ? rel.panel3D.name : 'Неизвестно';
        const workName = rel.work ? rel.work.name : 'Неизвестно';
        const workActive = rel.work ? (rel.work.active ? '✅' : '❌') : '-';
        const workUseInCalc = rel.work ? (rel.work.useInCalculator ? '✅' : '❌') : '-';
        console.log(`   - Работа "${workName}" связана с панелью "${panelName}" (Актив: ${workActive}, В кальк: ${workUseInCalc})`);
      });
    }

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n=== ПРОВЕРКА ЗАВЕРШЕНА ===');
}

checkData();

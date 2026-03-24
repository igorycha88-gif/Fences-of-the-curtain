const { PrismaClient } = require('@prisma/client');
const fenceEstimateService = require('./src/services/calculator/fenceEstimateService.ts').calculateFenceEstimate;

const prisma = new PrismaClient();

async function testEstimate() {
  console.log('=== Тестирование расчета сметы с 3D-панелями ===\n');

  try {
    // Получаем ID типа забора "3D-панели"
    const fenceType = await prisma.fenceType.findFirst({
      where: { name: '3D-панели' }
    });

    if (!fenceType) {
      console.error('❌ Тип забора "3D-панели" не найден');
      return;
    }

    console.log(`Тип забора: ${fenceType.name} (ID: ${fenceType.id})\n`);

    // Делаем расчет
    const estimateInput = {
      fenceTypeId: fenceType.id,
      length: 10,
      height: 2,
      lagRows: 2,
      hasGate: false,
      hasWicket: false
    };

    console.log('Входные параметры:');
    console.log(`  - Длина: ${estimateInput.length}м`);
    console.log(`  - Высота: ${estimateInput.height}м`);
    console.log(`  - Рядов лаг: ${estimateInput.lagRows}\n`);

    const result = await fenceEstimateService(estimateInput);

    console.log('Результат расчета:');
    console.log(`  - ID сметы: ${result.estimateId}`);
    console.log(`  - Всего материалов: ${result.totals.materials}руб`);
    console.log(`  - Всего монтажа: ${result.totals.installation}руб`);
    console.log(`  - Итого: ${result.totals.grandTotal}руб\n`);

    console.log('Позиции в смете:');
    result.items.forEach(item => {
      console.log(`  - [${item.category}] ${item.nomenclatureName}: ${item.quantity} x ${item.pricePerUnit}руб = ${item.totalPrice}руб`);
    });

    console.log('\nАнализ работ по монтажу 3D-панели:');
    const installationItems = result.items.filter(item => item.category === 'installation');
    console.log(`  Всего работ по монтажу: ${installationItems.length}`);
    installationItems.forEach(item => {
      console.log(`  - ${item.nomenclatureName}: ${item.quantity} x ${item.pricePerUnit}руб = ${item.totalPrice}руб`);
    });

    // Проверяем, есть ли работа "Мотнаж 3д"
    const panel3dWork = installationItems.find(item => item.nomenclatureName.includes('Мотнаж 3д') || item.nomenclatureName.includes('Монтаж'));
    if (panel3dWork) {
      console.log(`\n✅ Работа по монтажу 3D-панели НАЙДЕНА: "${panel3dWork.nomenclatureName}" (${panel3dWork.totalPrice}руб)`);
    } else {
      console.log('\n❌ Работа по монтажу 3D-панели НЕ НАЙДЕНА');
    }

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n=== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ===');
}

testEstimate();

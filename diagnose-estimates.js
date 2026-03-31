const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseEstimates() {
  console.log('=== Диагностика таблицы FenceEstimate ===\n');
  
  const total = await prisma.fenceEstimate.count();
  console.log(`Всего записей: ${total}`);
  
  const nullUsers = await prisma.fenceEstimate.count({
    where: { userId: null }
  });
  console.log(`Записей с userId = null: ${nullUsers}`);
  
  const withUsers = await prisma.fenceEstimate.count({
    where: { userId: { not: null } }
  });
  console.log(`Записей с userId (не null): ${withUsers}`);
  
  const nullCity = await prisma.fenceEstimate.count({
    where: { city: null }
  });
  console.log(`Записей с city = null: ${nullCity}`);
  
  if (nullUsers > 0) {
    console.log('\n⚠️  НАЙДЕНА ПРОБЛЕМА: Есть записи без userId');
    console.log('Это может вызывать ошибку при поиске по user.email и user.name');
    
    const samples = await prisma.fenceEstimate.findMany({
      where: { userId: null },
      take: 3,
      select: { id: true, createdAt: true, city: true }
    });
    console.log('\nПримеры записей с userId = null:');
    samples.forEach((s, i) => {
      console.log(`  ${i + 1}. ID: ${s.id}, City: ${s.city || 'null'}, Created: ${s.createdAt}`);
    });
  }
  
  console.log('\n=== Проверка поиска ===');
  try {
    const testSearch = await prisma.fenceEstimate.findMany({
      where: {
        OR: [
          { city: { contains: 'test', mode: 'insensitive' } },
          { user: { email: { contains: 'test', mode: 'insensitive' } } },
          { user: { name: { contains: 'test', mode: 'insensitive' } } },
        ]
      },
      take: 1
    });
    console.log('✅ Поиск работает корректно');
  } catch (error) {
    console.log('❌ Ошибка при поиске:', error.message);
  }
  
  console.log('\n=== Диагностика завершена ===');
}

diagnoseEstimates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

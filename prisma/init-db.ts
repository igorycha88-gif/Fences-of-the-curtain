const prisma = require('./prisma/generated/client');

async function main() {
  try {
    console.log('Starting database initialization...');

    await prisma.$connect();

    console.log('Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful:', result);

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

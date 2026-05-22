import { PrismaClient } from '@prisma/client';
import { hash } from '../src/lib/password';

const prisma = new PrismaClient();

async function updateAdminPassword() {
  const email = 'admin@fences.ru';
  const newPassword = 'admin123New!';

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`User ${email} not found`);
      return;
    }

    const hashedPassword = await hash(newPassword);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log(`[SUCCESS] Password updated for ${email}`);
  } catch (error) {
    console.error('[ERROR] Failed to update password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
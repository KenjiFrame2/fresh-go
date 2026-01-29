import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ УСПЕХ: База данных подключена!");
    const count = await prisma.user.count();
    console.log("Количество юзеров:", count);
  } catch (e) {
    console.error("❌ ОШИБКА:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
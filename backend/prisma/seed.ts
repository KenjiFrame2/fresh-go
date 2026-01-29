import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const categories = ['Молочные продукты', 'Выпечка', 'Мясо', 'Овощи и фрукты', 'Напитки', 'Другое'];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}
main();
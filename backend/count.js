const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.count()
  .then(n => console.log('Total products in DB:', n))
  .finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.product.findMany({
  where: { isActive: true },
  select: { name: true, imageUrl: true, price: true },
  orderBy: { name: 'asc' }
}).then(products => {
  console.log('Product Name\tImage URL\tPrice');
  products.forEach(p => {
    console.log(`${p.name}\t${p.imageUrl || ''}\t₹${p.price}`);
  });
  console.log(`\nTotal: ${products.length} products`);
  p.$disconnect();
});

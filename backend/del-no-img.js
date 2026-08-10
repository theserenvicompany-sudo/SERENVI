const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.product.count({ where: { imageUrl: null } })
  .then(r => { console.log('Products with NO image:', r); return p.product.count(); })
  .then(t => { console.log('Total products:', t); p.$disconnect(); });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.product.findMany({
    where: { gender: 'Men' },
    select: { name: true, type: true },
    orderBy: { type: 'asc' }
  });

  const byType = {};
  rows.forEach(r => {
    if (!byType[r.type]) byType[r.type] = [];
    byType[r.type].push(r.name);
  });

  console.log(`\nMen products by type (${rows.length} total):\n`);
  Object.entries(byType).forEach(([type, names]) => {
    console.log(`TYPE: "${type}" (${names.length})`);
    names.slice(0, 3).forEach(n => console.log(`  - ${n}`));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

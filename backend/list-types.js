const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.product.findMany({
    select: { type: true, gender: true }
  });

  const byType = {};
  rows.forEach(r => {
    if (!byType[r.type]) byType[r.type] = { Women: 0, Men: 0, Kids: 0, total: 0 };
    byType[r.type][r.gender] = (byType[r.type][r.gender] || 0) + 1;
    byType[r.type].total++;
  });

  console.log('\nAll product types:\n');
  Object.entries(byType)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([type, counts]) => {
      console.log(`  "${type}" → total:${counts.total} | W:${counts.Women||0} M:${counts.Men||0} K:${counts.Kids||0}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());

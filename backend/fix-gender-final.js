// Final cleanup: fix any remaining products where the name contains "Women" but gender is Men
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Women-labelled items still in Men
  const stillWrong = await prisma.product.findMany({
    where: {
      gender: 'Men',
      OR: [
        { name: { contains: 'Women', mode: 'insensitive' } },
        { name: { contains: 'woman', mode: 'insensitive' } },
        { type: { in: ['Dresses', 'Dresses & Gowns', 'Skirts', 'Kurtis & Tunics',
                        'Camisoles & Slips', 'Shrugs & Jackets', 'Jeans & Jeggings',
                        'Shirts, Tops & Tunic', 'Tops & Tshirts'] } },
      ]
    },
    select: { id: true, name: true, type: true, gender: true }
  });

  console.log(`\nRemaining mismatches: ${stillWrong.length}`);
  stillWrong.forEach(p => console.log(`  - ${p.name} (${p.type})`));

  if (stillWrong.length > 0) {
    await prisma.product.updateMany({
      where: { id: { in: stillWrong.map(p => p.id) } },
      data: { gender: 'Women' }
    });
    console.log(`✅ Fixed ${stillWrong.length} more products`);
  }

  // Final tally
  const final = await prisma.product.groupBy({
    by: ['gender'],
    _count: { gender: true }
  });
  console.log('\nFinal distribution:');
  final.forEach(r => console.log(`  ${r.gender}: ${r._count.gender}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());

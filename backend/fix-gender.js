/**
 * fix-gender.js
 * Re-assigns gender based on:
 *  1. Product name containing "Women"/"Men"/"Kids"/"Boys"/"Girls"
 *  2. Product type being exclusively female (Dresses, Kurtis, Skirts, etc.)
 *  3. Product type being exclusively male (Trunks, Boxers, Dhotis, etc.)
 *  4. Sweatshirt/hoodie cropped items → Women
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Types that are definitively Women's regardless of name
const ALWAYS_WOMEN_TYPES = new Set([
  'dresses', 'dresses & gowns', 'skirts', 'kurtis & tunics', 'kurtis',
  'tunics', 'sarees', 'lehengas', 'blouses', 'camisoles & slips',
  'tops & tshirts', 'shirts, tops & tunic', 'shrugs & jackets',
  'jeans & jeggings', 'palazzos', 'salwar suits', 'dupattas',
  'bras', 'lingerie', 'nightdresses', 'maternity wear',
  'jumpsuits & playsuits', 'rakhis', 'kaftans',
]);

// Types that are definitively Men's regardless of name
const ALWAYS_MEN_TYPES = new Set([
  'trunks', 'boxers', 'dhotis', 'lungis', 'briefs', 'kurta pyjama sets',
  'sherwanis', 'waistcoats',
]);

function inferGender(name, type) {
  const n = (name || '').toLowerCase();
  const t = (type || '').toLowerCase().trim();

  // 1. Explicit in name (most reliable)
  if (n.includes(' women ') || n.startsWith('women ') || n.includes(' women\'s') || n.includes("women's")) return 'Women';
  if (n.includes(' men ') || n.startsWith('men ') || n.includes(" men's") || n.includes("men's")) return 'Men';
  if (n.includes('boys') || n.includes('girls') || n.includes('kids')) return 'Kids';

  // 2. Type is exclusively one gender
  if (ALWAYS_WOMEN_TYPES.has(t)) return 'Women';
  if (ALWAYS_MEN_TYPES.has(t)) return 'Men';

  // 3. Name hints (secondary)
  if (n.includes('dress') || n.includes('skirt') || n.includes('kurti') ||
      n.includes('saree') || n.includes('lehenga') || n.includes('camisole') ||
      n.includes('jumpsuit') || n.includes('playsuit') || n.includes('palazzo') ||
      n.includes('tunic') || n.includes('blouse') || n.includes('bra') ||
      n.includes('frill') || n.includes('ruffled') || n.includes('strappy') ||
      n.includes('crop top') || n.includes('bodycon') || n.includes('wrap')) return 'Women';

  if (n.includes('trunk') || n.includes('boxer') || n.includes('dhoti') ||
      n.includes('lungi') || n.includes('brief')) return 'Men';

  return null; // keep existing
}

async function main() {
  const all = await prisma.product.findMany({
    select: { id: true, name: true, type: true, gender: true }
  });

  console.log(`\nAnalyzing ${all.length} products...\n`);

  const updates = [];
  const unchanged = [];

  for (const p of all) {
    const inferred = inferGender(p.name, p.type);
    if (inferred && inferred !== p.gender) {
      updates.push({ id: p.id, oldGender: p.gender, newGender: inferred, name: p.name, type: p.type });
    } else {
      unchanged.push(p);
    }
  }

  console.log(`Products to fix: ${updates.length}`);
  console.log(`Products unchanged: ${unchanged.length}\n`);

  if (updates.length > 0) {
    console.log('Sample fixes:');
    updates.slice(0, 15).forEach(u =>
      console.log(`  [${u.oldGender} → ${u.newGender}] ${u.name} (${u.type})`)
    );
    if (updates.length > 15) console.log(`  ... and ${updates.length - 15} more\n`);

    // Apply fixes in batches
    let fixed = 0;
    for (const u of updates) {
      await prisma.product.update({
        where: { id: u.id },
        data: { gender: u.newGender }
      });
      fixed++;
      if (fixed % 10 === 0) process.stdout.write(`\r  Fixed ${fixed}/${updates.length}...`);
    }
    console.log(`\r  ✅ Fixed ${fixed}/${updates.length} products\n`);
  }

  // Final tally
  const final = await prisma.product.groupBy({
    by: ['gender'],
    _count: { gender: true },
    orderBy: { gender: 'asc' }
  });

  console.log('✅ Final gender distribution:');
  final.forEach(row => console.log(`   ${row.gender}: ${row._count.gender}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());

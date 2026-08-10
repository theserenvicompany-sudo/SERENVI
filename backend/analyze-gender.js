const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Product types that are clearly Women's
const WOMEN_TYPES = [
  'camisoles', 'slips', 'dresses', 'kurtas', 'sarees', 'lehenga', 'blouse',
  'skirts', 'leggings', 'palazzos', 'tunics', 'kurtis', 'salwar', 'dupatta',
  'bra', 'lingerie', 'bikini', 'swimsuit', 'nightdress', 'maternity',
  'rakhis', 'rakhi',
];

// Product types that are clearly Men's
const MEN_TYPES = [
  'shirts', 'trousers', 'chinos', 'polo', 'blazers', 'suits', 'dhotis',
  'lungis', 'boxers', 'briefs', 'vests', 'kurta pyjama',
];

// Name keywords that indicate gender
const WOMEN_NAME_KEYWORDS = [
  'women', 'woman', 'ladies', 'lady', 'girl', 'female', 'feminine',
  'camisole', 'dress', 'skirt', 'saree', 'lehenga', 'kurti', 'palazzo',
  'blouse', 'bra', 'lingerie', 'dupatta', 'salwar', 'kameez', 'legging',
  'frill', 'floral print sheath', 'bodycon', 'wrap dress', 'midi', 'maxi',
  'tunic', 'peplum', 'flare', 'halter', 'strappy', 'bandeau',
];

const MEN_NAME_KEYWORDS = [
  'men ', "men'", ' men', 'male', 'gents', 'boxer', 'brief', 'dhoti', 'lungi',
];

async function main() {
  const all = await prisma.product.findMany({
    select: { id: true, name: true, type: true, gender: true }
  });

  console.log(`\nTotal products: ${all.length}\n`);

  // Count by gender
  const byGender = {};
  all.forEach(p => { byGender[p.gender] = (byGender[p.gender] || 0) + 1; });
  console.log('Current gender distribution:');
  Object.entries(byGender).forEach(([g, n]) => console.log(`  ${g}: ${n}`));

  // Find potential mismatches
  const mislabeled = [];

  for (const p of all) {
    const nameLower = (p.name || '').toLowerCase();
    const typeLower = (p.type || '').toLowerCase();

    const looksWomen =
      WOMEN_NAME_KEYWORDS.some(k => nameLower.includes(k)) ||
      WOMEN_TYPES.some(k => typeLower.includes(k));

    const looksMen =
      MEN_NAME_KEYWORDS.some(k => nameLower.includes(k)) ||
      MEN_TYPES.some(k => typeLower.includes(k));

    if (p.gender === 'Men' && looksWomen && !looksMen) {
      mislabeled.push({ ...p, suggestedGender: 'Women' });
    } else if (p.gender === 'Women' && looksMen && !looksWomen) {
      mislabeled.push({ ...p, suggestedGender: 'Men' });
    }
  }

  console.log(`\nPotentially mislabeled products: ${mislabeled.length}`);
  mislabeled.slice(0, 20).forEach(p => {
    console.log(`  [${p.gender} → ${p.suggestedGender}] ${p.name} (type: ${p.type})`);
  });

  if (mislabeled.length > 20) {
    console.log(`  ... and ${mislabeled.length - 20} more`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

/**
 * seed-all-from-xlsx.js
 * Seeds ALL products (Women + Men) from ajio_90pct_sale_with_gender.xlsx
 * Price rules:
 *   - All prices end in 99
 *   - Anything originally < 400 is raised to a minimum of 499
 */

const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

// ─── Price adjustment ─────────────────────────────────────────────────────────
function adjustPrice(raw) {
  let p = typeof raw === 'number' ? Math.round(raw) : parseInt(String(raw).replace(/[^\d]/g, '') || '0', 10);
  if (!p || isNaN(p)) p = 499;

  // Raise floor: anything under 400 → at least 499
  if (p < 400) p = 499;

  // Round to nearest number ending in 99 (ceiling approach)
  // e.g. 500 → 599, 799 → 799, 1200 → 1299
  const remainder = p % 100;
  if (remainder === 99) return p;           // already ends in 99
  const base = Math.floor(p / 100) * 100;
  return base + 99 < p ? base + 199 : base + 99;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const xlsxPath = path.join(__dirname, '..', 'ajio_90pct_sale_with_gender.xlsx');
  console.log(`\n📂 Reading: ${xlsxPath}`);

  const workbook = XLSX.readFile(xlsxPath);
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const rows     = XLSX.utils.sheet_to_json(sheet);

  console.log(`📋 Found ${rows.length} rows in XLSX`);

  // ── Clear existing products (and cart items referencing them) ──────────────
  console.log('\n🗑️  Clearing existing cart items...');
  const cartDel = await prisma.cartItem.deleteMany({});
  console.log(`   Deleted ${cartDel.count} cart items`);

  console.log('🗑️  Clearing existing products...');
  const prodDel = await prisma.product.deleteMany({});
  console.log(`   Deleted ${prodDel.count} products\n`);

  // ── Build product list ─────────────────────────────────────────────────────
  const products = rows
    .filter(r => (r['Product Name'] || '').trim())
    .map(r => {
      const rawPrice  = r['Prices'];
      const adjPrice  = adjustPrice(rawPrice);
      const gender    = (r['Gender'] || 'Unisex').trim();
      // Normalize gender label
      const genderOut = gender === 'Male' ? 'Men' : gender === 'Female' ? 'Women' : gender;

      return {
        name:          r['Product Name'].trim(),
        price:         adjPrice,
        category:      (r['Category'] || 'Clothing').trim(),
        type:          (r['Type'] || '').trim(),
        imageUrl:      (r['Image URL(s)'] || '').split('|')[0].trim() || null,
        stockQuantity: parseInt(r['Stock Quantity'] || '100', 10) || 100,
        description:   r['Description'] ? r['Description'].trim() : null,
        sizes:         r['Size/Color Variants'] ? String(r['Size/Color Variants']).trim() : null,
        gender:        genderOut,
        isActive:      true,
      };
    });

  console.log(`📦 Inserting ${products.length} products (Women + Men)...\n`);

  // ── Insert in batches of 50 to avoid query size limits ────────────────────
  const BATCH = 50;
  let total = 0;
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    const result = await prisma.product.createMany({ data: batch });
    total += result.count;
    console.log(`  ✅ ${total}/${products.length} inserted...`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const byGender = {};
  products.forEach(p => { byGender[p.gender] = (byGender[p.gender] || 0) + 1; });

  const byCategory = {};
  products.forEach(p => { byCategory[p.category] = (byCategory[p.category] || 0) + 1; });

  const priceBuckets = { 'under499': 0, '499-999': 0, '1000-1999': 0, '2000+': 0 };
  products.forEach(p => {
    if      (p.price < 499)  priceBuckets['under499']++;
    else if (p.price < 1000) priceBuckets['499-999']++;
    else if (p.price < 2000) priceBuckets['1000-1999']++;
    else                     priceBuckets['2000+']++;
  });

  console.log(`\n🎉 SEEDING COMPLETE — ${total} products inserted\n`);
  console.log('📊 By Gender:');
  Object.entries(byGender).forEach(([g, n]) => console.log(`   ${g}: ${n}`));
  console.log('\n📊 By Category:');
  Object.entries(byCategory).forEach(([c, n]) => console.log(`   ${c}: ${n}`));
  console.log('\n💰 Price Distribution (after adjustment):');
  Object.entries(priceBuckets).forEach(([b, n]) => console.log(`   ₹${b}: ${n} products`));
  console.log('\n✅ All prices end in 99. Items previously under ₹400 raised to ₹499 minimum.');
}

main()
  .catch(err => { console.error('\n❌ Error:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());

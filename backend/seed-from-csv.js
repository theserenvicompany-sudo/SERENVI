const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Path to the CSV (one level up from backend/)
const CSV_PATH = path.join(__dirname, '..', 'ajio_men_90pct_277products.csv');

function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { cols.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    cols.push(current.trim());
    if (cols.length < 2) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h] = (cols[idx] || '').replace(/^"|"$/g, '').trim(); });
    rows.push(row);
  }
  return rows;
}

function parsePrice(raw) {
  const cleaned = (raw || '').replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

async function main() {
  console.log(`\n📂 Reading CSV from: ${CSV_PATH}\n`);
  const rows = parseCSV(CSV_PATH);
  console.log(`📋 Found ${rows.length} rows in CSV\n`);

  const products = rows
    .filter(row => (row['Product Name'] || '').trim())
    .map(row => ({
      name: row['Product Name'].trim(),
      price: parsePrice(row['Prices']),
      category: row['Category'] || 'Clothing',
      type: row['Type'] || '',
      imageUrl: (row['Image URL(s)'] || '').split('|')[0].trim() || null,
      stockQuantity: parseInt(row['Stock Quantity'] || '100', 10) || 100,
      description: row['Description'] || null,
      sizes: row['Size/Color Variants'] || null,
      gender: row['Gender'] || 'Unisex',
      isActive: true,
    }));

  console.log(`📦 Inserting ${products.length} products...\n`);

  const result = await prisma.product.createMany({
    data: products,
    skipDuplicates: false,   // insert all; use true if you re-run to skip existing
  });

  console.log(`\n🎉 Done! Inserted ${result.count} products into the database.`);
}

main()
  .catch(err => { console.error('❌ Error:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());

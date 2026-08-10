const XLSX = require('./backend/node_modules/xlsx');
const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3001/api';

// Helper: make HTTP requests
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  // 1. Login
  console.log('Logging in...');
  const loginRes = await request('POST', '/auth/login', {
    email: 'admin@serenvi.com',
    password: 'Admin@123',
  });
  const token = loginRes.data.access_token;
  if (!token) { console.error('Login failed', loginRes.data); process.exit(1); }
  console.log('✓ Logged in');

  // 2. Get existing product names to skip already-imported ones
  console.log('\nFetching existing products...');
  const prodRes = await request('GET', '/products?take=500', null, token);
  const existing = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.products ?? [];
  const existingNames = new Set(existing.map(p => p.name));
  console.log(`Found ${existing.length} existing products — will skip these.`);

  // 3. Read Excel file
  console.log('\nReading Excel file...');
  const wb = XLSX.readFile('ajio_90pct_sale_with_gender.xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws); // uses first row as headers
  console.log(`Found ${rows.length} products in Excel`);

  // 4. Import products
  console.log('\nImporting products...');
  let success = 0;
  let fail = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row['Product Name'] || '').trim();
    if (!name) continue;
    // Skip if already imported
    if (existingNames.has(name)) continue;

    // Parse price — strip ₹ and commas
    let price = row['Prices'];
    if (typeof price === 'string') {
      price = parseFloat(price.replace(/[₹,\s]/g, ''));
    }
    price = Math.round(Number(price) || 0);

    const category = String(row['Category'] || 'General').trim();
    const productType = String(row['Type'] || category).trim();
    const imageUrl = String(row['Image URL(s)'] || '').trim() || undefined;
    const description = String(row['Description'] || '').trim() || `${name} — quality product.`;
    const stockQuantity = parseInt(row['Stock Quantity']) || 100;
    const gender = String(row['Gender'] || 'Unisex').trim();
    const sizes = String(row['Size/Color Variants'] || '').trim() || undefined;

    const payload = {
      name: name.substring(0, 200),
      description: description.substring(0, 500),
      price,
      category: productType, // Use specific type as category (Dresses, T-Shirts, etc.)
      type: 'PHYSICAL',
      stockQuantity,
      gender,
      ...(imageUrl ? { imageUrl } : {}),
      ...(sizes ? { sizes } : {}),
    };

    const res = await request('POST', '/products', payload, token);
    if (res.status === 201 || res.status === 200) {
      success++;
      if (success % 50 === 0) console.log(`  Progress: ${success} imported...`);
    } else {
      fail++;
      if (errors.length < 5) errors.push({ name, error: res.data });
    }

    // Small delay to avoid overwhelming the server
    if (i % 10 === 0) await sleep(50);
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Imported: ${success}`);
  console.log(`   Failed:   ${fail}`);
  if (errors.length > 0) {
    console.log('\nSample errors:');
    errors.forEach((e) => console.log(`  - ${e.name}: ${JSON.stringify(e.error)}`));
  }

  // 5. Verify
  const verifyRes = await request('GET', '/products?take=1', null, token);
  const total = verifyRes.data?.total ?? '?';
  console.log(`\n📦 Total products in DB: ${total}`);
}

main().catch(console.error);

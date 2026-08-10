/**
 * fix-prices-and-sizes.js
 * 1. Fixes prices: anything below ₹499 gets bumped to ₹499
 * 2. Seeds sizes based on product type
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const CLOTHING_SIZES    = 'XS,S,M,L,XL,XXL';
const FOOTWEAR_SIZES    = '6,7,8,9,10,11';
const NO_SIZES          = null;  // accessories, jewellery, socks, etc.

function getSizes(type, name) {
  const t = (type || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (t === 'footwear' || n.includes('shoe') || n.includes('sneaker') || n.includes('slip-on')) {
    return FOOTWEAR_SIZES;
  }
  if (
    t === 'tshirts' || t === 'shirts' || t === 'sweatshirt & hoodies' ||
    t === 'trousers & pants' || t === 'innerwear' ||
    n.includes('t-shirt') || n.includes('shirt') || n.includes('trouser') ||
    n.includes('chino') || n.includes('track pant') || n.includes('jogger') ||
    n.includes('tracksuit') || n.includes('jacket') || n.includes('sweatshirt') ||
    n.includes('hoodie') || n.includes('polo') || n.includes('trunks') ||
    n.includes('top') || n.includes('dress') || n.includes('tunic') ||
    n.includes('jumpsuit') || n.includes('skirt') || n.includes('pullover') ||
    n.includes('cardigan') || n.includes('shrug') || n.includes('jeans') ||
    n.includes('pants') || n.includes('shorts')
  ) {
    return CLOTHING_SIZES;
  }
  // Accessories, jewellery, socks, sunglasses, belts, rakhis → no sizes
  return NO_SIZES;
}

async function main() {
  // 1. Fix prices under ₹499
  const lowPrice = await p.product.updateMany({
    where: { price: { lt: 499 } },
    data:  { price: 499 },
  });
  console.log(`💰 Fixed ${lowPrice.count} products with price < ₹499 → ₹499`);

  // 2. Seed sizes
  const products = await p.product.findMany({ select: { id: true, type: true, name: true } });
  let sizedCount = 0;
  let noSizeCount = 0;

  for (const prod of products) {
    const sizes = getSizes(prod.type, prod.name);
    await p.product.update({
      where: { id: prod.id },
      data:  { sizes },
    });
    sizes ? sizedCount++ : noSizeCount++;
  }

  console.log(`📏 ${sizedCount} products given sizes | ${noSizeCount} accessories left with no sizes`);

  const total = await p.product.count();
  console.log(`✅ Done. Total products: ${total}`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); }).finally(() => p.$disconnect());

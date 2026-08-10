const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Products that NOW have images from the latest scrape
// (they were previously deleted because imageUrl was null)
const newlyImaged = [
  { name: 'Men Floral Print Slim Fit Shirt (Rosegold)', price: 1749, imageUrl: 'https://assets.ajio.com/medias/sys_master/root1/20250822/TGmB/68a8515c3d468c61ab9053ba/bhindas_rose_gold_men_floral_print_slim_fit_shirt.jpg', type: 'Shirts' },
  { name: 'Men Silver-Plated Chain with Clasp-Closure', price: 909, imageUrl: 'https://assets.ajio.com/medias/sys_master/root/20240604/u2s0/665ef06c05ac7d77bb9b692f/vien_silver-toned_men_silver-plated_chain_with_clasp-closure.jpg', type: 'Chains' },
  { name: 'Men Colourblock High-Neck T-Shirt', price: 1049, imageUrl: 'https://assets.ajio.com/medias/sys_master/root/20240513/zAGD/6641b5ac16fd2c6e6a0102a0/eyebogler_grey_men_colourblock_high-neck_t-shirt.jpg', type: 'Tshirts' },
  { name: 'Men Regular Fit Cotton Half-Sleeve Crew-Neck T-Shirts (Teal)', price: 99, imageUrl: 'https://assets.ajio.com/medias/sys_master/root1/20260710/R1ZN/6a50db7d4ce68911e314de9a/lux_nitro_teal_men_regular_fit_cotton_half-sleeve_crew-neck_t-shirts.jpg', type: 'Tshirts' },
  { name: 'Men Regular Fit Cotton Half-Sleeve Crew-Neck T-Shirts (Taupe)', price: 99, imageUrl: 'https://assets.ajio.com/medias/sys_master/root1/20260710/2rT2/6a50db894ce68911e314e01b/lux_nitro_taupe_men_regular_fit_cotton_half-sleeve_crew-neck_t-shirts.jpg', type: 'Tshirts' },
  { name: 'Men Printed Loose Fit Round-Neck T-Shirt (Black)', price: 1539, imageUrl: 'https://assets.ajio.com/medias/sys_master/root1/20260119/Z1qc/696e498f7ef0c7385c7867bd/clafoutis_black_men_printed_loose_fit_round-neck_t-shirt.jpg', type: 'Tshirts' },
];

p.product.createMany({
  data: newlyImaged.map(item => ({
    ...item,
    category: 'Clothing',
    stockQuantity: Math.floor(Math.random() * 300) + 100,
    description: null,
    sizes: null,
    gender: 'Men',
    isActive: true,
  }))
})
.then(r => { console.log(`✅ Added ${r.count} newly-imaged products`); return p.product.count(); })
.then(t => { console.log(`📊 Total in DB: ${t}`); p.$disconnect(); });

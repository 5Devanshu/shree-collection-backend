/**
 * ONE-TIME MIGRATION — run once then delete.
 *
 * Every product currently has categorySlug = '' because the service layer
 * never wrote it (it only set categoryId). This script reads each product's
 * categoryId, looks up the matching Category row, and writes the slug back.
 *
 * Run from project root:
 *   node scripts/backfillCategorySlug.js
 *
 * Safe to re-run — products that already have a slug are skipped.
 */

import '../config/env.js';   // loads .env / Railway vars
import sequelize from '../config/db.js';
import Product  from '../modules/product/product.model.js';
import Category from '../modules/category/category.model.js';

(async () => {
  await sequelize.authenticate();
  console.log('DB connected.\n');

  // Load every category once — avoids N+1 queries
  const categories = await Category.findAll();
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.slug]));

  const products = await Product.findAll();
  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    if (p.categorySlug) { skipped++; continue; }       // already has slug

    const slug = catMap[p.categoryId];
    if (!slug) {
      console.warn(`  SKIP "${p.title}" — no category found for id ${p.categoryId}`);
      skipped++;
      continue;
    }

    await p.update({ categorySlug: slug });
    console.log(`  SET  "${p.title}" → ${slug}`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}  Skipped: ${skipped}`);
  await sequelize.close();
})();
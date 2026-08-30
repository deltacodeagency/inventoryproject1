const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const targetStr = `      await prisma.product.upsert({
        where: { sku },
        update: {
          name: cleaned.name,
          description: cleaned.description || '',
          price: Number(cleaned.price || 0),
          cost: Number(cleaned.cost || 0),
          stock: Number(cleaned.stock || 0),
          minStockAlert: Number(cleaned.minStockAlert || 0),
          image: cleaned.image || '',
          status: cleaned.status || 'active',
          createdBy,
          categoryId: cleaned.categoryId,
          brandId: cleaned.brandId,
          supplierId: cleaned.supplierId,
          updatedAt: new Date(),
        },
        create: {
          id: cleaned.id,
          sku,
          name: cleaned.name,
          description: cleaned.description || '',
          price: Number(cleaned.price || 0),
          cost: Number(cleaned.cost || 0),
          stock: Number(cleaned.stock || 0),
          minStockAlert: Number(cleaned.minStockAlert || 0),
          image: cleaned.image || '',
          status: cleaned.status || 'active',
          createdBy,
          categoryId: cleaned.categoryId,
          brandId: cleaned.brandId,
          supplierId: cleaned.supplierId,
          createdAt: cleaned.createdAt ? new Date(cleaned.createdAt) : new Date(),
          updatedAt: cleaned.updatedAt ? new Date(cleaned.updatedAt) : new Date(),
        },
      });
      continue;
    }`;

const replaceStr = `      const prod = await prisma.product.upsert({
        where: { sku },
        update: {
          name: cleaned.name,
          description: cleaned.description || '',
          price: Number(cleaned.price || 0),
          cost: Number(cleaned.cost || 0),
          stock: Number(cleaned.stock || 0),
          minStockAlert: Number(cleaned.minStockAlert || 0),
          image: cleaned.image || '',
          status: cleaned.status || 'active',
          createdBy,
          categoryId: cleaned.categoryId,
          brandId: cleaned.brandId,
          supplierId: cleaned.supplierId,
          updatedAt: new Date(),
        },
        create: {
          id: cleaned.id,
          sku,
          name: cleaned.name,
          description: cleaned.description || '',
          price: Number(cleaned.price || 0),
          cost: Number(cleaned.cost || 0),
          stock: Number(cleaned.stock || 0),
          minStockAlert: Number(cleaned.minStockAlert || 0),
          image: cleaned.image || '',
          status: cleaned.status || 'active',
          createdBy,
          categoryId: cleaned.categoryId,
          brandId: cleaned.brandId,
          supplierId: cleaned.supplierId,
          createdAt: cleaned.createdAt ? new Date(cleaned.createdAt) : new Date(),
          updatedAt: cleaned.updatedAt ? new Date(cleaned.updatedAt) : new Date(),
        },
      });

      if (Array.isArray(cleaned.batches) && cleaned.batches.length) {
        for (const batch of cleaned.batches) {
          await prisma.productBatch.upsert({
            where: { id: batch.id },
            update: {
              quantity: Number(batch.quantity || 0),
              initialQuantity: Number(batch.initialQuantity || batch.quantity || 0),
              cost: Number(batch.cost || 0),
              price: Number(batch.price || 0),
              date: batch.date ? new Date(batch.date) : new Date(),
              updatedAt: new Date()
            },
            create: {
              id: batch.id || ("batch-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9)),
              productId: prod.id,
              quantity: Number(batch.quantity || 0),
              initialQuantity: Number(batch.initialQuantity || batch.quantity || 0),
              cost: Number(batch.cost || 0),
              price: Number(batch.price || 0),
              date: batch.date ? new Date(batch.date) : new Date(),
              createdAt: batch.createdAt ? new Date(batch.createdAt) : new Date(),
              updatedAt: new Date()
            }
          });
        }
      }
      continue;
    }`;

const normalize = (str) => str.replace(/\r\n/g, '\n');
const newCode = normalize(code).replace(normalize(targetStr), normalize(replaceStr));

if (newCode === normalize(code)) {
    console.error("Replacement failed, target string not found");
} else {
    fs.writeFileSync('server.js', newCode);
    console.log("Replacement succeeded");
}

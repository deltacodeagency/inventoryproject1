import express from 'express';
import 'dotenv/config';
import { randomInt, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './src/lib/auth.ts';
import { sendEmail } from './src/lib/email.ts';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const app = express();
const port = Number(process.env.API_PORT || 3003);
const localUploadDirectory = path.join(process.cwd(), 'public', 'uploads', 'images');

const globalForPrisma = globalThis;
// Use Prisma's native PostgreSQL connection in the Node/Express server.
// The pg driver adapter times out against this Neon pooled connection, while
// the native client (also used by Prisma Studio) connects successfully.
const prisma = globalForPrisma.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma;

// Better Auth must receive the OAuth request and callback before the API routes.
// The Vite dev server proxies this public path to this backend on port 3003.
const authHandler = toNodeHandler(auth);
app.all('/api/auth/*', (req, res, next) => {
  authHandler(req, res).catch(next);
});

app.use(express.json({ limit: '12mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

const saveLocalImage = async (image, name) => {
  const match = image.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif|avif|heic|heif|bmp|tiff));base64,(.+)$/i);
  if (!match) throw new Error('Unsupported image format. Please use JPG, PNG, WEBP, GIF, AVIF, HEIC, or HEIF.');

  const mimeType = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
  const extension = mimeType === 'image/jpeg'
    ? 'jpg'
    : mimeType === 'image/heic'
      ? 'heic'
      : mimeType === 'image/heif'
        ? 'heif'
        : mimeType === 'image/tiff'
          ? 'tif'
          : mimeType.split('/')[1];
  const baseName = path.basename(name, path.extname(name)).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60) || 'image';
  const fileName = `${baseName}-${randomUUID()}.${extension}`;

  await fs.mkdir(localUploadDirectory, { recursive: true });
  await fs.writeFile(path.join(localUploadDirectory, fileName), Buffer.from(match[2], 'base64'));
  return `/uploads/images/${fileName}`;
};

app.post('/api/upload/image', async (req, res) => {
  try {
    const apiKey = String(process.env.IMGBB_API_KEY || '').trim();
    const uploadURL = String(process.env.IMGBB_UPLOAD_URL || 'https://api.imgbb.com/1/upload').trim();
    const image = String(req.body?.image || '');
    const name = String(req.body?.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '-');

    if (!image) {
      return res.status(400).json({ ok: false, error: 'An image is required.' });
    }

    if (apiKey) {
      try {
        const imageMatch = image.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif|avif|heic|heif|bmp|tiff));base64,(.+)$/i);
        if (!imageMatch) throw new Error('Unsupported image format. Please use JPG, PNG, WEBP, GIF, AVIF, HEIC, or HEIF.');

        const imageBuffer = Buffer.from(imageMatch[2], 'base64');
        const form = new FormData();
        form.append('image', new Blob([imageBuffer], { type: imageMatch[1] }), name);
        form.append('name', name);

        const separator = uploadURL.includes('?') ? '&' : '?';
        const uploadResponse = await fetch(`${uploadURL}${separator}key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          body: form,
          signal: AbortSignal.timeout(15000),
        });
        const uploadResult = await uploadResponse.json().catch(() => ({}));
        if (uploadResponse.ok && uploadResult.success === true && uploadResult.data?.url) {
          return res.json({ ok: true, url: uploadResult.data.url, displayUrl: uploadResult.data.display_url, deleteUrl: uploadResult.data.delete_url || null, storage: 'imgbb' });
        }
        console.error('ImgBB upload error; using local fallback:', uploadResult);
      } catch (error) {
        console.error('ImgBB unavailable; using local fallback:', error?.message || error);
      }
    }

    const localURL = await saveLocalImage(image, name);
    return res.json({ ok: true, url: localURL, storage: 'local', warning: 'ImgBB is unavailable, so the image was saved locally.' });
  } catch (error) {
    console.error('ImgBB upload request failed:', error);
    return res.status(500).json({ ok: false, error: error?.message || 'Image upload failed.' });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    const [identity] = await prisma.$queryRaw`SELECT current_database()::text AS database, current_schema()::text AS schema`;
    res.json({ ok: true, service: 'pos-prisma-sync', database: identity.database, schema: identity.schema, time: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ ok: false, service: 'pos-prisma-sync', error: error?.message || 'Database unavailable' });
  }
});

app.get('/api/data/:collection', async (req, res) => {
  try {
    const queries = {
      users: () => prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, fullName: true, email: true, emailVerified: true, image: true, role: true, createdAt: true, updatedAt: true },
      }),
      products: () => prisma.product.findMany({ include: { batches: true }, orderBy: { createdAt: 'asc' } }),
      categories: () => prisma.category.findMany({ orderBy: { createdAt: 'asc' } }),
      brands: () => prisma.brand.findMany({ orderBy: { createdAt: 'asc' } }),
      suppliers: () => prisma.supplier.findMany({ orderBy: { createdAt: 'asc' } }),
      sales: () => prisma.sale.findMany({ include: { items: true }, orderBy: { date: 'desc' } }),
      purchases: () => prisma.purchase.findMany({ include: { items: true }, orderBy: { date: 'desc' } }),
      expenses: () => prisma.expense.findMany({ orderBy: { date: 'desc' } }),
      incomes: () => prisma.income.findMany({ orderBy: { date: 'desc' } }),
      returns: () => prisma.return.findMany({ include: { items: true }, orderBy: { date: 'desc' } }),
      adjustments: () => prisma.stockAdjustment.findMany({ orderBy: { date: 'desc' } }),
      transfers: () => prisma.stockTransfer.findMany({ orderBy: { date: 'desc' } }),
    };
    const query = queries[req.params.collection];
    if (!query) return res.status(404).json({ ok: false, error: 'Unknown collection' });
    return res.json({ ok: true, collection: req.params.collection, records: await query() });
  } catch (error) {
    console.error('Read from Neon error:', error);
    return res.status(500).json({ ok: false, error: error?.message || 'Database read failed' });
  }
});

app.delete('/api/data/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const models = {
      users: prisma.user,
      products: prisma.product,
      categories: prisma.category,
      brands: prisma.brand,
      suppliers: prisma.supplier,
      sales: prisma.sale,
      purchases: prisma.purchase,
      expenses: prisma.expense,
      incomes: prisma.income,
      returns: prisma.return,
      adjustments: prisma.stockAdjustment,
      transfers: prisma.stockTransfer,
    };
    const model = models[collection];
    if (!model) return res.status(404).json({ ok: false, error: 'Unknown collection' });
    
    // For sales, we might need to delete items first, but Prisma might have onDelete cascade
    // Same for products (batches). Let's assume Prisma handles relations, or we can just try delete
    try {
      if (collection === 'products') {
        await prisma.productBatch.deleteMany({ where: { productId: id } });
      } else if (collection === 'sales') {
        await prisma.saleItem.deleteMany({ where: { saleId: id } });
      }
      await model.delete({ where: { id } });
    } catch (e) {
      // ignore if not found
    }
    return res.json({ ok: true, deleted: id });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ ok: false, error: error?.message || 'Database delete failed' });
  }
});

app.post('/api/local-auth/login', async (req, res) => {
  try {
    const identity = String(req.body?.identity || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!identity || !password) return res.status(400).json({ ok: false, error: 'Identity and password are required' });

    const user = await prisma.user.findFirst({ where: { OR: [{ email: identity }, { name: identity }] } });
    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ ok: false, error: 'Invalid email/username or password' });
    }

    const { password: _password, name, ...safeUser } = user;
    return res.json({ ok: true, user: { ...safeUser, username: name } });
  } catch (error) {
    console.error('Local login error:', error);
    return res.status(500).json({ ok: false, error: error?.message || 'Login failed' });
  }
});

app.post('/api/password-reset/request', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const otp = String(randomInt(100000, 1000000));
      const identifier = `password-reset-otp:${email}`;
      await prisma.verification.deleteMany({ where: { identifier } });
      await prisma.verification.create({
        data: {
          id: randomUUID(),
          identifier,
          value: await bcrypt.hash(otp, 12),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      await sendEmail({
        to: email,
        subject: 'DreamsPOS password reset code',
        text: `Your DreamsPOS password reset code is ${otp}. It expires in 10 minutes.`,
      });
    }

    return res.json({ ok: true, message: 'If that email exists, a reset code has been sent.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ ok: false, error: 'Unable to send reset code' });
  }
});

app.post('/api/password-reset/verify', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const otp = String(req.body?.otp || '').trim();
    const record = await prisma.verification.findFirst({
      where: { identifier: `password-reset-otp:${email}`, expiresAt: { gt: new Date() } },
    });
    if (!record || !(await bcrypt.compare(otp, record.value))) {
      return res.status(400).json({ ok: false, error: 'Invalid or expired OTP' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ ok: false, error: 'Invalid or expired OTP' });
    const resetToken = randomUUID();
    await prisma.verification.delete({ where: { id: record.id } });
    await prisma.verification.create({
      data: {
        id: randomUUID(),
        identifier: `password-reset-token:${resetToken}`,
        value: user.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return res.json({ ok: true, resetToken });
  } catch (error) {
    console.error('Password reset verification error:', error);
    return res.status(500).json({ ok: false, error: 'Unable to verify reset code' });
  }
});

app.post('/api/password-reset/complete', async (req, res) => {
  try {
    const resetToken = String(req.body?.resetToken || '');
    const newPassword = String(req.body?.newPassword || '');
    if (newPassword.length < 8) return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters long' });
    const record = await prisma.verification.findFirst({
      where: { identifier: `password-reset-token:${resetToken}`, expiresAt: { gt: new Date() } },
    });
    if (!record) return res.status(400).json({ ok: false, error: 'Reset session is invalid or expired' });
    await prisma.user.update({ where: { id: record.value }, data: { password: await bcrypt.hash(newPassword, 12) } });
    await prisma.verification.delete({ where: { id: record.id } });
    return res.json({ ok: true });
  } catch (error) {
    console.error('Password reset completion error:', error);
    return res.status(500).json({ ok: false, error: 'Unable to update password' });
  }
});

const normalizeRole = (role) => {
  const normalizedRole = String(role || '').trim().toLowerCase();

  if (normalizedRole === 'admin' || normalizedRole === 'administrator' || normalizedRole === 'super admin' || normalizedRole === 'super-admin' || normalizedRole === 'superadmin') return 'Administrator';
  if (normalizedRole === 'manager' || normalizedRole === 'store manager') return 'Manager';
  if (normalizedRole === 'salesman' || normalizedRole === 'salesperson') return 'Salesman';
  return 'Salesman';
};

const normalizeAuditIdentity = (value) => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return 'administrator';

  const normalizedRole = normalizedValue.toLowerCase();
  if (normalizedRole === 'admin' || normalizedRole === 'administrator' || normalizedRole === 'super admin' || normalizedRole === 'super-admin' || normalizedRole === 'superadmin') {
    return 'administrator';
  }

  return normalizedValue;
};

const stripUndefined = (value) => {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, item]) => item === undefined ? [] : [[key, stripUndefined(item)]])
    );
  }
  return value;
};

async function ensureLegacyUserCredentials() {
  const legacyUsers = await prisma.user.findMany({ where: { OR: [{ password: null }, { fullName: '' }] } });
  if (legacyUsers.length === 0) return;
  const defaultPasswordHash = await bcrypt.hash('administrator', 12);
  await Promise.all(legacyUsers.map((user) => prisma.user.update({
    where: { id: user.id },
    data: {
      fullName: user.fullName || user.name,
      ...(user.password ? {} : { password: defaultPasswordHash }),
    },
  })));
}

async function persistCollection(collection, records = []) {
  if (!Array.isArray(records)) return { count: 0 };

  for (const record of records) {
    const cleaned = stripUndefined(record);

    if (collection === 'users') {
      const userId = cleaned.id || cleaned.email || `user-${Date.now()}`;
      const username = normalizeAuditIdentity(cleaned.username || cleaned.name || 'administrator');
      const fullName = String(cleaned.fullName || cleaned.name || username).trim();
      const email = cleaned.email || `${username}@dreamspos.local`;
      const passwordHash = cleaned.password
        ? (String(cleaned.password).startsWith('$2') ? cleaned.password : await bcrypt.hash(String(cleaned.password), 12))
        : undefined;

      await prisma.user.upsert({
        where: { id: userId },
        update: {
          name: username,
          fullName,
          email,
          emailVerified: cleaned.emailVerified ?? true,
          image: cleaned.image || null,
          role: normalizeRole(cleaned.role),
          updatedAt: new Date(),
          ...(passwordHash ? { password: passwordHash } : {}),
        },
        create: {
          id: userId,
          name: username,
          fullName,
          email,
          emailVerified: cleaned.emailVerified ?? true,
          image: cleaned.image || null,
          role: normalizeRole(cleaned.role),
          password: passwordHash || await bcrypt.hash('administrator', 12),
          createdAt: cleaned.createdAt ? new Date(cleaned.createdAt) : new Date(),
          updatedAt: cleaned.updatedAt ? new Date(cleaned.updatedAt) : new Date(),
        },
      });
      continue;
    }

    if (collection === 'products') {
      const sku = cleaned.sku || cleaned.id;
      const createdBy = normalizeAuditIdentity(cleaned.createdBy);

      const prod = await prisma.product.upsert({
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
    }

    if (collection === 'sales') {
      await prisma.sale.upsert({
        where: { invoiceNo: cleaned.invoiceNo },
        update: {
          receiptSerial: cleaned.receiptSerial || null, date: new Date(cleaned.date), customerName: cleaned.customerName,
          subtotal: Number(cleaned.subtotal || 0), discount: Number(cleaned.discount || 0), tax: Number(cleaned.tax || 0),
          total: Number(cleaned.total || 0), paidAmount: Number(cleaned.paidAmount || 0), paymentMethod: cleaned.paymentMethod,
          status: cleaned.status, salesperson: cleaned.salesperson, isOffline: Boolean(cleaned.isOffline),
          costOfGoodsSold: cleaned.costOfGoodsSold == null ? null : Number(cleaned.costOfGoodsSold), updatedAt: new Date(),
        },
        create: {
          id: cleaned.id, invoiceNo: cleaned.invoiceNo, receiptSerial: cleaned.receiptSerial || null, date: new Date(cleaned.date),
          customerName: cleaned.customerName, subtotal: Number(cleaned.subtotal || 0), discount: Number(cleaned.discount || 0),
          tax: Number(cleaned.tax || 0), total: Number(cleaned.total || 0), paidAmount: Number(cleaned.paidAmount || 0),
          paymentMethod: cleaned.paymentMethod, status: cleaned.status, salesperson: cleaned.salesperson, isOffline: Boolean(cleaned.isOffline),
          costOfGoodsSold: cleaned.costOfGoodsSold == null ? null : Number(cleaned.costOfGoodsSold),
          createdAt: cleaned.createdAt ? new Date(cleaned.createdAt) : new Date(), updatedAt: new Date(),
        },
      });
      const sale = await prisma.sale.findUniqueOrThrow({ where: { invoiceNo: cleaned.invoiceNo } });
      await prisma.saleItem.deleteMany({ where: { saleId: sale.id } });
      if (Array.isArray(cleaned.items) && cleaned.items.length) {
        await prisma.saleItem.createMany({ data: cleaned.items.map((item) => ({
          id: item.id || `${sale.id}-${item.productId}`, saleId: sale.id, productId: item.productId, productName: item.productName,
          quantity: Number(item.quantity || 0), price: Number(item.price || 0), cost: item.cost == null ? null : Number(item.cost),
        })) });
      }
      continue;
    }

    if (collection === 'categories') {
      await prisma.category.upsert({
        where: { id: cleaned.id },
        update: {
          name: cleaned.name,
          description: cleaned.description || '',
          code: cleaned.code,
          updatedAt: new Date(),
        },
        create: {
          id: cleaned.id,
          name: cleaned.name,
          description: cleaned.description || '',
          code: cleaned.code,
          createdAt: cleaned.createdAt ? new Date(cleaned.createdAt) : new Date(),
          updatedAt: cleaned.updatedAt ? new Date(cleaned.updatedAt) : new Date(),
        },
      });
      continue;
    }

    if (collection === 'brands') {
      await prisma.brand.upsert({
        where: { id: cleaned.id },
        update: {
          name: cleaned.name,
          description: cleaned.description || '',
          logo: cleaned.logo || '',
          updatedAt: new Date(),
        },
        create: {
          id: cleaned.id,
          name: cleaned.name,
          description: cleaned.description || '',
          logo: cleaned.logo || '',
          createdAt: cleaned.createdAt ? new Date(cleaned.createdAt) : new Date(),
          updatedAt: cleaned.updatedAt ? new Date(cleaned.updatedAt) : new Date(),
        },
      });
      continue;
    }

    if (collection === 'suppliers') {
      await prisma.supplier.upsert({
        where: { id: cleaned.id },
        update: {
          name: cleaned.name,
          email: cleaned.email,
          phone: cleaned.phone,
          company: cleaned.company,
          taxId: cleaned.taxId || null,
          address: cleaned.address,
          updatedAt: new Date(),
        },
        create: {
          id: cleaned.id,
          name: cleaned.name,
          email: cleaned.email,
          phone: cleaned.phone,
          company: cleaned.company,
          taxId: cleaned.taxId || null,
          address: cleaned.address,
          createdAt: cleaned.createdAt ? new Date(cleaned.createdAt) : new Date(),
          updatedAt: cleaned.updatedAt ? new Date(cleaned.updatedAt) : new Date(),
        },
      });
      continue;
    }

    if (collection === 'purchases') {
      await prisma.purchase.upsert({
        where: { purchaseNo: cleaned.purchaseNo },
        update: {
          date: new Date(cleaned.date), supplierId: cleaned.supplierId, supplierName: cleaned.supplierName,
          total: Number(cleaned.total || 0), status: cleaned.status, updatedAt: new Date(),
        },
        create: {
          id: cleaned.id, purchaseNo: cleaned.purchaseNo, date: new Date(cleaned.date),
          supplierId: cleaned.supplierId, supplierName: cleaned.supplierName, total: Number(cleaned.total || 0),
          status: cleaned.status, createdAt: cleaned.createdAt ? new Date(cleaned.createdAt) : new Date(), updatedAt: new Date(),
        }
      });
      const purchase = await prisma.purchase.findUniqueOrThrow({ where: { purchaseNo: cleaned.purchaseNo } });
      await prisma.purchaseItem.deleteMany({ where: { purchaseId: purchase.id } });
      if (Array.isArray(cleaned.items) && cleaned.items.length) {
        await prisma.purchaseItem.createMany({ data: cleaned.items.map((item) => ({
          id: item.id || `${purchase.id}-${item.productId}`, purchaseId: purchase.id, productId: item.productId,
          productName: item.productName, quantity: Number(item.quantity || 0), cost: Number(item.cost || 0),
        })) });
      }
      continue;
    }

    if (collection === 'returns') {
      await prisma.return.upsert({
        where: { returnNo: cleaned.returnNo },
        update: {
          saleId: cleaned.saleId, invoiceNo: cleaned.invoiceNo, date: new Date(cleaned.date),
          refundTotal: Number(cleaned.refundTotal || 0), reason: cleaned.reason || '', updatedAt: new Date(),
        },
        create: {
          id: cleaned.id, returnNo: cleaned.returnNo, saleId: cleaned.saleId, invoiceNo: cleaned.invoiceNo,
          date: new Date(cleaned.date), refundTotal: Number(cleaned.refundTotal || 0), reason: cleaned.reason || '',
          createdAt: cleaned.createdAt ? new Date(cleaned.createdAt) : new Date(), updatedAt: new Date(),
        }
      });
      const ret = await prisma.return.findUniqueOrThrow({ where: { returnNo: cleaned.returnNo } });
      await prisma.returnItem.deleteMany({ where: { returnId: ret.id } });
      if (Array.isArray(cleaned.items) && cleaned.items.length) {
        await prisma.returnItem.createMany({ data: cleaned.items.map((item) => ({
          id: item.id || `${ret.id}-${item.productId}`, returnId: ret.id, productId: item.productId,
          productName: item.productName, quantity: Number(item.quantity || 0), refundAmount: Number(item.refundAmount || 0),
        })) });
      }
      continue;
    }

    if (collection === 'expenses') {
      await prisma.expense.upsert({
        where: { id: cleaned.id },
        update: { category: cleaned.category, amount: Number(cleaned.amount || 0), date: new Date(cleaned.date), description: cleaned.description, updatedAt: new Date() },
        create: { id: cleaned.id, category: cleaned.category, amount: Number(cleaned.amount || 0), date: new Date(cleaned.date), description: cleaned.description, createdAt: cleaned.createdAt ? new Date(cleaned.createdAt) : new Date(), updatedAt: new Date() },
      });
      continue;
    }

    if (collection === 'incomes') {
      await prisma.income.upsert({
        where: { id: cleaned.id },
        update: { category: cleaned.category, amount: Number(cleaned.amount || 0), date: new Date(cleaned.date), description: cleaned.description, updatedAt: new Date() },
        create: { id: cleaned.id, category: cleaned.category, amount: Number(cleaned.amount || 0), date: new Date(cleaned.date), description: cleaned.description, createdAt: cleaned.createdAt ? new Date(cleaned.createdAt) : new Date(), updatedAt: new Date() },
      });
      continue;
    }

    if (collection === 'adjustments') {
      await prisma.stockAdjustment.upsert({
        where: { id: cleaned.id },
        update: { productId: cleaned.productId, productName: cleaned.productName, sku: cleaned.sku, type: cleaned.type, quantity: Number(cleaned.quantity || 0), reason: cleaned.reason, notes: cleaned.notes, date: new Date(cleaned.date), adjustedBy: cleaned.adjustedBy, cost: cleaned.cost == null ? null : Number(cleaned.cost), price: cleaned.price == null ? null : Number(cleaned.price), updatedAt: new Date() },
        create: { id: cleaned.id, productId: cleaned.productId, productName: cleaned.productName, sku: cleaned.sku, type: cleaned.type, quantity: Number(cleaned.quantity || 0), reason: cleaned.reason, notes: cleaned.notes, date: new Date(cleaned.date), adjustedBy: cleaned.adjustedBy, cost: cleaned.cost == null ? null : Number(cleaned.cost), price: cleaned.price == null ? null : Number(cleaned.price), createdAt: cleaned.createdAt ? new Date(cleaned.createdAt) : new Date(), updatedAt: new Date() },
      });
      continue;
    }

    if (collection === 'transfers') {
      await prisma.stockTransfer.upsert({
        where: { transferNo: cleaned.transferNo },
        update: { productId: cleaned.productId, productName: cleaned.productName, sku: cleaned.sku, quantity: Number(cleaned.quantity || 0), sourceLocation: cleaned.sourceLocation, destinationLocation: cleaned.destinationLocation, status: cleaned.status, date: new Date(cleaned.date), updatedAt: new Date() },
        create: { id: cleaned.id, transferNo: cleaned.transferNo, productId: cleaned.productId, productName: cleaned.productName, sku: cleaned.sku, quantity: Number(cleaned.quantity || 0), sourceLocation: cleaned.sourceLocation, destinationLocation: cleaned.destinationLocation, status: cleaned.status, date: new Date(cleaned.date), createdAt: cleaned.createdAt ? new Date(cleaned.createdAt) : new Date(), updatedAt: new Date() },
      });
      continue;
    }
  }

  return { count: records.length };
}

app.post('/api/sync', async (req, res) => {
  try {
    const { collection, records = [] } = req.body || {};

    if (!collection) {
      return res.status(400).json({ ok: false, error: 'Missing collection name' });
    }

    const result = await persistCollection(collection, records);
    return res.json({ ok: true, collection, saved: result.count });
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ ok: false, error: error?.message || 'Sync failed' });
  }
});

// Vercel imports the Express app as a serverless function. Keep the local
// listener for `npm run server`, but do not open a port inside Vercel.
if (process.env.VERCEL !== '1') {
  app.listen(port, async () => {
    try {
      await ensureLegacyUserCredentials();
      console.log(`Prisma sync server running on http://localhost:${port}`);
    } catch (error) {
      console.error('User credential migration failed:', error);
    }
  });
}

export default app;

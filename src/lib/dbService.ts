import { initialProducts, initialCategories, initialBrands, initialSuppliers, initialSales } from '../data/initialData';
import { Product, Category, Brand, Supplier, Sale } from '../types';

/**
 * Browser-Safe Database Service interfacing Prisma / Backend API
 */
export const dbService = {
  async seedDatabaseIfEmpty() {
    if (typeof window !== 'undefined') return;
    try {
      const prismaModule = await import('./prisma');
      const client = prismaModule.prisma;
      if (!client) return;

      const categoryCount = await client.category.count();
      if (categoryCount === 0) {
        for (const cat of initialCategories) {
          await client.category.upsert({
            where: { code: cat.code },
            update: {},
            create: { id: cat.id, name: cat.name, description: cat.description, code: cat.code }
          });
        }
      }
    } catch (err) {
      console.warn('Prisma seed check:', err);
    }
  },

  async fetchProducts(): Promise<Product[]> {
    if (typeof window !== 'undefined') {
      return initialProducts;
    }
    try {
      const prismaModule = await import('./prisma');
      const client = prismaModule.prisma;
      if (!client) return initialProducts;
      const products = await client.product.findMany({ include: { batches: true } });
      return products as unknown as Product[];
    } catch {
      return initialProducts;
    }
  },

  async fetchCategories(): Promise<Category[]> {
    if (typeof window !== 'undefined') {
      return initialCategories;
    }
    try {
      const prismaModule = await import('./prisma');
      const client = prismaModule.prisma;
      if (!client) return initialCategories;
      const categories = await client.category.findMany();
      return categories as Category[];
    } catch {
      return initialCategories;
    }
  },

  async fetchBrands(): Promise<Brand[]> {
    if (typeof window !== 'undefined') {
      return initialBrands;
    }
    try {
      const prismaModule = await import('./prisma');
      const client = prismaModule.prisma;
      if (!client) return initialBrands;
      const brands = await client.brand.findMany();
      return brands as Brand[];
    } catch {
      return initialBrands;
    }
  },

  async fetchSuppliers(): Promise<Supplier[]> {
    if (typeof window !== 'undefined') {
      return initialSuppliers;
    }
    try {
      const prismaModule = await import('./prisma');
      const client = prismaModule.prisma;
      if (!client) return initialSuppliers;
      const suppliers = await client.supplier.findMany();
      return suppliers as Supplier[];
    } catch {
      return initialSuppliers;
    }
  },

  async fetchSales(): Promise<Sale[]> {
    if (typeof window !== 'undefined') {
      return initialSales;
    }
    try {
      const prismaModule = await import('./prisma');
      const client = prismaModule.prisma;
      if (!client) return initialSales;
      const sales = await client.sale.findMany({ include: { items: true } });
      return sales as unknown as Sale[];
    } catch {
      return initialSales;
    }
  }
};

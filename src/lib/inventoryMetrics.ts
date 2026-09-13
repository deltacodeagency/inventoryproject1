import { Product } from '../types';
import { ensureProductBatches } from '../context/InventoryContext';

export const calculateTotalPurchases = (products: Product[]): number => products.reduce((sum, product) => {
  const batches = ensureProductBatches(product);
  return sum + batches.reduce((batchSum, batch) => batchSum + (batch.initialQuantity || batch.quantity || 0) * (batch.cost || 0), 0);
}, 0);

export const calculateStockAssetValue = (products: Product[]): number => products.reduce((sum, product) => {
  const batches = ensureProductBatches(product);
  return sum + batches.reduce((batchSum, batch) => batchSum + (batch.quantity || 0) * (batch.cost || 0), 0);
}, 0);
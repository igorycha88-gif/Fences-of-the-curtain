import { cache } from './cache';
import { CACHE_KEYS } from './cache-keys';

export async function invalidatePostTypesCache(): Promise<void> {
  await cache.del(CACHE_KEYS.POSTS_ACTIVE);
  console.log('[Cache] Invalidated POSTS_ACTIVE');
}

export async function invalidateLagTypesCache(): Promise<void> {
  await cache.del(CACHE_KEYS.LAGS_ACTIVE);
  console.log('[Cache] Invalidated LAGS_ACTIVE');
}

export async function invalidateProfnastilTypesCache(): Promise<void> {
  await cache.del(CACHE_KEYS.PROFNASTIL_ACTIVE);
  console.log('[Cache] Invalidated PROFNASTIL_ACTIVE');
}

export async function invalidateGateTypesCache(): Promise<void> {
  await cache.del(CACHE_KEYS.GATES_ACTIVE);
  console.log('[Cache] Invalidated GATES_ACTIVE');
}

export async function invalidateWicketTypesCache(): Promise<void> {
  await cache.del(CACHE_KEYS.WICKETS_ACTIVE);
  console.log('[Cache] Invalidated WICKETS_ACTIVE');
}

export async function invalidateFenceTypesCache(): Promise<void> {
  await cache.del(CACHE_KEYS.FENCE_TYPES);
  console.log('[Cache] Invalidated FENCE_TYPES');
}

export async function invalidateWorksCache(): Promise<void> {
  await cache.delPattern('calculator:works:*');
  console.log('[Cache] Invalidated all WORKS cache');
}

export async function invalidateWorksByFenceTypeCache(fenceType: string): Promise<void> {
  await cache.del(CACHE_KEYS.WORKS_BY_FENCE_TYPE(fenceType));
  console.log(`[Cache] Invalidated WORKS_BY_FENCE_TYPE:${fenceType}`);
}

export async function invalidateWorksByReferenceCache(referenceType: string, referenceId: string): Promise<void> {
  await cache.del(CACHE_KEYS.WORKS_BY_REFERENCE(referenceType, referenceId));
  console.log(`[Cache] Invalidated WORKS_BY_REFERENCE:${referenceType}:${referenceId}`);
}

export async function invalidateMountingHardwareCache(): Promise<void> {
  await cache.delPattern('calculator:hardware:*');
  console.log('[Cache] Invalidated all MOUNTING_HARDWARE cache');
}

export async function invalidateAllCalculatorCache(): Promise<void> {
  await Promise.all([
    invalidatePostTypesCache(),
    invalidateLagTypesCache(),
    invalidateProfnastilTypesCache(),
    invalidateGateTypesCache(),
    invalidateWicketTypesCache(),
    invalidateFenceTypesCache(),
    invalidateWorksCache(),
    invalidateMountingHardwareCache(),
  ]);
  console.log('[Cache] Invalidated ALL calculator cache');
}

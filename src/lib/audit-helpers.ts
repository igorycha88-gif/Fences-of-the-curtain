import { createAuditLogAsync } from '@/lib/audit';

const PRICE_FIELDS: Record<string, string[]> = {
  PostType: ['retailPricePerUnit', 'purchasePricePerUnit', 'pricePerMeter'],
  LagType: ['retailPricePerUnit', 'purchasePricePerUnit'],
  GateType: ['retailPrice', 'purchasePrice'],
  WicketType: ['retailPrice', 'purchasePrice'],
  ProfnastilType: ['retailPricePerUnit', 'purchasePricePerUnit'],
  PicketType: ['retailPricePerMeter', 'purchasePricePerMeter'],
  MountingHardware: ['retailPrice', 'purchasePrice'],
  Work: ['price'],
};

export function logPriceChange(
  entityType: string,
  entityId: string,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
  userId: string
): void {
  const priceFields = PRICE_FIELDS[entityType] || [];
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  const fields = Object.keys(newValue);
  for (const field of fields) {
    if (oldValue[field] !== newValue[field]) {
      changes[field] = {
        old: oldValue[field],
        new: newValue[field],
      };
    }
  }

  const priceChanges = Object.keys(changes).filter((f) => priceFields.includes(f));

  if (priceChanges.length > 0) {
    const oldPrices: Record<string, unknown> = {};
    const newPrices: Record<string, unknown> = {};

    for (const field of priceChanges) {
      oldPrices[field] = changes[field].old;
      newPrices[field] = changes[field].new;
    }

    createAuditLogAsync({
      userId,
      action: 'UPDATE_PRICE',
      entityType,
      entityId,
      oldValues: oldPrices as any,
      newValues: newPrices as any,
    });
  }
}

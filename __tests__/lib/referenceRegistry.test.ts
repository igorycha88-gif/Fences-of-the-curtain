import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/lib/prisma', () => ({}));

import { referenceRegistry } from '@/lib/referenceRegistry';

describe('ReferenceRegistry', () => {
  let registry: typeof referenceRegistry;

  beforeEach(() => {
    const ReferenceRegistry = (referenceRegistry as any).constructor;
    registry = new ReferenceRegistry();
  });

  describe('register and get', () => {
    it('should register and retrieve a config', () => {
      const config = { type: 'TEST', name: 'Тест', modelName: 'Test' };
      registry.register(config);
      expect(registry.get('TEST')).toEqual(config);
    });

    it('should return undefined for unregistered type', () => {
      expect(registry.get('UNKNOWN')).toBeUndefined();
    });

    it('should overwrite existing registration', () => {
      registry.register({ type: 'TEST', name: 'Первый', modelName: 'Test1' });
      registry.register({ type: 'TEST', name: 'Второй', modelName: 'Test2' });
      expect(registry.get('TEST')?.name).toBe('Второй');
    });
  });

  describe('getAll', () => {
    it('should return all registered configs', () => {
      registry.register({ type: 'A', name: 'A', modelName: 'A' });
      registry.register({ type: 'B', name: 'B', modelName: 'B' });
      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all.map(c => c.type)).toContain('A');
      expect(all.map(c => c.type)).toContain('B');
    });

    it('should return empty array when nothing registered', () => {
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('register warns on duplicate', () => {
    it('should warn when overwriting duplicate', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      registry.register({ type: 'DUP', name: 'Первый', modelName: 'DUP1' });
      registry.register({ type: 'DUP', name: 'Второй', modelName: 'DUP2' });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DUP')
      );
      warnSpy.mockRestore();
    });

    it('should not warn for first registration', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      registry.register({ type: 'NEW', name: 'Новый', modelName: 'New' });
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});

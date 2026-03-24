import { getFenceTypeCodeByName, getFenceTypeNameByCode } from '@/lib/fenceTypeMap';

describe('FenceTypeMap', () => {
  describe('getFenceTypeCodeByName', () => {
    it('should map Russian names to codes', () => {
      expect(getFenceTypeCodeByName('Профнастил')).toBe('PROFNASTIL');
      expect(getFenceTypeCodeByName('Евроштакетник')).toBe('PICKET');
      expect(getFenceTypeCodeByName('3D-панели')).toBe('PANEL_3D');
      expect(getFenceTypeCodeByName('Сетка-рабица')).toBe('MESH');
    });

    it('should return same value if not in map', () => {
      expect(getFenceTypeCodeByName('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('getFenceTypeNameByCode', () => {
    it('should map codes to Russian names', () => {
      expect(getFenceTypeNameByCode('PROFNASTIL')).toBe('Профнастил');
      expect(getFenceTypeNameByCode('PICKET')).toBe('Евроштакетник');
      expect(getFenceTypeNameByCode('PANEL_3D')).toBe('3D-панели');
      expect(getFenceTypeNameByCode('MESH')).toBe('Сетка-рабица');
    });

    it('should return same value if not in map', () => {
      expect(getFenceTypeNameByCode('UNKNOWN')).toBe('UNKNOWN');
    });
  });
});

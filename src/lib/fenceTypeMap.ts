export const FENCE_TYPE_CODE_MAP: Record<string, string> = {
  'Профнастил': 'PROFNASTIL',
  'Евроштакетник': 'PICKET',
  '3D-панели': 'PANEL_3D',
  'Сетка-рабица': 'MESH',
};

export function getFenceTypeCodeByName(name: string): string {
  return FENCE_TYPE_CODE_MAP[name] || name;
}

export function getFenceTypeNameByCode(code: string): string {
  const reverseMap: Record<string, string> = Object.entries(FENCE_TYPE_CODE_MAP).reduce(
    (acc, [name, code]) => ({ ...acc, [code]: name }),
    {}
  );
  return reverseMap[code] || code;
}

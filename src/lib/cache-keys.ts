export const CACHE_KEYS = {
  FENCE_TYPES: 'calculator:fence-types',
  POSTS_ACTIVE: 'calculator:posts:active',
  LAGS_ACTIVE: 'calculator:lags:active',
  PROFNASTIL_ACTIVE: 'calculator:profnastil:active',
  PANEL_3D_ACTIVE: 'calculator:panel3d:active',
  MESH_ACTIVE: 'calculator:mesh:active',
  PICKET_ACTIVE: 'calculator:picket:active',
  PICKET_PROFILE_TYPES_ACTIVE: 'calculator:picket:profile-types:active',
  PICKET_COATINGS_ACTIVE: 'calculator:picket:coatings:active',
  GATES_ACTIVE: 'calculator:gates:active',
  WICKETS_ACTIVE: 'calculator:wickets:active',
  AUTOMATION_ACTIVE: 'calculator:automation:active',
  WORKS_BY_FENCE_TYPE: (fenceType: string) => `calculator:works:fence:${fenceType}`,
  WORKS_BY_REFERENCE: (refType: string, refId: string) => `calculator:works:ref:${refType}:${refId}`,
  MOUNTING_HARDWARE: (postTypeId: string, lagTypeId: string, profnastilTypeId: string) =>
    `calculator:hardware:${postTypeId}:${lagTypeId}:${profnastilTypeId}`,
  PROMOTION_ACTIVE: (fenceTypeId: string) => `calculator:promotion:${fenceTypeId}`,
  PROMOTIONS_ALL_ACTIVE: 'calculator:promotions:active',
} as const;

export const CACHE_TTL = {
  REFERENCE_DATA: 300,
  FENCE_TYPES: 300,
  IP_LOCATION: 86400,
  RATE_LIMIT_CONFIG: 60,
} as const;

// lib/permissions.ts

export const ROLES = {
  USER: 'USER',
  PREMIUM: 'PREMIUM',
  MODERATOR: 'MODERATOR',
  MADROLE: 'MADROLE', // <= ajouté
  ADMIN: 'ADMIN',
} as const;

export type Role = keyof typeof ROLES;

export const PERMISSIONS = {
  // Compositions
  VIEW_COMPOSITIONS: 'VIEW_COMPOSITIONS',
  CREATE_COMPOSITIONS: 'CREATE_COMPOSITIONS',
  EDIT_OWN_COMPOSITIONS: 'EDIT_OWN_COMPOSITIONS',
  EDIT_ALL_COMPOSITIONS: 'EDIT_ALL_COMPOSITIONS',
  DELETE_OWN_COMPOSITIONS: 'DELETE_OWN_COMPOSITIONS',
  DELETE_ALL_COMPOSITIONS: 'DELETE_ALL_COMPOSITIONS',

  // IA
  USE_AI_SEARCH: 'USE_AI_SEARCH',
  USE_AI_ANALYZE: 'USE_AI_ANALYZE',

  // Concepts
  VIEW_CONCEPTS: 'VIEW_CONCEPTS',
  CREATE_CONCEPTS: 'CREATE_CONCEPTS',
  EDIT_CONCEPTS: 'EDIT_CONCEPTS',
  DELETE_CONCEPTS: 'DELETE_CONCEPTS',

  // Modération
  MODERATE_COMPOSITIONS: 'MODERATE_COMPOSITIONS',
  VIEW_USER_ANALYTICS: 'VIEW_USER_ANALYTICS',

  // Admin
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_SYSTEM: 'MANAGE_SYSTEM',
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Mapping rôles -> permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  USER: [...(Object.values(PERMISSIONS) as Permission[])],
  PREMIUM: [...(Object.values(PERMISSIONS) as Permission[])],
  MODERATOR: [...(Object.values(PERMISSIONS) as Permission[])],
  MADROLE: [...(Object.values(PERMISSIONS) as Permission[])],
  ADMIN: [
    // toutes
    ...(Object.values(PERMISSIONS) as Permission[]),
  ],
};

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}
export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(userRole, p));
}
export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(userRole, p));
}

export function canModifyResource(
  userRole: Role,
  userId: string,
  resourceOwnerId: string,
  editOwnPermission: Permission,
  editAllPermission: Permission,
): boolean {
  if (userId === resourceOwnerId && hasPermission(userRole, editOwnPermission)) return true;
  return hasPermission(userRole, editAllPermission);
}

// Flags/limites — reprend tes chiffres existants
export const FEATURE_FLAGS: Record<
  Role,
  {
    aiFeatures: boolean;
    advancedComposition: boolean;
    moderationTools: boolean;
    adminTools: boolean;
    maxCompositionsPerDay: number;
    maxConceptsInComposition: number;
    maxConceptsPerDay: number;
    maxAISearchPerDay: number;
    maxAIAnalyzePerDay: number;
    maxAITokensPerDay: number;
    maxAIBudgetPerDay: number;
    // petit flag pour easter-eggs UI
    madUI?: boolean;
  }
> = {
  USER: {
    aiFeatures: false,
    advancedComposition: false,
    moderationTools: false,
    adminTools: false,
    maxCompositionsPerDay: 5,
    maxConceptsInComposition: 3,
    maxConceptsPerDay: 2,
    maxAISearchPerDay: 0,
    maxAIAnalyzePerDay: 0,
    maxAITokensPerDay: 0,
    maxAIBudgetPerDay: 0,
  },
  PREMIUM: {
    aiFeatures: true,
    advancedComposition: true,
    moderationTools: false,
    adminTools: false,
    maxCompositionsPerDay: 50,
    maxConceptsInComposition: 6,
    maxConceptsPerDay: 10,
    maxAISearchPerDay: 20,
    maxAIAnalyzePerDay: 15,
    maxAITokensPerDay: 50000,
    maxAIBudgetPerDay: 2.0,
  },
  MODERATOR: {
    aiFeatures: true,
    advancedComposition: true,
    moderationTools: true,
    adminTools: false,
    maxCompositionsPerDay: 100,
    maxConceptsInComposition: 8,
    maxConceptsPerDay: 20,
    maxAISearchPerDay: 50,
    maxAIAnalyzePerDay: 40,
    maxAITokensPerDay: 100000,
    maxAIBudgetPerDay: 5.0,
  },
  MADROLE: {
    // entre MODERATOR et ADMIN + madUI
    aiFeatures: true,
    advancedComposition: true,
    moderationTools: true,
    adminTools: false,
    maxCompositionsPerDay: -1,
    maxConceptsInComposition: -1,
    maxConceptsPerDay: -1,
    maxAISearchPerDay: -1,
    maxAIAnalyzePerDay: -1,
    maxAITokensPerDay: -1,
    maxAIBudgetPerDay: -1,
    madUI: true,
  },
  ADMIN: {
    aiFeatures: true,
    advancedComposition: true,
    moderationTools: true,
    adminTools: true,
    maxCompositionsPerDay: -1,
    maxConceptsInComposition: -1,
    maxConceptsPerDay: -1,
    maxAISearchPerDay: -1,
    maxAIAnalyzePerDay: -1,
    maxAITokensPerDay: -1,
    maxAIBudgetPerDay: -1,
  },
};

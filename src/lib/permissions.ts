// lib/permissions.ts
export const ROLES = {
  USER: 'USER',        // Utilisateur de base (ex-MEMBER)
  PREMIUM: 'PREMIUM',  // Utilisateur premium avec accès IA
  MODERATOR: 'MODERATOR',
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
  
  // IA Features
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
export const ROLE_PERMISSIONS = {} as Record<Role, Permission[]>;
  ROLE_PERMISSIONS.USER = [
    PERMISSIONS.VIEW_COMPOSITIONS,
    PERMISSIONS.CREATE_COMPOSITIONS,
    PERMISSIONS.EDIT_OWN_COMPOSITIONS,
    PERMISSIONS.DELETE_OWN_COMPOSITIONS,
    PERMISSIONS.VIEW_CONCEPTS,
  ];
  
  ROLE_PERMISSIONS.PREMIUM = [
    // Hérite de USER
    ...ROLE_PERMISSIONS?.USER || [
      PERMISSIONS.VIEW_COMPOSITIONS,
      PERMISSIONS.CREATE_COMPOSITIONS,
      PERMISSIONS.EDIT_OWN_COMPOSITIONS,
      PERMISSIONS.DELETE_OWN_COMPOSITIONS,
      PERMISSIONS.VIEW_CONCEPTS,
    ],
    PERMISSIONS.USE_AI_SEARCH,
    PERMISSIONS.USE_AI_ANALYZE,
  ];
  
 ROLE_PERMISSIONS. MODERATOR = [
    // Hérite de PREMIUM
    ...ROLE_PERMISSIONS?.PREMIUM || [
      PERMISSIONS.VIEW_COMPOSITIONS,
      PERMISSIONS.CREATE_COMPOSITIONS,
      PERMISSIONS.EDIT_OWN_COMPOSITIONS,
      PERMISSIONS.DELETE_OWN_COMPOSITIONS,
      PERMISSIONS.VIEW_CONCEPTS,
      PERMISSIONS.USE_AI_SEARCH,
      PERMISSIONS.USE_AI_ANALYZE,
    ],
    PERMISSIONS.MODERATE_COMPOSITIONS,
    PERMISSIONS.EDIT_ALL_COMPOSITIONS,
    PERMISSIONS.CREATE_CONCEPTS,
    PERMISSIONS.EDIT_CONCEPTS,
  ];
  
 ROLE_PERMISSIONS.ADMIN = [
    // Toutes les permissions
    ...Object.values(PERMISSIONS),
  ];

// Fonction utilitaire pour vérifier les permissions
export function hasPermission(userRole: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Fonction pour vérifier si un utilisateur peut modifier une ressource
export function canModifyResource(
  userRole: Role, 
  userId: string, 
  resourceOwnerId: string,
  editOwnPermission: Permission,
  editAllPermission: Permission
): boolean {
  // Peut modifier si c'est sa ressource ET a la permission d'éditer ses propres ressources
  if (userId === resourceOwnerId && hasPermission(userRole, editOwnPermission)) {
    return true;
  }
  
  // Peut modifier si a la permission d'éditer toutes les ressources
  return hasPermission(userRole, editAllPermission);
}

// Configuration des features par rôle
export const FEATURE_FLAGS: Record<Role, {
  aiFeatures: boolean;
  advancedComposition: boolean;
  moderationTools: boolean;
  adminTools: boolean;
  
  // Limites quotidiennes
  maxCompositionsPerDay: number;
  maxConceptsInComposition: number;
  maxConceptsPerDay: number;
  
  // Limites IA quotidiennes (coûts)
  maxAISearchPerDay: number;
  maxAIAnalyzePerDay: number;
  maxAITokensPerDay: number;
  
  // Budget IA en USD par jour (optionnel, pour monitoring)
  maxAIBudgetPerDay: number;
}> = {
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
    maxAISearchPerDay: 20,      // 20 recherches IA par jour
    maxAIAnalyzePerDay: 15,     // 15 analyses IA par jour
    maxAITokensPerDay: 50000,   // ~50k tokens/jour (environ 5-10$ selon le modèle)
    maxAIBudgetPerDay: 2.0,     // 2$ par jour max
  },
  
  MODERATOR: {
    aiFeatures: true,
    advancedComposition: true,
    moderationTools: true,
    adminTools: false,
    maxCompositionsPerDay: 100,
    maxConceptsInComposition: 8,
    maxConceptsPerDay: 20,
    maxAISearchPerDay: 50,      // Plus de limites pour la modération
    maxAIAnalyzePerDay: 40,
    maxAITokensPerDay: 100000,  // ~100k tokens/jour
    maxAIBudgetPerDay: 5.0,     // 5$ par jour max
  },
  
  ADMIN: {
    aiFeatures: true,
    advancedComposition: true,
    moderationTools: true,
    adminTools: true,
    maxCompositionsPerDay: -1,  // Illimité
    maxConceptsInComposition: -1, // Illimité
    maxConceptsPerDay: -1,      // Illimité
    maxAISearchPerDay: -1,      // Illimité (mais on track quand même)
    maxAIAnalyzePerDay: -1,     // Illimité
    maxAITokensPerDay: -1,      // Illimité
    maxAIBudgetPerDay: -1,      // Illimité
  },
};
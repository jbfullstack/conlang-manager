/**
 * Configuration centrale des catégories de propriétés
 * Système unifié pour la gestion des catégories et leurs couleurs
 */

const capitalize = (s: string): string =>
  s?.[0]?.toUpperCase() + s.slice(1);

// Constantes des catégories pour utilisation dans le code
export const CATEGORY_KEYS = {
  PHYSIQUE: 'physique' as const,
  ABSTRAIT: 'abstrait' as const,
  VISUEL: 'visuel' as const,
  MOUVEMENT: 'mouvement' as const,
  SENSORIEL: 'sensoriel' as const,
  EMOTION: 'emotion' as const,
  GRAMMATICAL: 'grammatical' as const,
  SEMANTIC: 'semantic' as const,
  PHONETIC: 'phonetic' as const,
  MORPHOLOGICAL: 'morphological' as const,
  SYNTACTIC: 'syntactic' as const,
  LEXICAL: 'lexical' as const,
  TEMPORAL: 'temporal' as const,
  SPATIAL: 'spatial' as const,
  SOCIAL: 'social' as const,
  COGNITIF: 'cognitif' as const
} as const;

// Type dérivé automatiquement des valeurs de CATEGORY_KEYS
export type CategoryKey = typeof CATEGORY_KEYS[keyof typeof CATEGORY_KEYS];

export interface CategoryConfig {
  key: CategoryKey;
  label: string;
  description: string;
  colorClasses: string;
  group: 'linguistique' | 'conceptuel' | 'perceptuel';
  order: number;
}

// Configuration complète des catégories
export const CATEGORIES: Record<CategoryKey, CategoryConfig> = {
  // === GROUPE CONCEPTUEL ===
  [CATEGORY_KEYS.PHYSIQUE]: {
    key: CATEGORY_KEYS.PHYSIQUE,
    label: capitalize(CATEGORY_KEYS.PHYSIQUE),
    description: 'Propriétés physiques et matérielles',
    colorClasses: 'bg-blue-100 text-blue-800 border-blue-200',
    group: 'conceptuel',
    order: 1
  },
  [CATEGORY_KEYS.ABSTRAIT]: {
    key: CATEGORY_KEYS.ABSTRAIT,
    label: capitalize(CATEGORY_KEYS.ABSTRAIT),
    description: 'Concepts abstraits et philosophiques',
    colorClasses: 'bg-purple-100 text-purple-800 border-purple-200',
    group: 'conceptuel',
    order: 2
  },
  [CATEGORY_KEYS.MOUVEMENT]: {
    key: CATEGORY_KEYS.MOUVEMENT,
    label: capitalize(CATEGORY_KEYS.MOUVEMENT),
    description: 'Actions et mouvements',
    colorClasses: 'bg-red-100 text-red-800 border-red-200',
    group: 'conceptuel',
    order: 3
  },
  [CATEGORY_KEYS.TEMPORAL]: {
    key: CATEGORY_KEYS.TEMPORAL,
    label: capitalize(CATEGORY_KEYS.TEMPORAL),
    description: 'Propriétés liées au temps',
    colorClasses: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    group: 'conceptuel',
    order: 4
  },
  [CATEGORY_KEYS.SPATIAL]: {
    key: CATEGORY_KEYS.SPATIAL,
    label: capitalize(CATEGORY_KEYS.SPATIAL),
    description: 'Propriétés liées à l\'espace',
    colorClasses: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    group: 'conceptuel',
    order: 5
  },

  // === GROUPE PERCEPTUEL ===
  [CATEGORY_KEYS.VISUEL]: {
    key: CATEGORY_KEYS.VISUEL,
    label: capitalize(CATEGORY_KEYS.VISUEL),
    description: 'Propriétés visuelles et esthétiques',
    colorClasses: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    group: 'perceptuel',
    order: 6
  },
  [CATEGORY_KEYS.SENSORIEL]: {
    key: CATEGORY_KEYS.SENSORIEL,
    label: 'Sensoriel',
    description: 'Perceptions sensorielles',
    colorClasses: 'bg-orange-100 text-orange-800 border-orange-200',
    group: 'perceptuel',
    order: 7
  },
  [CATEGORY_KEYS.EMOTION]: {
    key: CATEGORY_KEYS.EMOTION,
    label: capitalize(CATEGORY_KEYS.EMOTION),
    description: 'États émotionnels et affectifs',
    colorClasses: 'bg-pink-100 text-pink-800 border-pink-200',
    group: 'perceptuel',
    order: 8
  },
  [CATEGORY_KEYS.SOCIAL]: {
    key: CATEGORY_KEYS.SOCIAL,
    label: capitalize(CATEGORY_KEYS.SOCIAL),
    description: 'Relations et interactions sociales',
    colorClasses: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    group: 'perceptuel',
    order: 9
  },
  [CATEGORY_KEYS.COGNITIF]: {
    key: CATEGORY_KEYS.COGNITIF,
    label: capitalize(CATEGORY_KEYS.COGNITIF),
    description: 'Processus mentaux et cognitifs',
    colorClasses: 'bg-violet-100 text-violet-800 border-violet-200',
    group: 'perceptuel',
    order: 10
  },

  // === GROUPE LINGUISTIQUE ===
  [CATEGORY_KEYS.GRAMMATICAL]: {
    key: CATEGORY_KEYS.GRAMMATICAL,
    label: capitalize(CATEGORY_KEYS.GRAMMATICAL),
    description: 'Propriétés grammaticales',
    colorClasses: 'bg-slate-100 text-slate-800 border-slate-200',
    group: 'linguistique',
    order: 11
  },
  [CATEGORY_KEYS.SEMANTIC]: {
    key: CATEGORY_KEYS.SEMANTIC,
    label: capitalize(CATEGORY_KEYS.SEMANTIC),
    description: 'Sens et signification',
    colorClasses: 'bg-green-100 text-green-800 border-green-200',
    group: 'linguistique',
    order: 12
  },
  [CATEGORY_KEYS.PHONETIC]: {
    key: CATEGORY_KEYS.PHONETIC,
    label: capitalize(CATEGORY_KEYS.PHONETIC),
    description: 'Sons et prononciation',
    colorClasses: 'bg-teal-100 text-teal-800 border-teal-200',
    group: 'linguistique',
    order: 13
  },
  [CATEGORY_KEYS.MORPHOLOGICAL]: {
    key: CATEGORY_KEYS.MORPHOLOGICAL,
    label: capitalize(CATEGORY_KEYS.MORPHOLOGICAL),
    description: 'Structure des mots',
    colorClasses: 'bg-amber-100 text-amber-800 border-amber-200',
    group: 'linguistique',
    order: 14
  },
  [CATEGORY_KEYS.SYNTACTIC]: {
    key: CATEGORY_KEYS.SYNTACTIC,
    label:capitalize(CATEGORY_KEYS.SYNTACTIC),
    description: 'Structure des phrases',
    colorClasses: 'bg-rose-100 text-rose-800 border-rose-200',
    group: 'linguistique',
    order: 15
  },
  [CATEGORY_KEYS.LEXICAL]: {
    key: CATEGORY_KEYS.LEXICAL,
    label: capitalize(CATEGORY_KEYS.LEXICAL),
    description: 'Vocabulaire et lexique',
    colorClasses: 'bg-lime-100 text-lime-800 border-lime-200',
    group: 'linguistique',
    order: 16
  }
};

// Couleur par défaut pour les catégories inconnues
export const DEFAULT_CATEGORY_COLOR = 'bg-gray-100 text-gray-800 border-gray-200';

// === FONCTIONS UTILITAIRES ===

/**
 * Récupère la configuration d'une catégorie
 */
export const getCategoryConfig = (categoryKey: string): CategoryConfig | null => {
  const normalizedKey = categoryKey.toLowerCase() as CategoryKey;
  return CATEGORIES[normalizedKey] || null;
};

/**
 * Récupère les classes CSS pour une catégorie
 * Compatible avec votre fonction existante
 */
export const getCategoryColor = (category: string): string => {
  const config = getCategoryConfig(category);
  return config?.colorClasses || DEFAULT_CATEGORY_COLOR;
};

/**
 * Récupère le label affiché d'une catégorie
 */
export const getCategoryLabel = (category: string): string => {
  const config = getCategoryConfig(category);
  return config?.label || category.charAt(0).toUpperCase() + category.slice(1);
};

/**
 * Récupère la description d'une catégorie
 */
export const getCategoryDescription = (category: string): string => {
  const config = getCategoryConfig(category);
  return config?.description || `Catégorie ${category}`;
};

/**
 * Récupère toutes les catégories triées par ordre
 */
export const getAllCategories = (): CategoryConfig[] => {
  return Object.values(CATEGORIES).sort((a, b) => a.order - b.order);
};

/**
 * Récupère les catégories par groupe
 */
export const getCategoriesByGroup = (group: 'linguistique' | 'conceptuel' | 'perceptuel'): CategoryConfig[] => {
  return Object.values(CATEGORIES)
    .filter(cat => cat.group === group)
    .sort((a, b) => a.order - b.order);
};

/**
 * Récupère les clés des catégories pour validation
 */
export const getCategoryKeys = (): CategoryKey[] => {
  return Object.keys(CATEGORIES) as CategoryKey[];
};

/**
 * Valide si une catégorie existe
 */
export const isValidCategory = (category: string): category is CategoryKey => {
  return category.toLowerCase() in CATEGORIES;
};

/**
 * Récupère les suggestions de catégories pour l'autocomplétion
 */
export const getCategorySuggestions = (search: string = ''): CategoryConfig[] => {
  if (!search.trim()) {
    return getAllCategories();
  }
  
  const searchLower = search.toLowerCase();
  return getAllCategories().filter(cat => 
    cat.key.includes(searchLower) ||
    cat.label.toLowerCase().includes(searchLower) ||
    cat.description.toLowerCase().includes(searchLower)
  );
};
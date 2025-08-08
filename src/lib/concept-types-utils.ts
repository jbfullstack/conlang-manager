/**
 * Utilitaires centralisés pour la gestion des types de concepts
 * Permet d'éviter la duplication de code et garantit la cohérence
 */

export interface ConceptTypeConfig {
  icon: string;
  gradient: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  label: string;
}

// Configuration centralisée pour tous les types
const CONCEPT_TYPE_CONFIGS: Record<string, ConceptTypeConfig> = {
  element: {
    icon: '🧊',
    gradient: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    label: 'Élément'
  },
  action: {
    icon: '🏃‍♂️',
    gradient: 'from-green-400 to-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    label: 'Action'
  },
  qualite: {
    icon: '✨',
    gradient: 'from-pink-400 to-pink-600',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-800',
    borderColor: 'border-pink-200',
    label: 'Qualité'
  },
  relation: {
    icon: '🔗',
    gradient: 'from-indigo-400 to-indigo-600',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-200',
    label: 'Relation'
  },
  abstrait: {
    icon: '💭',
    gradient: 'from-yellow-400 to-yellow-600',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    label: 'Abstrait'
  },
  propriete: {
    icon: '🏷️',
    gradient: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200',
    label: 'Propriété'
  }
};

// Configuration par défaut pour types inconnus
const DEFAULT_CONFIG: ConceptTypeConfig = {
  icon: '📄',
  gradient: 'from-gray-400 to-gray-600',
  bgColor: 'bg-gray-50',
  textColor: 'text-gray-800',
  borderColor: 'border-gray-200',
  label: 'Autre'
};

/**
 * Récupère l'icône d'un type de concept
 */
export function getConceptTypeIcon(type: string): string {
  return CONCEPT_TYPE_CONFIGS[type]?.icon || DEFAULT_CONFIG.icon;
}

/**
 * Récupère la configuration complète d'un type
 */
export function getConceptTypeConfig(type: string): ConceptTypeConfig {
  return CONCEPT_TYPE_CONFIGS[type] || DEFAULT_CONFIG;
}

/**
 * Récupère le gradient CSS d'un type
 */
export function getConceptTypeGradient(type: string): string {
  return CONCEPT_TYPE_CONFIGS[type]?.gradient || DEFAULT_CONFIG.gradient;
}

/**
 * Récupère les classes CSS pour un badge de type
 */
export function getConceptTypeBadgeClasses(type: string): string {
  const config = getConceptTypeConfig(type);
  return `${config.bgColor} ${config.textColor} ${config.borderColor}`;
}

/**
 * Récupère les classes CSS pour une carte de concept
 */
export function getConceptTypeCardClasses(type: string): string {
  const config = getConceptTypeConfig(type);
  return `${config.bgColor} ${config.borderColor}`;
}

/**
 * Récupère tous les types disponibles
 */
export function getAllConceptTypes(): Array<{ key: string; config: ConceptTypeConfig }> {
  return Object.entries(CONCEPT_TYPE_CONFIGS).map(([key, config]) => ({
    key,
    config
  }));
}

/**
 * Vérifie si un type existe
 */
export function isValidConceptType(type: string): boolean {
  return type in CONCEPT_TYPE_CONFIGS;
}

/**
 * Récupère le label affiché d'un type
 */
export function getConceptTypeLabel(type: string): string {
  return CONCEPT_TYPE_CONFIGS[type]?.label || DEFAULT_CONFIG.label;
}

/**
 * Récupère une classe CSS complète pour un élément avec dégradé
 */
export function getConceptTypeGradientClass(type: string): string {
  const gradient = getConceptTypeGradient(type);
  return `bg-gradient-to-r ${gradient}`;
}

/**
 * Utilitaire pour créer un badge de type standardisé
 */
export function createConceptTypeBadge(type: string, options: {
  showIcon?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
} = {}) {
  const { showIcon = true, showLabel = true, size = 'md' } = options;
  const config = getConceptTypeConfig(type);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  return {
    icon: showIcon ? config.icon : '',
    label: showLabel ? config.label : '',
    classes: `inline-flex items-center rounded-full font-semibold border-2 ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]}`
  };
}
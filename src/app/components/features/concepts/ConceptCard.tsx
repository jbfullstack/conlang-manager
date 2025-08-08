import { Concept } from '@/interfaces/concept.interface';
import {
  getConceptTypeConfig,
  getConceptTypeGradientClass,
  getConceptTypeBadgeClasses,
} from '@/lib/concept-types-utils';

interface ConceptCardProps {
  concept: Concept;
  onEdit: () => void;
  onDelete: () => void;
  onSelect?: (concept: Concept) => void;
}

export default function ConceptCard({ concept, onEdit, onDelete, onSelect }: ConceptCardProps) {
  const handleClick = () => {
    if (typeof onSelect === 'function') onSelect(concept);
  };

  const typeConfig = getConceptTypeConfig(concept.type);
  const isSelectable = !!onSelect;

  return (
    <div
      className={`
        group relative bg-white/90 backdrop-blur-sm rounded-xl border-2 border-white/20 shadow-lg
        transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:border-blue-300
        ${
          isSelectable
            ? 'cursor-pointer hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50'
            : ''
        }
        h-80 flex flex-col
      `}
      onClick={onSelect ? handleClick : undefined}
    >
      {/* Badge de type flottant */}
      <div
        className={`absolute -top-2 -right-2 w-10 h-10 ${getConceptTypeGradientClass(
          concept.type,
        )} rounded-full flex items-center justify-center shadow-md z-10`}
      >
        <span className="text-lg">{typeConfig.icon}</span>
      </div>

      {/* Actions flottantes */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-1 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-7 h-7 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center justify-center text-xs shadow-md"
          title="Modifier"
        >
          ✎
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-7 h-7 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center text-xs shadow-md"
          title="Supprimer"
        >
          ×
        </button>
      </div>

      {/* Header avec mot */}
      <div className="p-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 truncate flex-1 mr-2">{concept.mot}</h3>
        </div>

        {/* Badge de type */}
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full border-2 text-xs font-semibold ${getConceptTypeBadgeClasses(
            concept.type,
          )}`}
        >
          <span className="mr-1">{typeConfig.icon}</span>
          <span className="capitalize">{typeConfig.label}</span>
        </div>
      </div>

      {/* Body - Définition */}
      <div className="px-4 flex-1 flex flex-col">
        <div className="mb-3 flex-1">
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{concept.definition}</p>
        </div>

        {/* Propriétés */}
        {concept.proprietes?.length > 0 && (
          <div className="mb-3 flex-shrink-0">
            <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center">
              <span className="mr-1">🏷️</span>
              Propriétés ({concept.proprietes.length})
            </h4>
            <div className="flex flex-wrap gap-1">
              {concept.proprietes.slice(0, 4).map((prop: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-1 text-xs bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full border border-gray-300"
                >
                  {prop}
                </span>
              ))}
              {concept.proprietes.length > 4 && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full border border-blue-300">
                  +{concept.proprietes.length - 4}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Stats */}
      <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 rounded-b-xl flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Fréquence d'usage */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Usage:</span>
              <div className="flex items-center space-x-1">
                <span
                  className={`text-xs font-bold ${
                    (concept.usageFrequency || 0) >= 0.7
                      ? 'text-green-600'
                      : (concept.usageFrequency || 0) >= 0.4
                      ? 'text-yellow-600'
                      : 'text-gray-500'
                  }`}
                >
                  {concept.usageFrequency ? Math.round(concept.usageFrequency * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Indicateur de sélection */}
          {isSelectable && (
            <div className="flex items-center text-xs text-blue-600">
              <span className="mr-1">👆</span>
              <span>Cliquer pour sélectionner</span>
            </div>
          )}

          {/* Statut actif/inactif */}
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full ${
                concept.isActive ? 'bg-green-400' : 'bg-gray-300'
              }`}
            ></div>
            <span className="text-xs text-gray-500 ml-1">
              {concept.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>

        {/* Barre de progression pour l'usage */}
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all duration-500 ${
                (concept.usageFrequency || 0) >= 0.7
                  ? 'bg-gradient-to-r from-green-400 to-green-500'
                  : (concept.usageFrequency || 0) >= 0.4
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                  : 'bg-gradient-to-r from-gray-300 to-gray-400'
              }`}
              style={{ width: `${(concept.usageFrequency || 0) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Effet de sélection */}
      {isSelectable && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/10 group-hover:to-purple-400/10 rounded-xl transition-all duration-300 pointer-events-none"></div>
      )}
    </div>
  );
}

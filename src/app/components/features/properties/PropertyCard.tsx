// interface Property {
//   id: string;
//   name: string;
//   description: string;
//   category: string;
//   usageCount: number;
//   isActive: boolean;
//   conceptProperties?: {
//     concept: {
//       id: string;
//       mot: string;
//       type: string;
//     };
//   }[];
//   createdAt: string;
// }

import { Property } from '@/app/interfaces/property.interface';
import { getCategoryColor } from '@/app/lib/categories';

interface PropertyCardProps {
  property: Property;
  onEdit: () => void;
  onDelete: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function PropertyCard({ property, onEdit, onDelete }: PropertyCardProps) {
  const associatedConcepts = property.conceptProperties || [];
  const conceptsText =
    associatedConcepts.length > 0
      ? associatedConcepts.map((cp) => cp.concept.mot).join(', ')
      : 'Aucun concept associé';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header avec nom et statut */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
            {!property.isActive && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                Inactive
              </span>
            )}
          </div>
          <span
            className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(
              property.category,
            )}`}
          >
            {property.category}
          </span>
        </div>

        {/* Menu Actions */}
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="text-gray-600 hover:text-blue-600 transition-colors"
            title="Modifier"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="text-gray-600 hover:text-red-600 transition-colors"
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-gray-700 text-sm leading-relaxed">
          {property.description || 'Aucune description fournie.'}
        </p>
      </div>

      {/* Statistiques d'usage */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Utilisations:</span>
          <span className="font-semibold text-gray-900">
            {property.usageCount} concept{property.usageCount !== 1 ? 's' : ''}
          </span>
        </div>

        {property.usageCount > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Concepts associés:</p>
            <p className="text-xs text-gray-700 truncate" title={conceptsText}>
              {conceptsText}
            </p>
          </div>
        )}
      </div>

      {/* Footer avec métadonnées */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
        <span>Créé le {formatDate(property.createdAt)}</span>
        <div className="flex items-center space-x-2">
          {property.usageCount > 0 ? (
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>En usage</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              <span>Non utilisé</span>
            </span>
          )}
        </div>
      </div>

      {/* Barre de progression pour l'usage (optionnel, basé sur usage relatif) */}
      {property.usageCount > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-blue-600 h-1 rounded-full"
              style={{
                width: `${Math.min(100, (property.usageCount / 10) * 100)}%`,
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

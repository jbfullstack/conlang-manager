import { Concept } from '@/interfaces/concept.interface';

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

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      element: 'bg-blue-100 text-blue-800',
      action: 'bg-green-100 text-green-800',
      propriete: 'bg-purple-100 text-purple-800',
      concept: 'bg-orange-100 text-orange-800',
      emotion: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
      onClick={onSelect ? handleClick : undefined}
      style={onSelect ? { cursor: 'pointer' } : undefined}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{concept.mot}</h3>
            <span
              className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(
                concept.type,
              )}`}
            >
              {concept.type}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
              title="Modifier"
            >
              ✎
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
              title="Supprimer"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <p className="text-gray-700 text-sm leading-relaxed">{concept.definition}</p>

      {/* Body - propriétés */}
      {concept.proprietes?.length > 0 && (
        <div className="p-6 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Propriétés</h4>
          <div className="flex flex-wrap gap-2">
            {concept.proprietes.map((p: string, idx: number) => (
              <span
                key={idx}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="font-medium">
              {concept.usageFrequency ? Math.round(concept.usageFrequency * 100) : 0}%
            </span>
            <span>Par utilisateur?</span>
          </div>
        </div>
      </div>
    </div>
  );
}

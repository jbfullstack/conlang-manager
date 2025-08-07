import { Concept } from '@/interfaces/concept.interface';

interface ConceptCardProps {
  concept: Concept;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ConceptCard({ concept, onEdit, onDelete }: ConceptCardProps) {
  const getTypeColor = (type: string) => {
    const colors = {
      element: 'bg-blue-100 text-blue-800',
      action: 'bg-green-100 text-green-800',
      propriete: 'bg-purple-100 text-purple-800',
      concept: 'bg-orange-100 text-orange-800',
      emotion: 'bg-pink-100 text-pink-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFrequencyColor = (frequency: number) => {
    if (frequency >= 0.8) return 'text-green-600';
    if (frequency >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
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
              ✏️
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
              title="Supprimer"
            >
              🗑️
            </button>
          </div>
        </div>

        <p className="text-gray-700 text-sm leading-relaxed">{concept.definition}</p>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Properties */}
        {concept.proprietes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Propriétés</h4>
            <div className="flex flex-wrap gap-2">
              {concept.proprietes.map((prop, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
                >
                  {prop}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Etymology */}
        {concept.etymologie && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Étymologie</h4>
            <p className="text-sm text-gray-600 italic">{concept.etymologie}</p>
          </div>
        )}

        {/* Examples */}
        {concept.exemples.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Exemples</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {concept.exemples.slice(0, 2).map((exemple, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">→</span>
                  <span>{exemple}</span>
                </li>
              ))}
              {concept.exemples.length > 2 && (
                <li className="text-gray-400 text-xs">
                  +{concept.exemples.length - 2} autre{concept.exemples.length > 3 ? 's' : ''}...
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span className={`font-medium ${getFrequencyColor(concept.usageFrequency)}`}>
              Usage: {(concept.usageFrequency * 100).toFixed(0)}%
            </span>
            {concept.user && <span>Par {concept.user.username}</span>}
          </div>
          <span>{formatDate(concept.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

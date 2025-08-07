import { Concept } from '@/interfaces/concept.interface';
import { Property } from '@/interfaces/property.interface';
import { useState, useEffect, useRef } from 'react';

interface ConceptFormProps {
  concept: Concept | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function ConceptForm({ concept, onSubmit, onCancel }: ConceptFormProps) {
  const [formData, setFormData] = useState({
    id: '',
    mot: '',
    definition: '',
    type: 'element',
    proprietes: [] as string[],
    etymologie: '',
    exemples: [] as string[],
    usageFrequency: 0.5,
  });

  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [propertyInput, setPropertyInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const [newExemple, setNewExemple] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const propertyInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchExistingProperties();
  }, []);

  const fetchExistingProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setAvailableProperties(data.properties || []);
    } catch (error) {
      console.error('ConceptForm.fetchExistingProperties -', error);
      // Fallback properties si l'API échoue
      setAvailableProperties([
        {
          id: '1',
          name: 'liquide',
          category: 'physique',
          usageCount: 5,
          isActive: true,
          createdAt: '',
        },
        {
          id: '2',
          name: 'solide',
          category: 'physique',
          usageCount: 3,
          isActive: true,
          createdAt: '',
        },
        {
          id: '3',
          name: 'rapide',
          category: 'mouvement',
          usageCount: 4,
          isActive: true,
          createdAt: '',
        },
      ] as Property[]);
    }
  };

  // Filtrer les suggestions basées sur l'input
  const filteredSuggestions = availableProperties.filter(
    (prop) =>
      prop.name.toLowerCase().includes(propertyInput.toLowerCase()) &&
      !formData.proprietes.includes(prop.name),
  );

  // Charger les données du concept à éditer
  useEffect(() => {
    if (concept) {
      setFormData({
        id: concept.id,
        mot: concept.mot,
        definition: concept.definition,
        type: concept.type,
        proprietes: [...concept.proprietes],
        etymologie: concept.etymologie || '',
        exemples: [...concept.exemples],
        usageFrequency: concept.usageFrequency,
      });
    }
  }, [concept]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.id.trim()) {
      newErrors.id = "L'ID est requis";
    } else if (!/^[a-z]+$/.test(formData.id)) {
      newErrors.id = "L'ID doit contenir uniquement des lettres minuscules";
    }

    if (!formData.mot.trim()) {
      newErrors.mot = 'Le mot est requis';
    }

    if (!formData.definition.trim()) {
      newErrors.definition = 'La définition est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(formData);
  };

  // Gestion des propriétés avec autocomplétion
  const handlePropertyInputChange = (value: string) => {
    setPropertyInput(value);
    setShowSuggestions(value.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  const handlePropertyInputKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          addPropertyFromSuggestion(filteredSuggestions[selectedSuggestionIndex]);
        } else if (propertyInput.trim()) {
          addNewProperty(propertyInput.trim());
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const addPropertyFromSuggestion = (property: Property) => {
    if (!formData.proprietes.includes(property.name)) {
      setFormData({
        ...formData,
        proprietes: [...formData.proprietes, property.name],
      });
    }
    setPropertyInput('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const addNewProperty = async (propertyName: string) => {
    if (!formData.proprietes.includes(propertyName)) {
      // Ajouter à la liste locale
      setFormData({
        ...formData,
        proprietes: [...formData.proprietes, propertyName],
      });

      // Créer la propriété dans la base si elle n'existe pas
      try {
        await fetch('/api/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: propertyName,
            category: 'custom',
            description: `Propriété créée automatiquement: ${propertyName}`,
          }),
        });
        // Recharger les propriétés disponibles
        fetchExistingProperties();
      } catch (error) {
        console.warn('Erreur création propriété:', error);
      }
    }
    setPropertyInput('');
    setShowSuggestions(false);
  };

  const removeProperty = (index: number) => {
    setFormData({
      ...formData,
      proprietes: formData.proprietes.filter((_, i) => i !== index),
    });
  };

  const addExemple = () => {
    if (newExemple.trim()) {
      setFormData({
        ...formData,
        exemples: [...formData.exemples, newExemple.trim()],
      });
      setNewExemple('');
    }
  };

  const removeExemple = (index: number) => {
    setFormData({
      ...formData,
      exemples: formData.exemples.filter((_, i) => i !== index),
    });
  };

  const commonTypes = ['element', 'action', 'propriete', 'concept', 'emotion', 'relation'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {concept ? 'Modifier le Concept' : 'Nouveau Concept'}
          </h2>
          <p className="text-gray-600 mt-1">
            {concept
              ? 'Modifiez les informations de ce concept'
              : 'Créez un nouveau concept primitif'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ID & Mot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">
                ID du concept *
              </label>
              <input
                type="text"
                id="id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase() })}
                disabled={!!concept}
                className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.id ? 'border-red-300' : 'border-gray-300'
                } ${concept ? 'bg-gray-100' : ''}`}
                placeholder="ex: go, tomu, sol"
              />
              {errors.id && <p className="text-red-600 text-xs mt-1">{errors.id}</p>}
            </div>

            <div>
              <label htmlFor="mot" className="block text-sm font-medium text-gray-700 mb-1">
                Mot *
              </label>
              <input
                type="text"
                id="mot"
                value={formData.mot}
                onChange={(e) => setFormData({ ...formData, mot: e.target.value })}
                className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.mot ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Mot dans votre langue"
              />
              {errors.mot && <p className="text-red-600 text-xs mt-1">{errors.mot}</p>}
            </div>
          </div>

          {/* Définition */}
          <div>
            <label htmlFor="definition" className="block text-sm font-medium text-gray-700 mb-1">
              Définition *
            </label>
            <textarea
              id="definition"
              rows={3}
              value={formData.definition}
              onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
              className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.definition ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Définition claire et précise du concept"
            />
            {errors.definition && <p className="text-red-600 text-xs mt-1">{errors.definition}</p>}
          </div>

          {/* Type & Usage Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {commonTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                Fréquence d'usage ({(formData.usageFrequency * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                id="frequency"
                min="0"
                max="1"
                step="0.1"
                value={formData.usageFrequency}
                onChange={(e) =>
                  setFormData({ ...formData, usageFrequency: parseFloat(e.target.value) })
                }
                className="block w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Rare</span>
                <span>Commun</span>
                <span>Très fréquent</span>
              </div>
            </div>
          </div>

          {/* Étymologie */}
          <div>
            <label htmlFor="etymologie" className="block text-sm font-medium text-gray-700 mb-1">
              Étymologie (optionnel)
            </label>
            <input
              type="text"
              id="etymologie"
              value={formData.etymologie}
              onChange={(e) => setFormData({ ...formData, etymologie: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Origine ou inspiration du mot"
            />
          </div>

          {/* Propriétés avec Autocomplétion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Propriétés
              <span className="text-xs text-gray-500 ml-2">
                (Tapez pour voir les suggestions existantes)
              </span>
            </label>

            <div className="relative">
              <div className="flex space-x-2 mb-2">
                <div className="flex-1 relative">
                  <input
                    ref={propertyInputRef}
                    type="text"
                    value={propertyInput}
                    onChange={(e) => handlePropertyInputChange(e.target.value)}
                    onKeyDown={handlePropertyInputKeyDown}
                    onFocus={() => propertyInput && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="liquide, rapide, lumineux..."
                  />

                  {/* Suggestions dropdown */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                    >
                      {filteredSuggestions.map((property, index) => (
                        <div
                          key={property.id}
                          onClick={() => addPropertyFromSuggestion(property)}
                          className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                            index === selectedSuggestionIndex ? 'bg-blue-100' : ''
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{property.name}</span>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              {property.category && (
                                <span className="bg-gray-200 px-2 py-1 rounded">
                                  {property.category}
                                </span>
                              )}
                              <span>({property.usageCount} usages)</span>
                            </div>
                          </div>
                          {property.description && (
                            <p className="text-xs text-gray-600 mt-1">{property.description}</p>
                          )}
                        </div>
                      ))}

                      {/* Option to create new property */}
                      {propertyInput &&
                        !availableProperties.some(
                          (p) => p.name.toLowerCase() === propertyInput.toLowerCase(),
                        ) && (
                          <div
                            onClick={() => addNewProperty(propertyInput)}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 border-t border-gray-200 ${
                              selectedSuggestionIndex === filteredSuggestions.length
                                ? 'bg-blue-100'
                                : ''
                            }`}
                          >
                            <div className="flex items-center text-green-600">
                              <span className="text-sm font-medium">+ Créer "{propertyInput}"</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Nouvelle propriété personnalisée
                            </p>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => propertyInput.trim() && addNewProperty(propertyInput.trim())}
                  disabled={!propertyInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Ajouter
                </button>
              </div>
            </div>

            {/* Selected Properties */}
            <div className="flex flex-wrap gap-2">
              {formData.proprietes.map((prop, index) => {
                const existingProp = availableProperties.find((p) => p.name === prop);
                return (
                  <span
                    key={index}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      existingProp ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}
                    title={
                      existingProp
                        ? `Utilisée ${existingProp.usageCount} fois`
                        : 'Nouvelle propriété'
                    }
                  >
                    {prop}
                    {!existingProp && <span className="ml-1 text-xs">✨</span>}
                    <button
                      type="button"
                      onClick={() => removeProperty(index)}
                      className={`ml-2 hover:text-red-600 ${
                        existingProp ? 'text-blue-600' : 'text-green-600'
                      }`}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Property stats */}
            {formData.proprietes.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                {formData.proprietes.length} propriété{formData.proprietes.length > 1 ? 's' : ''} •
                {
                  formData.proprietes.filter((p) => availableProperties.some((ap) => ap.name === p))
                    .length
                }{' '}
                existante
                {formData.proprietes.filter((p) => availableProperties.some((ap) => ap.name === p))
                  .length > 1
                  ? 's'
                  : ''}{' '}
                •
                {
                  formData.proprietes.filter(
                    (p) => !availableProperties.some((ap) => ap.name === p),
                  ).length
                }{' '}
                nouvelle
                {formData.proprietes.filter((p) => !availableProperties.some((ap) => ap.name === p))
                  .length > 1
                  ? 's'
                  : ''}
              </div>
            )}
          </div>

          {/* Exemples */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exemples d'usage</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newExemple}
                onChange={(e) => setNewExemple(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExemple())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex: go + tomu = cascade"
              />
              <button
                type="button"
                onClick={addExemple}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Ajouter
              </button>
            </div>
            <div className="space-y-1">
              {formData.exemples.map((exemple, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                >
                  <span className="text-sm">{exemple}</span>
                  <button
                    type="button"
                    onClick={() => removeExemple(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {concept ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

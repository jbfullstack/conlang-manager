import { Property } from '@/interfaces/property.interface';
import { fetchPostProperties, fetchProperties } from '@/utils/api-client';
import { useState, useEffect } from 'react';

// interface Property {
//   id: string;
//   name: string;
//   description: string;
//   category: string;
//   usageCount: number;
//   isActive: boolean;
//   createdAt: string;
// }

interface PropertyFormProps {
  property: Property | null;
  onSubmit: (propertyData: any) => void;
  onCancel: () => void;
}

const SUGGESTED_CATEGORIES = [
  'grammatical',
  'semantic',
  'phonetic',
  'morphological',
  'syntactic',
  'lexical',
  'pragmatic',
  'temporal',
  'spatial',
  'qualitative',
];

export default function PropertyForm({ property, onSubmit, onCancel }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  // Charger les catégories existantes et initialiser le formulaire
  useEffect(() => {
    fetchExistingCategories();

    if (property) {
      setFormData({
        name: property.name,
        description: property.description,
        category: property.category,
        isActive: property.isActive,
      });
    }
  }, [property]);

  const fetchExistingCategories = async () => {
    try {
      const response = await fetchProperties();
      if (response.ok) {
        const data = await response.json();
        const categories: string[] = Array.from(
          new Set(
            data.properties
              .map((p: { category: string }) => p.category) // (string | undefined)[]
              .filter((c: string): c is string => Boolean(c)), // narrows to string[]
          ),
        );
        setExistingCategories(categories);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Le nom ne peut pas dépasser 50 caractères';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est obligatoire';
    } else if (formData.description.length < 10) {
      newErrors.description = 'La description doit contenir au moins 10 caractères';
    } else if (formData.description.length > 500) {
      newErrors.description = 'La description ne peut pas dépasser 500 caractères';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'La catégorie est obligatoire';
    } else if (formData.category.length < 2) {
      newErrors.category = 'La catégorie doit contenir au moins 2 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleCategorySelect = (category: string) => {
    setFormData((prev) => ({ ...prev, category }));
    setShowCategorySuggestions(false);
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: '' }));
    }
  };

  // Filtrer les suggestions de catégories
  const filteredSuggestions = [...new Set([...SUGGESTED_CATEGORIES, ...existingCategories])].filter(
    (cat) =>
      cat.toLowerCase().includes(formData.category.toLowerCase()) &&
      cat.toLowerCase() !== formData.category.toLowerCase(),
  );

  const isEditMode = property !== null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Modifier la propriété' : 'Nouvelle propriété'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la propriété *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="ex: animé, locatif, temporel..."
              disabled={isSubmitting}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            <p className="mt-1 text-sm text-gray-500">{formData.name.length}/50 caractères</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Décrivez cette propriété linguistique..."
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {formData.description.length}/500 caractères
            </p>
          </div>

          {/* Catégorie avec autocomplétion */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie *
            </label>
            <div className="relative">
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                onFocus={() => setShowCategorySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="ex: grammatical, semantic, phonetic..."
                disabled={isSubmitting}
              />

              {/* Suggestions dropdown */}
              {showCategorySuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleCategorySelect(suggestion)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      {suggestion}
                      {existingCategories.includes(suggestion) && (
                        <span className="ml-2 text-xs text-blue-600">(existante)</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            <p className="mt-1 text-sm text-gray-500">
              Tapez pour voir les suggestions ou créez une nouvelle catégorie
            </p>
          </div>

          {/* Statut actif */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Propriété active
            </label>
          </div>
          <p className="text-sm text-gray-500">
            Les propriétés inactives ne seront pas proposées lors de la création de nouveaux
            concepts
          </p>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isEditMode ? 'Modifier' : 'Créer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

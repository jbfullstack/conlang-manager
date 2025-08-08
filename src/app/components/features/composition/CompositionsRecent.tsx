'use client';
import React from 'react';
import { Concept } from '@/interfaces/concept.interface';

type Comp = {
  id: string;
  sens?: string;
  pattern?: any; // peut être string[], string (JSON), ou autre
  description?: string;
};

type Props = {
  comps: Comp[];
  concepts: Concept[];
  onUsePattern?: (ids: string[]) => void;
};

export default function CompositionsRecent({ comps, concepts, onUsePattern }: Props) {
  // Map concepts by id for quick lookup
  const mapById = React.useMemo(() => {
    const m = new Map<string, Concept>();
    concepts.forEach((c) => m.set(c.id, c));
    return m;
  }, [concepts]);

  const handleUse = (ids?: string[]) => {
    if (!ids?.length || !onUsePattern) return;
    onUsePattern(ids);
  };

  return (
    <div className="border rounded p-4 bg-white">
      <h3 className="font-medium mb-2">Compositions communautaires récentes</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {comps.length === 0 && (
          <div className="col-span-1 text-sm text-gray-500">
            Aucune composition récemment publiée
          </div>
        )}
        {comps.map((cb) => {
          // Normaliser pattern en tableau de chaînes
          let patternArray: string[] = [];

          if (Array.isArray(cb.pattern)) {
            patternArray = cb.pattern;
          } else if (typeof cb.pattern === 'string' && cb.pattern.trim()) {
            try {
              const parsed = JSON.parse(cb.pattern);
              patternArray = Array.isArray(parsed) ? parsed : [];
            } catch {
              // Si ce n'est pas du JSON, traiter comme une seule entrée
              patternArray = [cb.pattern];
            }
          }

          const label = cb.sens ?? (patternArray.length ? patternArray.join(' + ') : '');
          return (
            <div
              key={cb.id}
              className="border rounded p-3 bg-gray-50 flex flex-col justify-between h-full"
            >
              <div>
                <div className="font-medium text-sm">{label}</div>
                {patternArray.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    Pattern: {patternArray.join(' + ')}
                  </div>
                )}
              </div>
              <button
                className="mt-2 text-blue-600 text-xs"
                onClick={() => handleUse(patternArray)}
              >
                Utiliser
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

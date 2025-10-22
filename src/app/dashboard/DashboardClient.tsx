'use client';

import React from 'react';
import { useSpace } from '@/app/components/providers/SpaceProvider';

export default function DashboardClient() {
  const { role, current } = useSpace();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Vue d&apos;ensemble de votre langue construite</p>
        </div> */}

        {role === 'MADROLE' && (
          <p className="mt-2 text-xs text-gray-500">
            Bienvenue sur <span className="font-medium">{current?.name}</span> — mode MAD activé.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Concepts Totaux</h3>
            <p className="text-3xl font-bold text-blue-600">5</p>
            <p className="text-sm text-gray-500">Concepts primitifs actifs</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Combinaisons</h3>
            <p className="text-3xl font-bold text-green-600">3</p>
            <p className="text-sm text-gray-500">Combinaisons créées</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Utilisateurs</h3>
            <p className="text-3xl font-bold text-purple-600">4</p>
            <p className="text-sm text-gray-500">Contributeurs actifs</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">En Attente</h3>
            <p className="text-3xl font-bold text-yellow-600">1</p>
            <p className="text-sm text-gray-500">Propositions à valider</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Concepts Récents</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <span className="font-medium">go</span>
                  <p className="text-sm text-gray-600">eau, élément liquide</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">element</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <span className="font-medium">tomu</span>
                  <p className="text-sm text-gray-600">mouvement rapide, vitesse</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  action
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Activité Récente</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Combinaison &quot;go + tomu&quot; approuvée</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm">Nouveau concept &quot;sol&quot; ajouté</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm">Proposition &quot;nox + kala&quot; en attente</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

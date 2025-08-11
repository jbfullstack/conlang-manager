// components/dev/DevHeaderSwitcher.tsx - Version corrigée
'use client';
import React, { useState, useEffect } from 'react';
import { DEV_USERS, DevUserKey, DevUser, getDevUser, setDevUser } from '@/lib/dev-auth';
import { FEATURE_FLAGS } from '@/lib/permissions';

export function DevHeaderSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<DevUser>(DEV_USERS.premium);
  const [isClient, setIsClient] = useState(false);

  // Initialiser côté client uniquement pour éviter les erreurs d'hydratation
  useEffect(() => {
    setCurrentUser(getDevUser());
    setIsClient(true);
  }, []);

  // N'afficher qu'en développement et après hydratation
  if (process.env.NODE_ENV !== 'development' || !isClient) {
    return null;
  }

  const handleUserSwitch = (userKey: DevUserKey) => {
    setDevUser(userKey);
    setCurrentUser(DEV_USERS[userKey]);
    setIsOpen(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500 text-white';
      case 'MODERATOR':
        return 'bg-green-500 text-white';
      case 'PREMIUM':
        return 'bg-purple-500 text-white';
      case 'USER':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '👑';
      case 'MODERATOR':
        return '👮';
      case 'PREMIUM':
        return '💎';
      case 'USER':
        return '👤';
      default:
        return '👤';
    }
  };

  const getPermissionSummary = (role: string) => {
    const limits = FEATURE_FLAGS[role as keyof typeof FEATURE_FLAGS];
    if (!limits) return '';

    if (role === 'ADMIN') return 'Accès illimité';
    if (role === 'USER') return "Pas d'IA, 5 compos/jour";
    if (role === 'PREMIUM') return `IA activée, ${limits.maxCompositionsPerDay} compos/jour`;
    if (role === 'MODERATOR') return 'Modération + IA étendue';
    return '';
  };

  return (
    <div className="relative">
      {/* Bouton utilisateur actuel - style intégré au header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-200"
      >
        <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono">
          DEV
        </span>

        <span className="text-lg">{getRoleIcon(currentUser.role)}</span>

        <div className="text-left">
          <div className="font-medium">{currentUser.username}</div>
          <div
            className={`text-xs px-1.5 py-0.5 rounded-full ${getRoleBadgeColor(currentUser.role)}`}
          >
            {currentUser.role}
          </div>
        </div>

        <span className="text-gray-400 text-xs">▼</span>
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <>
          {/* Overlay pour fermer */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">🧪 Mode Développement</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Switcher d'utilisateur
                </span>
              </div>

              <div className="space-y-1 max-h-64 overflow-y-auto">
                {Object.entries(DEV_USERS).map(([key, user]) => (
                  <button
                    key={key}
                    onClick={() => handleUserSwitch(key as DevUserKey)}
                    className={`w-full text-left px-3 py-3 rounded-md text-sm hover:bg-gray-50 transition-colors border ${
                      currentUser.id === user.id
                        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300'
                        : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getRoleIcon(user.role)}</span>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center space-x-2">
                            <span>{user.username}</span>
                            {currentUser.id === user.id && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                                Actuel
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {getPermissionSummary(user.role)}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          user.role,
                        )}`}
                      >
                        {user.role}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 px-3 py-2 bg-gray-50 rounded-b-lg">
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center space-x-1">
                  <span>💡</span>
                  <span>Les changements sont appliqués immédiatement</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🔒</span>
                  <span>Les permissions sont testées sans vraie auth</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Version alternative avec suppression du rechargement de page
export function DevHeaderSwitcherNoReload() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(DEV_USERS.premium);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setCurrentUser(getDevUser());
    setIsClient(true);
  }, []);

  // N'afficher qu'en développement et après hydratation
  if (process.env.NODE_ENV !== 'development' || !isClient) {
    return null;
  }

  const handleUserSwitch = (userKey: DevUserKey) => {
    // Changer l'utilisateur sans recharger la page
    if (typeof window !== 'undefined') {
      localStorage.setItem('dev-user', userKey);
    }
    setCurrentUser(DEV_USERS[userKey]);
    setIsOpen(false);
  };

  // ... reste du code identique
  return <div className="relative">{/* Interface identique mais sans rechargement de page */}</div>;
}

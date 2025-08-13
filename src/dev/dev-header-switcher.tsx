// components/dev/DevHeaderSwitcher.tsx - Version unifiée avec usePermissions.ts
'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/usePermissions';

// CORRECTION : Utiliser les mêmes données que usePermissions.ts
const DEV_USERS = {
  admin: {
    name: 'admin', // ← NAME (pas username)
    role: 'ADMIN',
    icon: '👑',
    email: 'admin@conlang.local',
    id: 'cme6wmg4t0000k5m4wwwowp5c', // ← ID réel de la DB
  },
  user: {
    name: 'alice', // ← NAME (pas username)
    role: 'USER',
    icon: '👤',
    email: 'alice@conlang.local',
    id: 'cme6wmg500001k5m4be23k1gk', // ← ID réel de la DB
  },
  premium: {
    name: 'bob', // ← NAME (pas username)
    role: 'PREMIUM',
    icon: '💎',
    email: 'bob@conlang.local',
    id: 'cme6wmg500002k5m41d0swmwh', // ← ID réel de la DB
  },
  moderator: {
    name: 'charlie', // ← NAME (pas username)
    role: 'MODERATOR',
    icon: '👮',
    email: 'charlie@conlang.local',
    id: 'cme6wmg520003k5m4mzldl9ju', // ← ID réel de la DB
  },
};

type DevUserKey = keyof typeof DEV_USERS;

export function DevHeaderSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUserKey, setCurrentUserKey] = useState<DevUserKey>('premium');
  const [mounted, setMounted] = useState(false);
  const { user, role, isDev } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isDev) {
    return null;
  }

  if (!mounted) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 border border-gray-200">
        <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono">
          DEV
        </span>
        <span className="text-lg">💎</span>
        <div className="text-left">
          <div className="font-medium">Loading...</div>
          <div className="text-xs px-1.5 py-0.5 rounded-full bg-gray-500 text-white">USER</div>
        </div>
      </div>
    );
  }

  const handleUserSwitch = (userKey: string) => {
    if (typeof window !== 'undefined') {
      console.log('🔄 Switching to user:', userKey, DEV_USERS[userKey as DevUserKey]);
      localStorage.setItem('dev-user', userKey);
      setCurrentUserKey(userKey as DevUserKey);
      window.location.reload();
    }
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

  const getPermissionSummary = (role: string) => {
    if (role === 'ADMIN') return 'Accès illimité';
    if (role === 'USER') return "Pas d'IA, 5 compos/jour";
    if (role === 'PREMIUM') return 'IA activée, 50 compos/jour';
    if (role === 'MODERATOR') return 'Modération + IA étendue';
    return '';
  };

  const getUserIcon = (userName?: string): string => {
    if (!userName) return '💎';
    const userEntry = Object.values(DEV_USERS).find((devUser) => devUser.name === userName);
    return userEntry?.icon || '💎';
  };

  // DEBUG : Voir ce que reçoit le composant
  console.log('🧪 DevHeaderSwitcher received user:', {
    name: user?.name,
    id: user?.id,
    role: role,
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-200"
      >
        <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono">
          DEV
        </span>

        <span className="text-lg">{getUserIcon(user?.name)}</span>

        <div className="text-left">
          <div className="font-medium">{user?.name || 'unknown'}</div>
          <div
            className={`text-xs px-1.5 py-0.5 rounded-full ${getRoleBadgeColor(role || 'USER')}`}
          >
            {role || 'USER'}
          </div>
        </div>

        <span className="text-gray-400 text-xs">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">🧪 Mode Développement</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Switcher d'utilisateur
                </span>
              </div>

              <div className="space-y-1">
                {Object.entries(DEV_USERS).map(([key, userData]) => (
                  <button
                    key={key}
                    onClick={() => handleUserSwitch(key)}
                    className={`w-full text-left px-3 py-3 rounded-md text-sm hover:bg-gray-50 transition-colors border ${
                      user?.name === userData.name
                        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300'
                        : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{userData.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center space-x-2">
                            <span>{userData.name}</span>
                            {user?.name === userData.name && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                                Actuel
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{userData.email}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {getPermissionSummary(userData.role)}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          userData.role,
                        )}`}
                      >
                        {userData.role}
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


// Interface commune pour tous les utilisateurs
interface DevUserData {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'PREMIUM' | 'MODERATOR';
}

// Utilisateurs de test avec interface commune
export const DEV_USERS: Record<string, DevUserData> = {
  admin: {
    id: 'dev-admin-id',
    username: 'admin',
    email: 'admin@conlang.local',
    role: 'ADMIN',
  },
  user: {
    id: 'dev-user-id', 
    username: 'alice',
    email: 'alice@conlang.local',
    role: 'USER',
  },
  premium: {
    id: 'dev-premium-id',
    username: 'bob',
    email: 'bob@conlang.local', 
    role: 'PREMIUM',
  },
  moderator: {
    id: 'dev-moderator-id',
    username: 'charlie',
    email: 'charlie@conlang.local',
    role: 'MODERATOR',
  },
};

export type DevUserKey = keyof typeof DEV_USERS;
export type DevUser = DevUserData;

// Récupérer l'utilisateur actif pour le développement
export function getDevUser(): DevUser {
  // Côté serveur ou si localStorage n'est pas disponible : utilisateur par défaut
  if (typeof window === 'undefined') {
    return DEV_USERS.premium; // Par défaut premium pour tester les features IA
  }
  
  try {
    // Côté client : récupérer depuis localStorage
    const savedUser = localStorage.getItem('dev-user');
    if (savedUser && savedUser in DEV_USERS) {
      return DEV_USERS[savedUser];
    }
  } catch (error) {
    // Fallback si localStorage n'est pas accessible
    console.warn('Cannot access localStorage:', error);
  }
  
  return DEV_USERS.premium; // Par défaut
}

// Changer d'utilisateur de développement
export function setDevUser(userKey: DevUserKey) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dev-user', userKey);
    // Recharger la page pour appliquer les changements
    window.location.reload();
  }
}

// Hook pour l'auth en développement
export function useDevAuth() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('useDevAuth should only be used in development');
  }

  const devUser = getDevUser();
  
  return {
    user: devUser,
    role: devUser.role,
    isAuthenticated: true,
    isLoading: false,
    switchUser: setDevUser,
    availableUsers: Object.keys(DEV_USERS) as DevUserKey[],
  };
}

// Simuler une session NextAuth pour le développement
export function createDevSession(userKey?: DevUserKey) {
  const user = userKey ? DEV_USERS[userKey] : getDevUser();
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.username,
      role: user.role,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
  };
}